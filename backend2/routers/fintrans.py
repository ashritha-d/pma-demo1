from flask import request, jsonify, session, redirect, url_for, render_template, send_file, send_from_directory, Response, Blueprint
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime, date
import base64
import decimal
import smtplib
from email.message import EmailMessage
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import requests

fintrans_bp = Blueprint('fintrans', __name__)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

@fintrans_bp.route("/")
def home():
    return "Backend + Database connected!"
# ------------------ DATABASE CONNECTION ------------------
    
def get_owners_db():
    """Connect to 'owners' database for owner pages"""
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="ashu",
            database="owners"
        )
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Error connecting to 'owners' database: {e}")
        return None
@fintrans_bp.route("/add_fintrans", methods=["POST"])
def add_fintrans():
    try:
        connection = get_owners_db()
        cursor = connection.cursor(dictionary=True)

        data = request.get_json()
        print("AddFinTrans JSON Data:", data)

        def none_if_empty(value):
            return value if value not in ("", None) else None

        query = """
            INSERT INTO FinTrans (
                PropertyCode, TenancyContractNumber, ReceiptPayment, ReceiptPaymentReason,
                ModeOfPayment, TrDate, TrAmount, ReferenceNumber, ChequeDate,
                BankName, BankCity, IFSCCode, ChequeStatus, CreatedBy, CreationDate
            )
            VALUES (
                %(PropertyCode)s, %(TenancyContractNumber)s, %(ReceiptPayment)s, %(ReceiptPaymentReason)s,
                %(ModeOfPayment)s, %(TrDate)s, %(TrAmount)s, %(ReferenceNumber)s, %(ChequeDate)s,
                %(BankName)s, %(BankCity)s, %(IFSCCode)s, %(ChequeStatus)s, %(CreatedBy)s, CURDATE()
            )
        """

        params = {
            "PropertyCode": none_if_empty(data.get("property_code")),
            "TenancyContractNumber": none_if_empty(data.get("contract_id")),
            "ReceiptPayment": none_if_empty(data.get("receipt_payment")),
            "ReceiptPaymentReason": none_if_empty(data.get("receipt_payment_reason")),
            "ModeOfPayment": none_if_empty(data.get("mode_of_payment")),
            "TrDate": none_if_empty(data.get("tr_date")),
            "TrAmount": none_if_empty(data.get("tr_amount")),
            "ReferenceNumber": none_if_empty(data.get("reference_number")),
            "ChequeDate": none_if_empty(data.get("cheque_date")),
            "BankName": none_if_empty(data.get("bank_name")),
            "BankCity": none_if_empty(data.get("bank_city")),
            "IFSCCode": none_if_empty(data.get("ifsc_code")),
            "ChequeStatus": none_if_empty(data.get("cheque_status")),
            "CreatedBy": none_if_empty(data.get("created_by", "admin")),
        }

        print("Insert Params:", params)
        cursor.execute(query, params)

        # -----------------------------
        # UPDATE contract_master
        # -----------------------------
        reason = (params.get("ReceiptPaymentReason") or "").lower()
        amount = params.get("TrAmount")
        mode = params.get("ModeOfPayment")
        contract_id = params.get("TenancyContractNumber")

        if contract_id and amount:
            if reason == "rent":
                cursor.execute("""
                    UPDATE contract_master
                    SET rent_amount = %s,
                        rent_payment_mode = %s
                    WHERE contract_id = %s
                """, (amount, mode, contract_id))

            elif reason in ("rent deposit", "deposit", "rent_deposit"):
                cursor.execute("""
                    UPDATE contract_master
                    SET deposit_amount = %s,
                        deposit_payment_type = %s
                    WHERE contract_id = %s
                """, (amount, mode, contract_id))

        # ✅ COMMIT FOR BOTH RENT AND DEPOSIT
        connection.commit()

        print("SUCCESS Transaction added + Contract updated!")
        return jsonify({"success": True, "message": "Transaction added successfully!"})

    except Exception as e:
        print("❌ Error in /add_fintrans:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        connection.close()
@fintrans_bp.route("/add_fin", methods=["POST"])
def add_fin():
    try:
        connection = get_owners_db()
        cursor = connection.cursor(dictionary=True)

        data = request.get_json()
        print("📥 AddFin Data:", data)

        def none_if_empty(value):
            return value if value not in ("", None) else None

        # -----------------------------------
        # INSERT INTO FinTrans
        # -----------------------------------
        insert_query = """
            INSERT INTO FinTrans (
                PropertyCode, TenancyContractNumber, ReceiptPayment, ReceiptPaymentReason,
                ModeOfPayment, TrDate, TrAmount, ReferenceNumber, ChequeDate,
                BankName, BankCity, IFSCCode, ChequeStatus, CreatedBy, CreationDate
            )
            VALUES (
                %(PropertyCode)s, %(TenancyContractNumber)s, %(ReceiptPayment)s, %(ReceiptPaymentReason)s,
                %(ModeOfPayment)s, %(TrDate)s, %(TrAmount)s, %(ReferenceNumber)s, %(ChequeDate)s,
                %(BankName)s, %(BankCity)s, %(IFSCCode)s, %(ChequeStatus)s, %(CreatedBy)s, CURDATE()
            )
        """

        params = {
            "PropertyCode": none_if_empty(data.get("PropertyCode") or data.get("property_id")),
            "TenancyContractNumber": none_if_empty(data.get("TenancyContractNumber") or data.get("contract_id")),
"ReceiptPayment": none_if_empty(data.get("ReceiptPayment") or data.get("receipt_payment")),
            "ReceiptPaymentReason": none_if_empty(data.get("ReceiptPaymentReason")),
            "ModeOfPayment": none_if_empty(data.get("ModeOfPayment")),
            "TrDate": none_if_empty(data.get("TrDate")),
            "TrAmount": none_if_empty(data.get("TrAmount")),
            "ReferenceNumber": none_if_empty(data.get("ReferenceNumber")),
            "ChequeDate": none_if_empty(data.get("ChequeDate")),
            "BankName": none_if_empty(data.get("BankName")),
            "BankCity": none_if_empty(data.get("BankCity")),
            "IFSCCode": none_if_empty(data.get("IFSCCode")),
            "ChequeStatus": none_if_empty(data.get("ChequeStatus")),
            "CreatedBy": none_if_empty(data.get("CreatedBy", "admin")),
        }

        cursor.execute(insert_query, params)

        # -----------------------------------
        # UPDATE CONTRACT MASTER
        # -----------------------------------
        reason = (params.get("ReceiptPaymentReason") or "").strip().lower()
        amount = params.get("TrAmount")
        mode = params.get("ModeOfPayment")
        contract_id = params.get("TenancyContractNumber")

        print("🔍 Reason:", reason, "Amount:", amount, "Mode:", mode, "CID:", contract_id)

        if contract_id and amount:

            # Rent Update
            if reason == "rent":
                update_query = """
                    UPDATE contract_master
                    SET rent_amount = %s,
                        rent_payment_mode = %s
                    WHERE contract_id = %s
                """
                cursor.execute(update_query, (amount, mode, contract_id))
                print("🏷️ Rent Updated!")

            # Deposit Update
            elif reason in ("rent deposit", "deposit", "rent_deposit"):
                update_query = """
                    UPDATE contract_master
                    SET deposit_amount = %s,
                        deposit_payment_type = %s
                    WHERE contract_id = %s
                """
                cursor.execute(update_query, (amount, mode, contract_id))
                print("💰 Deposit Updated!")

        connection.commit()
        return jsonify({"success": True, "message": "Transaction added and contract updated!"})

    except Exception as e:
        print("❌ Error in /add_fin:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        connection.close()

@fintrans_bp.route("/get_contract/<int:contract_id>")
def get_contract_by_id(contract_id):
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM contract_master WHERE contract_id = %s", (contract_id,))
        contract = cursor.fetchone()
        conn.close()
        if contract:
            return jsonify({"success": True, "contract": contract})
        else:
            return jsonify({"success": False, "message": "Contract not found"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
@fintrans_bp.route("/get_contract_details/<int:contract_id>")
def get_contract_details(contract_id):
    try:
        print(f"🔍 Fetching details for contract_id={contract_id}")
        connection = get_owners_db()
        cursor = connection.cursor(dictionary=True)

        # Use proper column names and alias property_id → property_code
        cursor.execute("""
            SELECT 
                contract_id,
             property_id,
                tenant_id,
                tenant_name
            FROM contract_master
            WHERE contract_id = %s
        """, (contract_id,))
        
        result = cursor.fetchone()

        cursor.close()
        connection.close()

        if result:
            print("✅ Contract found:", result)
            return jsonify(result)
        else:
            print("⚠️ No contract found")
            return jsonify({"message": "Contract not found"}), 404

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("❌ Error fetching contract details:", e)
        return jsonify({"message": "Error fetching contract details", "error": str(e)}), 500

# def create_contract_internal(contract_data):
#     conn = get_owners_db()
#     cursor = conn.cursor()

#     # Extract safely
#     property_id = safe(contract_data.get("property_code"))
#     tenant_id = safe(contract_data.get("tenant_id"))
#     tenant_name = safe(contract_data.get("tenant_name"))
#     contract_start_date = safe(contract_data.get("contract_start_date"))
#     contract_end_date = safe(contract_data.get("contract_end_date"))
#     rent_amount = safe(contract_data.get("rent_amount"))
#     deposit_amount = safe(contract_data.get("deposit_amount"))
#     created_by = safe(contract_data.get("created_by", "admin"))
#     creation_date = safe(contract_data.get("creation_date", datetime.now().date().isoformat()))

#     cursor.execute("""
#         INSERT INTO contract_master (
#             property_id, tenant_id, tenant_name,
#             contract_start_date, contract_end_date,
#             rent_amount, deposit_amount, created_by, creation_date
#         )
#         VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
#     """, (
#         property_id, tenant_id, tenant_name,
#         contract_start_date, contract_end_date,
#         rent_amount, deposit_amount, created_by, creation_date
#     ))
#     conn.commit()
#     cursor.close()
#     conn.close()
#     return {"status": "success", "contract_for": tenant_name}

def get_contract_details(contract_id):
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 1️⃣ Fetch from contract_master
        cursor.execute("""
            SELECT 
                cm.contract_id,
                cm.property_id,
                cm.tenant_id,
                cm.tenant_name,
                cm.contract_start_date,
                cm.contract_end_date,
                cm.contract_termination_date,
                cm.move_in_date,
                cm.move_out_date,
                cm.first_time_move_in_date,
                cm.contract_renewal_date,
                cm.rent_amount,
                cm.deposit_amount,
                cm.new_or_old_tenant,
                cm.created_by,
                cm.creation_date
            FROM contract_master cm
            WHERE cm.contract_id = %s
        """, (contract_id,))
        contract = cursor.fetchone()

        if not contract:
            return jsonify({"success": False, "message": "Contract not found"}), 404

        # 2️⃣ Fetch related Property info
        cursor.execute("""
            SELECT property_code, building_name, building_type
            FROM property
            WHERE property_code = %s
        """, (contract["property_id"],))
        property_info = cursor.fetchone()

        # 3️⃣ Fetch related Tenancy Contract
        cursor.execute("""
            SELECT TenancyContractNumber
            FROM TenancyContracts
            WHERE PropertyCode = %s AND TenantName = %s
            ORDER BY CreationDate DESC
            LIMIT 1
        """, (contract["property_id"], contract["tenant_name"]))
        tenancy_info = cursor.fetchone()

        tenancy_contract_number = tenancy_info["TenancyContractNumber"] if tenancy_info else None

        # 4️⃣ Response
        result = {
            "success": True,
            "contract": {
                "contract_id": contract["contract_id"],
                "property_id": contract["property_id"],
                "tenant_id": contract["tenant_id"],
                "tenant_name": contract["tenant_name"],
                "tenancy_contract_number": tenancy_contract_number,
                "contract_start_date": contract["contract_start_date"],
                "contract_end_date": contract["contract_end_date"],
                "rent_amount": contract["rent_amount"],
                "deposit_amount": contract["deposit_amount"],
                "new_or_old_tenant": contract["new_or_old_tenant"],
                "created_by": contract["created_by"],
                "creation_date": contract["creation_date"]
            },
            "property": property_info
        }

        return jsonify(result)

    except Exception as e:
        print("❌ Error fetching contract:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()
@fintrans_bp.route("/property/<int:property_code>")
def get_property_details(property_code):
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        # Fetch property
        cursor.execute("SELECT * FROM property WHERE property_code = %s", (property_code,))
        property_data = cursor.fetchone()
        if not property_data:
            return jsonify({"success": False, "message": "Property not found"})

        # Convert binary fields to base64
        if property_data.get("property_photo"):
            property_data["property_photo"] = base64.b64encode(property_data["property_photo"]).decode("utf-8")

        # Fetch latest contract and tenant for that property
        cursor.execute("""
            SELECT c.*, t.TenantName AS tenant_name, t.TenancyContractNumber AS tenant_id
            FROM contract_master c
            JOIN TenancyContracts t ON c.tenant_id = t.TenancyContractNumber
            WHERE c.property_id = %s
            ORDER BY c.contract_start_date DESC
            LIMIT 1
        """, (property_code,))
        contract_data = cursor.fetchone()

        return jsonify({
            "success": True,
            "property": property_data,
            "contract": contract_data,
            "tenant": {
                "tenant_name": contract_data["tenant_name"] if contract_data else None,
                "tenant_id": contract_data["tenant_id"] if contract_data else None,
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@fintrans_bp.route("/fintrans/<int:ref_no>", methods=["GET"])
def get_fintrans(ref_no):
    """Fetch transaction + tenant name"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT f.*, t.TenantName
            FROM FinTrans f
            LEFT JOIN TenancyContracts t ON f.TenancyContractNumber = t.TenancyContractNumber
            WHERE f.FinTransRefNo = %s
        """
        cursor.execute(query, (ref_no,))
        record = cursor.fetchone()

        if not record:
            return jsonify({"success": False, "message": "Transaction not found"}), 404

        return jsonify({"success": True, "transaction": record})

    except mysql.connector.Error as err:
        print("DB Error:", err)
        return jsonify({"success": False, "message": str(err)}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@fintrans_bp.route("/modify_fintrans", methods=["POST"])
def modify_fintrans():
    """Update financial transaction"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        fintrans_refno = request.form.get("FinTransRefNo")
        if not fintrans_refno:
            return jsonify({"success": False, "message": "Missing transaction reference number!"}), 400

        cursor = conn.cursor()

        update_fields = [
            "ReceiptPayment", "ReceiptPaymentReason", "ModeOfPayment", "TrDate",
            "TrAmount", "ReferenceNumber", "ChequeDate", "BankName",
            "BankCity", "IFSCCode", "ChequeStatus"
        ]

        # Prepare query dynamically
        placeholders = [f"{field} = %s" for field in update_fields]
        values = [request.form.get(field) or None for field in update_fields]
        values.append(fintrans_refno)  # For WHERE clause

        query = f"""
            UPDATE FinTrans
            SET {', '.join(placeholders)}
            WHERE FinTransRefNo = %s
        """

        cursor.execute(query, values)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"success": False, "message": "No transaction found to update!"}), 404

        return jsonify({"success": True, "message": "✅ Financial transaction updated successfully!"})

    except mysql.connector.Error as err:
        print("DB Error:", err)
        return jsonify({"success": False, "message": str(err)}), 500

    except Exception as e:
        print("General Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def json_safe(value):
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8")
        except UnicodeDecodeError:
            return value.decode("utf-8", errors="ignore")  # skip invalid bytes
    if isinstance(value, (Decimal, float)):
        return float(value)
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    return value

@fintrans_bp.route("/fintrans_list", methods=["GET"])
def fintrans_list():
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "DB connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT f.*, t.TenantName
            FROM FinTrans f
            LEFT JOIN TenancyContracts t ON f.TenancyContractNumber = t.TenancyContractNumber
            ORDER BY f.FinTransRefNo DESC
        """
        cursor.execute(query)
        records = cursor.fetchall()

        safe_records = [
            {k: json_safe(v) for k, v in row.items()}
            for row in records
        ]

        return jsonify({"success": True, "transactions": safe_records})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@fintrans_bp.route("/search_fintrans", methods=["GET"])
def search_fintrans():
    query = request.args.get("query", "").strip()
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "DB connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT f.*, t.TenantName
            FROM FinTrans f
            LEFT JOIN TenancyContracts t ON f.TenancyContractNumber = t.TenancyContractNumber
            WHERE f.PropertyCode LIKE %s OR f.FinTransRefNo LIKE %s
            ORDER BY f.FinTransRefNo DESC
        """
        cursor.execute(sql, (f"%{query}%", f"%{query}%"))
        results = cursor.fetchall()

        safe_results = [
            {k: json_safe(v) for k, v in row.items()}
            for row in results
        ]

        return jsonify({"success": True, "transactions": safe_results})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
