from flask import Flask, request, jsonify, session, redirect, url_for, render_template, send_file, send_from_directory, Response, Blueprint
from flask_cors import CORS
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

owners_bp = Blueprint('owners', __name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

@owners_bp.route("/")
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
            database=os.environ.get("DB_NAME", "owners")
        )
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Error connecting to 'owners' database: {e}")
        return None


@owners_bp.route("/add_owner", methods=["POST"])
def add_owner():
    try:
        conn = get_owners_db()
        cursor = conn.cursor()

        # --- Required files ---
        required_files = ["OwnerEID", "OwnerPassportCopy", "OwnerResVisa"]
        files = {}

        for field in required_files:
            file = request.files.get(field)
            if not file or file.filename == "":
                return jsonify({"success": False, "message": f"Missing required file: {field}"}), 400

            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            files[field] = filepath

        # --- Collect text fields ---
        owner_data = {
            "salutation": request.form.get("OwnerSalutation"),
            "first_name": request.form.get("OwnerFirstName"),
            "last_name": request.form.get("OwnerLastName"),
            "nationality": request.form.get("OwnerNationality"),
            "address1": request.form.get("OwnerAddress1"),
            "address2": request.form.get("OwnerAddress2"),
            "city": request.form.get("OwnerCity"),
            "state": request.form.get("OwnerState"),
            "country": request.form.get("OwnerCountry"),
            "zip_code": request.form.get("OwnerZipCode"),
            "mobile_number": request.form.get("OwnerMobileNumber"),
            "email": request.form.get("OwnerEmailId"),
            "passport_number": request.form.get("OwnerPassportNumber"),
            "dob": request.form.get("OwnerDateOfBirth"),
            "visa_expiry": request.form.get("OwnerVisaExpiryDate"),
            "passport_expiry": request.form.get("OwnerPassportExpiryDate"),
            "created_by": request.form.get("CreatedBy"),
            "approved_by": request.form.get("ApprovedBy"),
        }

        # --- Generate next owner code ---
        cursor.execute("SELECT IFNULL(MAX(owner_code),0)+1 FROM owner")
        owner_code = cursor.fetchone()[0]

        # --- Helper to read file bytes ---
        def read_file(path):
            return open(path, "rb").read() if os.path.exists(path) else None

        sql = """
            INSERT INTO owner (
                owner_code, salutation, first_name, last_name, nationality,
                address1, address2, city, state, country, zip_code,
                mobile_number, email, passport_number, date_of_birth,
                visa_expiry_date, passport_expiry_date, eid_image,
                passport_copy, res_visa, created_by, approved_by
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            owner_code,
            owner_data["salutation"],
            owner_data["first_name"],
            owner_data["last_name"],
            owner_data["nationality"],
            owner_data["address1"],
            owner_data["address2"],
            owner_data["city"],
            owner_data["state"],
            owner_data["country"],
            owner_data["zip_code"],
            owner_data["mobile_number"],
            owner_data["email"],
            owner_data["passport_number"],
            owner_data["dob"],
            owner_data["visa_expiry"],
            owner_data["passport_expiry"],
            read_file(files["OwnerEID"]),
            read_file(files["OwnerPassportCopy"]),
            read_file(files["OwnerResVisa"]),
            owner_data["created_by"],
            owner_data["approved_by"]
        )

        cursor.execute(sql, values)
        conn.commit()

        # --- Clean up uploaded files ---
        for f in files.values():
            if os.path.exists(f):
                os.remove(f)

        return jsonify({"success": True, "message": f"Owner added successfully! Owner Code: OW{owner_code:05d}"})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn: conn.close()
# ---------------- MODIFY OWNER ----------------
@owners_bp.route("/modify_owner_page", methods=["POST"])
def modify_owner_page():
    """
    Search and return owner details as JSON (for React frontend).
    """
    owner_code = request.json.get("owner_code")
    if not owner_code:
        return jsonify({"success": False, "message": "owner_code is required"}), 400

    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM owner WHERE owner_code=%s", (owner_code,))
        owner_data = cursor.fetchone()
        cursor.close()
        conn.close()

        if not owner_data:
            return jsonify({"success": False, "message": f"No owner found with code {owner_code}"}), 404

        # Convert image binaries → base64 for frontend display
        image_fields = ["eid_image", "passport_copy", "res_visa"]
        for field in image_fields:
            if owner_data.get(field):
                owner_data[field] = base64.b64encode(owner_data[field]).decode("utf-8")

        # Format date fields to "YYYY-MM-DD"
        for field in ["date_of_birth", "visa_expiry_date", "passport_expiry_date"]:
            if owner_data.get(field) and hasattr(owner_data[field], "strftime"):
                owner_data[field] = owner_data[field].strftime("%Y-%m-%d")

        return jsonify({"success": True, "owner": owner_data}), 200

    except Exception as e:
        print("[ERROR] modify_owner_page:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@owners_bp.route("/update_owner", methods=["POST"])
def update_owner():
    owner_code = request.form.get("owner_code")
    if not owner_code:
        return jsonify({"success": False, "message": "Owner code missing"}), 400

    def parse_date(value):
        """Convert input string to date or None for MySQL"""
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except:
            return None

    try:
        # Read uploaded files (optional)
        eid_file = request.files.get("OwnerEID")
        passport_file = request.files.get("OwnerPassportCopy")
        visa_file = request.files.get("OwnerResVisa")

        eid_data = eid_file.read() if eid_file else None
        passport_data = passport_file.read() if passport_file else None
        visa_data = visa_file.read() if visa_file else None

        # Collect form values
        values = (
            request.form.get("salutation"),
            request.form.get("first_name"),
            request.form.get("last_name"),
            request.form.get("nationality"),
            request.form.get("address1"),
            request.form.get("address2"),
            request.form.get("city"),
            request.form.get("state"),
            request.form.get("country"),
            request.form.get("zip_code"),
            request.form.get("mobile_number"),
            request.form.get("email"),
            request.form.get("passport_number"),
            eid_data,
            passport_data,
            visa_data,
            parse_date(request.form.get("date_of_birth")),
            parse_date(request.form.get("visa_expiry_date")),
            parse_date(request.form.get("passport_expiry_date")),
            request.form.get("created_by"),
            request.form.get("approved_by"),
            owner_code,
        )

        conn = get_owners_db()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE owner SET
                salutation=%s, first_name=%s, last_name=%s,
                nationality=%s, address1=%s, address2=%s,
                city=%s, state=%s, country=%s, zip_code=%s,
                mobile_number=%s, email=%s, passport_number=%s,
                eid_image=COALESCE(%s, eid_image),
                passport_copy=COALESCE(%s, passport_copy),
                res_visa=COALESCE(%s, res_visa),
                date_of_birth=%s, visa_expiry_date=%s,
                passport_expiry_date=%s, created_by=%s, approved_by=%s
            WHERE owner_code=%s
        """, values)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": f"Owner {owner_code} updated successfully"})

    except Exception as e:
        print("[ERROR] update_owner:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------- GET OWNER WITH BASE64 IMAGES ----------------
@owners_bp.route("/owners/<int:owner_code>", methods=["GET"])
def get_owner(owner_code):
    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM owner WHERE owner_code=%s", (owner_code,))
    owner = cursor.fetchone()
    cursor.close()
    conn.close()

    if owner:
        # Convert binary images to base64 strings
        for field in ["eid_image", "passport_copy", "res_visa"]:
            if owner[field]:
                owner[field] = base64.b64encode(owner[field]).decode("utf-8")
            else:
                owner[field] = None
        return jsonify({"success": True, "owner": owner})
    else:
        return jsonify({"success": False, "message": "Owner not found"}), 404

# ---------------- GET OWNER IMAGE DIRECTLY ----------------
@owners_bp.route("/owner_image/<int:owner_code>/<img_type>")
def get_owner_image(owner_code, img_type):
    if img_type not in ["eid_image", "passport_copy", "res_visa"]:
        return jsonify({"success": False, "message": "Invalid image type"}), 400

    conn = get_owners_db()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {img_type} FROM owner WHERE owner_code=%s", (owner_code,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result and result[0]:
        return Response(result[0], mimetype="image/jpeg")
    else:
        return jsonify({"success": False, "message": "Image not found"}), 404
# ---------------- DELETE OWNER ----------------
@owners_bp.route("/delete_owner", methods=["POST"])
def delete_owner():
    data = request.get_json()
    if not data or "owner_code" not in data:
        return jsonify({"success": False, "message": "Owner code is required."}), 400

    try:
        owner_code = int(data.get("owner_code"))  # cast to int if column is numeric

        conn = get_owners_db()
        if not conn:
            return jsonify({"success": False, "message": "DB connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM owner WHERE owner_code = %s", (owner_code,))
        owner = cursor.fetchone()
        if not owner:
            return jsonify({"success": False, "message": "Owner not found."}), 404

        cursor.execute("DELETE FROM owner WHERE owner_code = %s", (owner_code,))
        conn.commit()
        return jsonify({"success": True, "message": f"Owner {owner_code} deleted successfully."})

    except Exception as e:
        print("Error deleting owner:", e)
        return jsonify({"success": False, "message": f"Error deleting owner: {str(e)}"}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
# -------------------- LIST OWNERS ----------------
@owners_bp.route("/owners_list")
def owners_list():
    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM owner")
    owners = cursor.fetchall()
    cursor.close()
    conn.close()

    for owner in owners:
        for field in ["eid_image", "passport_copy", "res_visa"]:
            if owner[field]:
                owner[field] = base64.b64encode(owner[field]).decode("utf-8")
            else:
                owner[field] = None

    return jsonify({"success": True, "owners": owners})

# -------------------- GET OWNER IMAGE ----------------
@owners_bp.route('/owner_image/<int:owner_code>/<field>')
def owner_image(owner_code, field):
    valid_fields = ["eid_image", "passport_copy", "res_visa"]

    # ✅ Validate requested field
    if field not in valid_fields:
        return jsonify({"success": False, "message": "Invalid image type"}), 400

    try:
        conn = get_owners_db()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(f"SELECT {field} FROM owner WHERE owner_code=%s", (owner_code,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        # ✅ Check if image exists
        if not result or not result[0]:
            return jsonify({"success": False, "message": f"No {field} found for owner {owner_code}"}), 404

        # ✅ Return the image as response
        return Response(result[0], mimetype='image/jpeg')

    except Exception as e:
        print(f"Error fetching image {field} for owner {owner_code}: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
