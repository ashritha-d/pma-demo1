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

servtrans_bp = Blueprint('servtrans', __name__)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

@servtrans_bp.route("/")
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
@servtrans_bp.route("/add_servtrans", methods=["POST"])
def add_servtrans():
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        # ----- Extract form fields -----
        property_code = request.form.get("property_code")
        tenancy_contract_number = request.form.get("tenancy_contract_number")
        service_request_type = request.form.get("service_request_type")
        service_request_description = request.form.get("service_request_description")
        service_request_login_date = request.form.get("service_request_login_date")
        service_request_attended_by = request.form.get("service_request_attended_by")
        service_request_start_date = request.form.get("service_request_start_date")
        service_request_estimated_cost = request.form.get("service_request_estimated_cost")
        service_request_actual_cost = request.form.get("service_request_actual_cost")
        service_request_end_date = request.form.get("service_request_end_date")
        description = request.form.get("description")
        status_of_service_request = request.form.get("status_of_service_request")
        created_by = request.form.get("created_by")
        creation_date = request.form.get("creation_date") or datetime.now().strftime("%Y-%m-%d")

        # Optional file upload (invoice, report, etc.)
        service_file = request.files.get("service_file")
        file_path = None
        if service_file and service_file.filename:
            filename = secure_filename(service_file.filename)
            upload_folder = os.path.join("uploads", "servtrans")
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, filename)
            service_file.save(file_path)

        # ----- Insert SQL -----
        query = """
            INSERT INTO ServTrans (
                PropertyCode, TenancyContractNumber, ServiceRequestType,
                ServiceRequestDescription, ServiceRequestLoginDate,
                ServiceRequestAttendedBy, ServiceRequestStartDate,
                ServiceRequestEstimatedCost, ServiceRequestActualCost,
                ServiceRequestEndDate, Description, StatusOfServiceRequest,
                CreatedBy, CreationDate
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            property_code, tenancy_contract_number, service_request_type,
            service_request_description, service_request_login_date,
            service_request_attended_by, service_request_start_date,
            service_request_estimated_cost, service_request_actual_cost,
            service_request_end_date, description, status_of_service_request,
            created_by, creation_date
        )

        cursor.execute(query, values)
        if service_request_actual_cost:
            cursor.execute("""
                UPDATE property
                SET ytd_expense = IFNULL(ytd_expense, 0) + %s
                WHERE property_code = %s
            """, (service_request_actual_cost, property_code))

        
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"✅ Service transaction added successfully for Property {property_code}"
        })

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

# ---------- 1️⃣ Fetch all service transactions ----------
@servtrans_bp.route("/list_servtrans", methods=["GET"])
def list_servtrans():
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT 
                s.SequenceNo, s.PropertyCode, s.TenancyContractNumber, 
                s.ServiceRequestType, s.ServiceRequestDescription, 
                s.ServiceRequestLoginDate, s.ServiceRequestAttendedBy, 
                s.ServiceRequestEstimatedCost, s.ServiceRequestActualCost,
                s.ServiceRequestEndDate, s.StatusOfServiceRequest,
                p.building_name, t.TenantName
            FROM ServTrans s
            LEFT JOIN Property p ON s.PropertyCode = p.property_code
            LEFT JOIN tenancycontracts t ON s.TenancyContractNumber = t.TenancyContractNumber
            ORDER BY s.SequenceNo DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        return jsonify({"success": True, "data": rows})

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


# ---------- 2️⃣ Fetch one service transaction for editing ----------
@servtrans_bp.route("/get_servtrans/<int:sequence_no>", methods=["GET"])
def get_servtrans(sequence_no):
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM ServTrans WHERE SequenceNo = %s", (sequence_no,))
        record = cursor.fetchone()
        if record:
            return jsonify({"success": True, "data": record})
        else:
            return jsonify({"success": False, "message": "Service record not found"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


# ---------- 3️⃣ Update service transaction ----------
@servtrans_bp.route("/update_servtrans/<int:sequence_no>", methods=["POST"])
def update_servtrans(sequence_no):
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor()

        data = request.form.to_dict()
        fields = [
            "ServiceRequestType", "ServiceRequestDescription", "ServiceRequestLoginDate",
            "ServiceRequestAttendedBy", "ServiceRequestStartDate", "ServiceRequestEstimatedCost",
            "ServiceRequestActualCost", "ServiceRequestEndDate", "Description", "StatusOfServiceRequest"
        ]

        updates = ", ".join([f"{field}=%s" for field in fields])
        values = [data.get(field) for field in fields] + [sequence_no]

        query = f"UPDATE ServTrans SET {updates} WHERE SequenceNo=%s"
        cursor.execute(query, values)
        conn.commit()

        return jsonify({"success": True, "message": "✅ Service record updated successfully!"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

