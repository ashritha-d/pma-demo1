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

contract_bp = Blueprint('contract', __name__)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "E1UMKLugcr56mWRo29inb4FDBfYQPsASdlN7xkOyvqeJVtaTjZF3anH6sXV9K0pGlfDoBErSWuv5yT7N")

@contract_bp.route("/")
def home():
    return "Backend + Database connected!"
# ------------------ DATABASE CONNECTION ------------------
    
def get_owners_db():
    """Connect to 'owners' database for owner pages"""
    try:
        conn = mysql.connector.connect(
            host=os.environ.get("DB_HOST", "localhost"),
            user=os.environ.get("DB_USER", "root"),
            password=os.environ.get("DB_PASSWORD", "ashu"),
            database=os.environ.get("DB_NAME_OWNERS", "owners")
        )
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Error connecting to 'owners' database: {e}")
        return None
@contract_bp.route("/add_contract", methods=["POST"])
def add_contract():
    data = request.get_json()
    conn = get_owners_db()
    cur = conn.cursor()

    # Fields expected from frontend
    fields = [
        "property_code", "tenant_id", "tenant_name",
        "contract_start_date", "contract_end_date",
        "rent_amount", "deposit_amount", "notice_period",
        "rent_payment_mode", "rent_payment_type",
        "deposit_payment_type", "new_or_old_tenant",
        "rent_due_day", "created_by"
    ]

    sanitized_data = {field: (data.get(field) or None) for field in fields}

    # Auto-filled system fields
    sanitized_data.update({
        "move_in_date": sanitized_data["contract_start_date"],
        "first_time_move_in_date": sanitized_data["contract_start_date"],
        "contract_termination_date": sanitized_data["contract_end_date"],
        "move_out_date": sanitized_data["contract_end_date"],
        "contract_renewal_date": sanitized_data["contract_end_date"],
        "contract_close_date": sanitized_data["contract_end_date"]
    })

    insert_query = """
        INSERT INTO contract_master 
        (property_id, tenant_id, tenant_name,
         contract_start_date, contract_end_date,
         rent_amount, deposit_amount, notice_period,
         rent_payment_mode, rent_payment_type, deposit_payment_type,
         new_or_old_tenant, rent_due_day, created_by,
         move_in_date, first_time_move_in_date, contract_termination_date,
         move_out_date, contract_renewal_date, contract_close_date)
        VALUES 
        (%(property_code)s, %(tenant_id)s, %(tenant_name)s,
         %(contract_start_date)s, %(contract_end_date)s,
         %(rent_amount)s, %(deposit_amount)s, %(notice_period)s,
         %(rent_payment_mode)s, %(rent_payment_type)s, %(deposit_payment_type)s,
         %(new_or_old_tenant)s, %(rent_due_day)s, %(created_by)s,
         %(move_in_date)s, %(first_time_move_in_date)s, %(contract_termination_date)s,
         %(move_out_date)s, %(contract_renewal_date)s, %(contract_close_date)s)
    """

    cur.execute(insert_query, sanitized_data)
    conn.commit()
    contract_id = cur.lastrowid

    cur.close()
    conn.close()

    return jsonify({"success": True, "contract_id": contract_id})
# ----------------- GET PROPERTY BY CODE -----------------
@contract_bp.route("/property/<int:property_code>", methods=["GET"])
def get_property(property_code):
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM property WHERE property_code = %s", (property_code,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if result:
            # ✅ Convert BLOB (photo) to base64
            if result.get("property_photo"):
                result["property_photo"] = base64.b64encode(result["property_photo"]).decode("utf-8")

            return jsonify({
                "success": True,
                "property": result
            })
        else:
            return jsonify({
                "success": False,
                "message": "Property not found"
            }), 404

    except Exception as e:
        print("❌ Error in /property/<property_code>:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ----------------- GET TENANT BY CODE -----------------
@contract_bp.route("/tenant/<int:tenant_code>", methods=["GET"])
def get_tenant(tenant_code):
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM TenancyContracts WHERE TenancyContractNumber = %s",
            (tenant_code,)
        )
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if result:
            # Convert BLOB fields to base64 strings
            blob_fields = [
                "PassportCopyPath",
                "EIDCopyPath",
                "ResidenceVisaCopyPath",
                "BankStatementCopyPath",
                "DepositChequeCopyPath",
                "SecurityChequeCopyPath",
                "EjariMunicipalRegistrationCopyPath"
            ]
            for field in blob_fields:
                if result.get(field):
                    result[field] = base64.b64encode(result[field]).decode("utf-8")

            # ✅ Wrap in success + tenant key
            return jsonify({
                "success": True,
                "tenant": result
            })
        else:
            return jsonify({
                "success": False,
                "message": "Tenant not found"
            }), 404

    except Exception as e:
        print("❌ Error fetching tenant:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ---------------- GET Contract ----------------
@contract_bp.route("/contract/<int:contract_id>", methods=["GET"])
def get_contract(contract_id):
    try:
        conn = get_owners_db()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM contract_master WHERE contract_id=%s", (contract_id,))
        contract_data = cur.fetchone()

        # Convert BLOBs to base64
        blob_fields = ["DepositChequeCopyPath", "EIDCopyPath", "BankStatementCopyPath"]
        if contract_data:
            for field in blob_fields:
                if contract_data.get(field):
                    contract_data[field] = base64.b64encode(contract_data[field]).decode("utf-8")

        cur.close()
        conn.close()

        if contract_data:
            return jsonify({"success": True, "contract": contract_data})
        else:
            return jsonify({"success": False, "message": "Contract not found"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@contract_bp.route("/modify_contract", methods=["POST"])
def modify_contract():
    try:
        conn = get_owners_db()
        cur = conn.cursor(dictionary=True)

        contract_id = request.form.get("contract_id")
        if not contract_id:
            return jsonify({"success": False, "message": "Contract ID required"}), 400

        # --- Update base contract details ---
        update_query = """
            UPDATE contract_master SET
                property_id=%s,
                tenant_id=%s,
                tenant_name=%s,
                contract_start_date=%s,
                contract_end_date=%s,
                contract_termination_date=%s,
                move_in_date=%s,
                move_out_date=%s,
                notice_period=%s,
                new_or_old_tenant=%s,
                created_by=%s,
                creation_date=%s,
                contract_renewal_date=%s,
                first_time_move_in_date=%s,
                rent_due_day=%s
            WHERE contract_id=%s
        """

        data = (
            request.form.get("property_id") or None,
            request.form.get("tenant_id") or None,
            request.form.get("tenant_name") or None,
            request.form.get("contract_start_date") or None,
            request.form.get("contract_end_date") or None,
            request.form.get("contract_termination_date") or None,
            request.form.get("move_in_date") or None,
            request.form.get("move_out_date") or None,
            request.form.get("notice_period") or None,
            request.form.get("new_or_old_tenant") or None,
            request.form.get("created_by") or "admin",
            request.form.get("creation_date") or date.today(),
            request.form.get("contract_renewal_date") or None,
            request.form.get("first_time_move_in_date") or None,
            request.form.get("rent_due_day") or None,
            contract_id
        )
        cur.execute(update_query, data)
        conn.commit()

        # --- Fetch rent/deposit details from FinTrans ---
        fin_query = """
            SELECT
                MAX(CASE WHEN ReceiptPaymentReason = 'Rent' THEN TrAmount END) AS rent_amount,
                MAX(CASE WHEN ReceiptPaymentReason = 'Rent' THEN ModeOfPayment END) AS rent_payment_mode,
                MAX(CASE WHEN ReceiptPaymentReason IN ('Rent Deposit','Deposit') THEN TrAmount END) AS deposit_amount,
                MAX(CASE WHEN ReceiptPaymentReason IN ('Rent Deposit','Deposit') THEN ModeOfPayment END) AS deposit_payment_type
            FROM FinTrans
            WHERE TenancyContractNumber = %s
        """
        cur.execute(fin_query, (contract_id,))
        fintrans = cur.fetchone()

        print("🔍 FinTrans query result for contract_id =", contract_id, "=>", fintrans)

        # --- If data exists, update contract with it ---
        if fintrans and any(fintrans.values()):
            print("✅ Updating contract_master with:", fintrans)
            cur.execute("""
                UPDATE contract_master SET
                    rent_amount = %s,
                    rent_payment_mode = %s,
                    deposit_amount = %s,
                    deposit_payment_type = %s
                WHERE contract_id = %s
            """, (
                fintrans["rent_amount"],
                fintrans["rent_payment_mode"],
                fintrans["deposit_amount"],
                fintrans["deposit_payment_type"],
                contract_id,
            ))
            conn.commit()
        else:
            print("⚠️ No FinTrans data found for this contract!")

        return jsonify({
            "success": True,
            "message": "Contract updated successfully",
            "fintrans": fintrans
        })

    except Exception as e:
        print("❌ Modify contract error:", e)
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cur.close()
        conn.close()
@contract_bp.route("/generate_update", methods=["POST"])
def generate_update():
    data = request.get_json()
    contract_id = data.get("contract_id")

    if not contract_id:
        return jsonify({"success": False, "message": "Contract ID missing"}), 400

    conn = get_owners_db()
    cur = conn.cursor()

    try:
        cur.execute("""
            UPDATE contract_master
            SET generate_contract = 'yes'
            WHERE contract_id = %s
        """, (contract_id,))
        conn.commit()
        return jsonify({"success": True, "message": "Contract marked as generated"})
    except Exception as e:
        print("Error:", e)
        conn.rollback()
        return jsonify({"success": False, "message": str(e)})
    finally:
        cur.close()
        conn.close()
@contract_bp.route("/send_contract_email", methods=["POST"])
def send_contract_email_route():
    data = request.get_json()
    contract_id = data.get("contract_id")

    if not contract_id:
        return jsonify({"success": False, "message": "Contract ID missing"}), 400

    conn = get_owners_db()
    cur = conn.cursor(dictionary=True)

    email_result = None
    sms_result = None

    try:
        # 1️⃣ Fetch contract
        cur.execute("SELECT * FROM contract_master WHERE contract_id = %s", (contract_id,))
        contract = cur.fetchone()
        if not contract:
            return jsonify({"success": False, "message": "Contract not found"}), 404

        # 2️⃣ Fetch tenant details
        cur.execute("""
            SELECT TenantEmailID, TenantName, TenantMobileNumber
            FROM tenancycontracts
            WHERE TenancyContractNumber = %s
        """, (contract["tenant_id"],))
        tenant = cur.fetchone()

        if not tenant:
            return jsonify({"success": False, "message": "Tenant record not found"}), 404

        if tenant.get("TenantEmailID"):
            # 🚀 SEND EMAIL
            try:
                send_contract_email(
                    to_email=tenant["TenantEmailID"],
                    tenant_name=tenant["TenantName"],
                    contract_data=contract,
                )
                print(f"📧 Email sent to {tenant['TenantEmailID']}")
                email_result = "Email sent successfully"
            except Exception as e:
                print("❌ Email sending error:", e)
                email_result = f"Email failed: {e}"

        else:
            email_result = "No tenant email found"

        # 🚀 SEND SMS
        if tenant.get("TenantMobileNumber"):
            sms_message = (
                f"Dear {tenant['TenantName']},\n"
                f"Your tenancy contract has been updated.\n\n"
                f"Contract ID: {contract['contract_id']}\n"
                f"Property: {contract.get('property_id','N/A')}\n"
                f"Lease: {contract.get('contract_start_date','N/A')} to {contract.get('contract_end_date','N/A')}\n"
                f"Rent Amount: ₹{contract.get('rent_amount','0')}\n"
                f"Payment Mode: {contract.get('rent_payment_mode','N/A')}\n"
                f"Thank you,\nProperty Management Team"
            )
            try:
                sms_result = send_sms_fast2sms(
                    phone=tenant["TenantMobileNumber"],
                    message=sms_message
                )
                print("📩 SMS Result:", sms_result)
            except Exception as e:
                sms_result = f"SMS failed: {e}"
                print("❌ SMS error:", e)
        else:
            sms_result = "No tenant mobile number found"

        # ✅ Update DB
        cur.execute("""
            UPDATE contract_master
            SET send_email = 'yes', generate_contract = 'yes'
            WHERE contract_id = %s
        """, (contract_id,))

        cur.execute("""
            UPDATE property
            SET status = 'occupied'
            WHERE property_code = %s
        """, (contract["property_id"],))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Email + SMS attempted",
            "email_result": email_result,
            "sms_result": sms_result
        })

    except Exception as e:
        conn.rollback()
        print("❌ Route error:", e)
        return jsonify({"success": False, "message": str(e)})

    finally:
        cur.close()
        conn.close()
def send_contract_email(to_email, tenant_name, contract_data):
    """Send contract update email to the tenant."""
    msg = EmailMessage()
    msg["Subject"] = f"📑 Contract Update - Contract ID {contract_data['contract_id']}"
    msg["From"] = "pma503867@gmail.com"
    msg["To"] = to_email

    msg.set_content(f"""
    Dear {tenant_name},

    Your contract has been successfully updated.

    🏠 Contract Details:
    ----------------------------------
    Contract ID: {contract_data['contract_id']}
    Property ID: {contract_data.get('property_id', 'N/A')}
    Rent Amount: {contract_data.get('rent_amount', 0)}
    Start Date: {contract_data.get('contract_start_date', 'N/A')}
    End Date: {contract_data.get('contract_end_date', 'N/A')}
    Payment Mode: {contract_data.get('rent_payment_mode', 'N/A')}

    Thank you,
    Property Management Team
    """)

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(os.environ.get("EMAIL_USER", "pma503867@gmail.com"), os.environ.get("EMAIL_PASSWORD", "wgszwpkdgvtebkkt"))
        smtp.send_message(msg)


import requests

FAST2SMS_API_KEY = "E1UMKLugcr56mWRo29inb4FDBfYQPsASdlN7xkOyvqeJVtaTjZF3anH6sXV9K0pGlfDoBErSWuv5yT7N"

def send_sms_fast2sms(phone, message):
    """
    Send SMS using Fast2SMS API v3.
    Returns the API response as a dict.
    """
    if not FAST2SMS_API_KEY:
        print("❌ Fast2SMS API Key missing!")
        return {"error": "API key not found"}

    message = message[:450]  # Limit message length

    url = "https://www.fast2sms.com/dev/bulkV2"

    payload = {
        "route": "v3",
        "sender_id": "FSTSMS",          # Make sure this is approved in Fast2SMS
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": str(phone)           # Must be string of comma-separated numbers
    }

    headers = {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
    }

    try:
        # ✅ Use `data=` not `json=` for x-www-form-urlencoded
        response = requests.post(url, data=payload, headers=headers, timeout=10)
        response.raise_for_status()
        print("📩 Fast2SMS Response:", response.text)
        return response.json()
    except requests.exceptions.RequestException as e:
        print("❌ SMS sending error:", e)
        return {"error": str(e)}
    # ------------------- Delete Contract -------------------
@contract_bp.route("/delete_contract", methods=["POST"])
def delete_contract():
    try:
        contract_id = request.form.get("contract_id")
        if not contract_id:
            return jsonify({"success": False, "message": "Contract ID required"}), 400

        conn = get_owners_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM contract_master WHERE contract_id=%s", (contract_id,))
        conn.commit()
        cursor.close()
        conn.close()

        if cursor.rowcount > 0:
            return jsonify({"success": True, "message": f"Contract {contract_id} deleted successfully"})
        else:
            return jsonify({"success": False, "message": "Contract not found"})
    except Exception as e:
        print("❌ Error deleting contract:", e)
        return jsonify({"success": False, "message": str(e)}), 500
# ----------------- LIST CONTRACTS -----------------
@contract_bp.route("/list_contracts", methods=["GET"])
def list_contracts():
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        # ✅ Join contract_master with property_master to fetch property details
        query = """
        SELECT 
            c.contract_id,
            p.property_code,
            p.Building_Name,
        
            c.tenant_id,
            c.tenant_name,
            c.contract_start_date,
            c.contract_end_date,
            c.move_in_date,
            c.move_out_date,
            c.rent_amount,
            c.deposit_amount,
            c.rent_payment_mode,
            c.rent_payment_type,
            c.deposit_payment_type,
            c.notice_period,
            c.new_or_old_tenant,
            c.generate_contract,
            c.send_email,
            c.contract_status,
            c.contract_renewal_date,
            c.contract_close_date,
            c.creation_date,
            c.created_by,
            c.remarks,
            c.total_rent_amount,
            c.total_rent_received,
            c.total_rent_to_be_received
        FROM contract_master c
        LEFT JOIN property p ON c.property_id = p.property_code
        ORDER BY c.contract_id DESC
        """
        cursor.execute(query)
        contracts = cursor.fetchall()

        # ✅ Convert DATE fields to string format
        date_fields = [
            "contract_start_date",
            "contract_end_date",
            "move_in_date",
            "move_out_date",
            "contract_renewal_date",
            "contract_close_date",
            "creation_date",
        ]
        for contract in contracts:
            for field in date_fields:
                if contract.get(field):
                    contract[field] = contract[field].strftime("%Y-%m-%d")

        cursor.close()
        conn.close()

        return jsonify({"success": True, "contracts": contracts})

    except Exception as e:
        print("❌ Error fetching contracts:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# ---------- Helper Function ----------
def safe_convert(value):
    """Convert bytes safely to JSON-serializable value"""
    if isinstance(value, bytes):
        # Try to decode as text first, else base64
        try:
            return value.decode("utf-8")
        except UnicodeDecodeError:
            return base64.b64encode(value).decode("utf-8")
    return value

@contract_bp.route("/view_property/<int:property_code>", methods=["GET"])
def view_property(property_code):
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        # Fetch property
        cursor.execute("SELECT * FROM property WHERE property_code = %s", (property_code,))
        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Property not found"})

        # Convert keys to lowercase + safely convert bytes
        property_data = {k.lower(): safe_convert(v) for k, v in row.items()}

        # Handle property photo separately
        if property_data.get("property_photo"):
            # Re-encode as Base64 if it was binary
            if not property_data["property_photo"].startswith("/9j/"):
                property_data["property_photo"] = base64.b64encode(row["property_photo"]).decode("utf-8")
        else:
            property_data["property_photo"] = None

        # Fetch tenant (if assigned)
        tenant_data = None
        tenant_id = property_data.get("tenant_id")
        if tenant_id:
            cursor.execute("SELECT * FROM tenancycontracts WHERE tenancycontractnumber = %s", (tenant_id,))
            tenant_row = cursor.fetchone()
            if tenant_row:
                tenant_data = {k.lower(): safe_convert(v) for k, v in tenant_row.items()}

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "property": property_data,
            "tenant": tenant_data
        })

    except Exception as e:
        print("❌ Backend error:", e)
        return jsonify({"success": False, "message": f"Error fetching property: {str(e)}"})


# ---------- Helper: Lowercase Keys ----------
def dict_lowercase_keys(row):
    if not row:
        return None
    return {k.lower(): v for k, v in row.items()}

# ---------- /view_tenant/<tenant_id> ----------
@contract_bp.route("/view_tenant/<int:tenant_id>", methods=["GET"])
def view_tenant(tenant_id):
    conn = None
    cursor = None
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        # Fetch tenant
        cursor.execute("SELECT * FROM tenancycontracts WHERE tenancycontractnumber = %s", (tenant_id,))
        tenant_row = cursor.fetchone()

        if not tenant_row:
            return jsonify({"success": False, "message": "Tenant not found"})

        tenant_data = dict_lowercase_keys(tenant_row)

        # ✅ Convert ANY bytes field to Base64 automatically
        for key, value in tenant_data.items():
            if isinstance(value, (bytes, bytearray)):
                tenant_data[key] = base64.b64encode(value).decode("utf-8")

        return jsonify({"success": True, "tenant": tenant_data})

    except Exception as e:
        print("Error fetching tenant:", e)
        return jsonify({"success": False, "message": f"Error fetching tenant: {e}"})
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

