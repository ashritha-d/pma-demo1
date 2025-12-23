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

tenant_bp = Blueprint('tenant', __name__)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

@tenant_bp.route("/")
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
@tenant_bp.route("/add_tenant", methods=["POST"])
def add_tenant():
    try:
        conn = get_owners_db()
        cursor = conn.cursor()

        # Read uploaded files as binary
        def read_file(field_name):
            file = request.files.get(field_name)
            if file and file.filename:
                return file.read()  # read binary
            return None

        data = (
            request.form.get("tenant_name"),
            request.form.get("tenant_dob"),
            request.form.get("tenant_nationality"),
            request.form.get("tenant_passport_number"),
            request.form.get("tenant_emirates_id"),
            request.form.get("tenant_passport_expiry"),
            request.form.get("tenant_eid_expiry"),
            request.form.get("tenant_employer"),
            request.form.get("tenant_mobile"),
            request.form.get("tenant_email"),
            request.form.get("lease_start"),
            request.form.get("lease_end"),
            request.form.get("move_in"),
            request.form.get("move_out"),
            request.form.get("rent_amount"),
            request.form.get("deposit_amount"),
            request.form.get("number_of_payments"),
            read_file("passportcopypath"),
            read_file("eidcopypath"),
            read_file("residencevisacopypath"),
            read_file("bankstatementcopypath"),
            read_file("depositchequecopypath"),
            read_file("securitychequecopypath"),
            read_file("ejarimunicipalregistrationcopypath"),
            request.form.get("created_by"),
            request.form.get("creation_date")
        )

        insert_query = """
            INSERT INTO TenancyContracts (
                TenantName, TenantDOB, TenantNationality,
                TenantPassportNumber, TenantEmiratesID,
                TenantPassportExpiryDate, TenantEIDExpiryDate,
                TenantEmployer, TenantMobileNumber, TenantEmailID,
                LeaseStartDate, LeaseEndDate, MoveInDate, MoveOutDate,
                RentAmount, DepositAmountReceived, NumberOfPayments,
                PassportCopyPath, EIDCopyPath, ResidenceVisaCopyPath,
                BankStatementCopyPath, DepositChequeCopyPath,
                SecurityChequeCopyPath, EjariMunicipalRegistrationCopyPath,
                CreatedBy, CreationDate
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(insert_query, data)
        conn.commit()
        new_id = cursor.lastrowid

        return jsonify({"success":f"Tenant added successfully! Tenant Code: {new_id}"})
 
    except Error as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@tenant_bp.route("/modify_tenant/search", methods=["POST"])
def search_tenant():
    """
    Search tenant by tenancy contract number and return JSON with Base64 images.
    """
    contract_number = request.json.get("tenancyContractNumber")
    if not contract_number:
        return jsonify({"success": False, "message": "TenancyContractNumber is required"}), 400

    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM TenancyContracts WHERE TenancyContractNumber=%s",
        (contract_number,)
    )
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()

    if not tenant:
        return jsonify({"success": False, "message": f"No tenant found with Contract Number: {contract_number}"}), 404

    # Convert binary file fields to base64
    file_fields = [
        "PassportCopyPath", "EIDCopyPath", "ResidenceVisaCopyPath",
        "BankStatementCopyPath", "DepositChequeCopyPath", "SecurityChequeCopyPath",
        "EjariMunicipalRegistrationCopyPath"
    ]
    for field in file_fields:
        if tenant.get(field):
            tenant[field] = base64.b64encode(tenant[field]).decode("utf-8")

    return jsonify({"success": True, "tenant": tenant}), 200


@tenant_bp.route("/modify_tenant/update", methods=["POST"])
def update_tenant():
    contract_number = request.form.get("tenancy_contract_number")
    if not contract_number:
        return jsonify({"success": False, "message": "tenancy_contract_number is required"}), 400

    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)

    try:
        # Fetch existing tenant
        cursor.execute(
            "SELECT * FROM TenancyContracts WHERE TenancyContractNumber=%s",
            (contract_number,)
        )
        existing = cursor.fetchone()

        if not existing:
            return jsonify({"success": False, "message": "Tenant not found"}), 404

        # Fields that can be updated
        data_fields = {
    "TenantName": "TenantName",
    "TenantDOB": "TenantDOB",
    "TenantNationality": "TenantNationality",
    "TenantPassportNumber": "TenantPassportNumber",
    "TenantEmiratesID": "TenantEmiratesID",
    "TenantPassportExpiryDate": "TenantPassportExpiryDate",
    "TenantEIDExpiryDate": "TenantEIDExpiryDate",
    "TenantEmployer": "TenantEmployer",
    "TenantMobileNumber": "TenantMobileNumber",
    "TenantEmailID": "TenantEmailID",
    "LeaseStartDate": "LeaseStartDate",
    "LeaseEndDate": "LeaseEndDate",
    "MoveInDate": "MoveInDate",
    "MoveOutDate": "MoveOutDate",
    "RentAmount": "RentAmount",
    "DepositAmountReceived": "DepositAmountReceived",
    "NumberOfPayments": "NumberOfPayments",
    "CreatedBy": "CreatedBy",
    "CreationDate": "CreationDate"
}


        updated_values = {}

        for db_field, form_field in data_fields.items():
            new_val = request.form.get(form_field)

            # if empty string → keep old value
            if new_val in [None, ""]:
                updated_values[db_field] = existing.get(db_field)
            else:
                # convert numeric fields
                if db_field in ["RentAmount", "DepositAmountReceived", 
                                "RentAmountReceived", "RentAmountOutstanding"]:
                    updated_values[db_field] = float(new_val)
                # dates
                elif db_field in ["TenantDOB", "TenantPassportExpiryDate", "TenantEIDExpiryDate",
                                  "LeaseStartDate", "LeaseEndDate", "MoveInDate", "MoveOutDate",
                                  "CreationDate"]:
                    updated_values[db_field] = new_val  # let MySQL cast
                else:
                    updated_values[db_field] = new_val

        # Generate update query
        set_clause = ", ".join([f"{key}=%s" for key in updated_values.keys()])
        params = list(updated_values.values()) + [contract_number]

        cursor.execute(
            f"UPDATE TenancyContracts SET {set_clause} WHERE TenancyContractNumber=%s",
            params
        )

        # File uploads
        file_fields = [
            "PassportCopyPath", "EIDCopyPath", "ResidenceVisaCopyPath",
            "BankStatementCopyPath", "DepositChequeCopyPath",
            "SecurityChequeCopyPath", "EjariMunicipalRegistrationCopyPath"
        ]

        for field in file_fields:
            file = request.files.get(field)
            if file and file.filename:
                content = file.read()
                cursor.execute(
                    f"UPDATE TenancyContracts SET {field}=%s WHERE TenancyContractNumber=%s",
                    (content, contract_number)
                )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Tenant updated successfully"
        })

    except Exception as e:
        conn.rollback()
        print("UPDATE ERROR:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@tenant_bp.route("/modify_tenant/delete", methods=["POST"])
def delete_tenant():
    """
    Delete tenant by tenancy contract number (expects JSON body)
    """
    data = request.get_json()
    if not data or "tenancyContractNumber" not in data:
        return jsonify({"success": False, "message": "tenancyContractNumber is required"}), 400

    contract_number = data["tenancyContractNumber"]

    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)

    # Check if tenant exists first
    cursor.execute("SELECT * FROM TenancyContracts WHERE TenancyContractNumber=%s", (contract_number,))
    tenant = cursor.fetchone()
    if not tenant:
        cursor.close()
        conn.close()
        return jsonify({"success": False, "message": f"No tenant found with Tenant Number: {contract_number}"}), 404

    # Delete tenant
    cursor.execute("DELETE FROM TenancyContracts WHERE TenancyContractNumber=%s", (contract_number,))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "message": f"Tenant successfully deleted for Tenant Number: {contract_number}"}), 200

@tenant_bp.route("/tenant_list", methods=["GET"])
def tenant_list():
    """
    Return all tenants as JSON with Base64-encoded files
    """
    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM TenancyContracts ORDER BY TenancyContractNumber DESC")
    tenants = cursor.fetchall()

    # Convert LONGBLOB fields to Base64
    file_fields = [
        "PassportCopyPath", "EIDCopyPath", "ResidenceVisaCopyPath",
        "BankStatementCopyPath", "DepositChequeCopyPath",
        "SecurityChequeCopyPath", "EjariMunicipalRegistrationCopyPath"
    ]
    for tenant in tenants:
        for field in file_fields:
            if tenant.get(field):
                tenant[field] = base64.b64encode(tenant[field]).decode("utf-8")

    cursor.close()
    conn.close()

    return jsonify({"success": True, "tenants": tenants}), 200
@tenant_bp.route("/tenant_list_api", methods=["GET"])
def tenant_list_api():
    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM TenancyContracts ORDER BY TenancyContractNumber DESC")
    tenants = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tenants)

@tenant_bp.route("/tenant_delete_api/<contract_number>", methods=["DELETE"])
def tenant_delete_api(contract_number):
    conn = get_owners_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM TenancyContracts WHERE TenancyContractNumber=%s", (contract_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Tenant deleted successfully"})
