from flask import Flask, request, jsonify, session,redirect,url_for,render_template,send_file,send_from_directory,Response,Blueprint
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime,date
import base64
import decimal
import smtplib
from email.message import EmailMessage
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import logging

logging.basicConfig(level=logging.DEBUG)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

app = Flask(__name__)
app.secret_key = "secret"
CORS(app, supports_credentials=True, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])
UPLOAD_FOLDER = "uploads"  # or any folder name you prefer
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # ✅ Create the folder if not exists
# ------------------ DATABASE CONNECTION ------------------
def get_project_db():
    logging.info("Attempting to connect to project database")
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="ashu",
            database="project"
        )
        if conn.is_connected():
            logging.info("Database connected successfully")
            return conn
    except Error as e:
        logging.error(f"Error connecting to database: {e}")
        return None
    
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


# ------------------ REGISTER ------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("User_Name", "").strip()
    email = data.get("Email", "").strip()
    mobile = data.get("Mobile", "").strip()
    password = data.get("Password", "").strip()
    confirm = data.get("ConfirmPassword", "").strip()

    if password != confirm:
        return jsonify({"success": False, "message": "Passwords do not match"}), 400
    hashed_password = generate_password_hash(password)
    conn = get_project_db()
    cursor = conn.cursor()

    # Auto-generate User_Id
    cursor.execute("SELECT User_Id FROM users ORDER BY User_Id DESC LIMIT 1")
    last = cursor.fetchone()
    next_id = "U001"
    if last and last[0]:
        num = int(last[0][1:]) + 1
        next_id = f"U{num:03d}"

    try:
        cursor.execute("""
            INSERT INTO users (User_Id, User_Name, Email, Mobile, Password)
            VALUES (%s, %s, %s, %s, MD5(%s))
        """, (next_id, name, email, mobile, hashed_password))
        conn.commit()
        return jsonify({"success": True, "User_Id": next_id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ------------------ LOGIN ------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    conn = get_project_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM users WHERE User_Name=%s AND Password=MD5(%s)",
        (username, password)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        session["user"] = user["User_Name"]
        return jsonify({"success": True, "user": user["User_Name"]})
    else:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
    

# ------------------ LOGOUT ------------------
@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True, "message": "Logged out successfully"})

# ------------------ HOME ------------------
@app.route("/", methods=["GET"])
def home():
    if "user" not in session:
        return jsonify({"success": False, "redirect": "/login"}), 401
    return jsonify({"success": True, "user": session["user"]})
from flask import send_from_directory

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico')

@app.route("/index", methods=["GET"])
def index():
    if "user" in session:
        return jsonify({"success": True, "user": session["user"]})
    else:
        return jsonify({"success": False, "redirect": "/login"}), 401
#-------------users----------------
# ------------------ DATABASE CONNECTION ------------------
def get_db():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="ashu",   # <-- replace with your MySQL password
            database="project" # <-- make sure this DB exists
        )
        return conn
    except Error as e:
        print("DB connection error:", e)
        return None

# ------------------ GENERATE USER ID ------------------
def generate_user_id():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT User_Id FROM users ORDER BY User_Id DESC LIMIT 1")
    last = cursor.fetchone()
    cursor.close()
    db.close()
    if not last:
        return "USR00001"
    num = int(last[0][3:]) + 1
    return f"USR{num:05d}"

# ------------------ ADD USER ------------------
@app.route("/users", methods=["POST"])
def add_user():
    data = request.json
    required_fields = ["User_Name","Email","Mobile","Password","Created_by","Approved_by"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"success": False, "message": f"{field} is required"}), 400
    hashed_password = generate_password_hash(data["Password"])
    user_id = generate_user_id()

    sql = """
    INSERT INTO users
    (User_Id, User_Name, Email, Mobile, Password, Created_by, Approved_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    values = (user_id, data["User_Name"], data["Email"], data["Mobile"], hashed_password, data["Created_by"], data["Approved_by"])

    db = get_db()
    if not db:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = db.cursor()
    try:
        cursor.execute(sql, values)
        db.commit()
        return jsonify({"success": True, "message": "User added successfully", "User_Id": user_id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        db.close()

# ------------------------------
# Get All Users
# ------------------------------
@app.route("/users", methods=["GET"])
def get_users():
    db = get_project_db()
    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users")

    return jsonify(cursor.fetchall())


# ------------------------------
# Get Single User
# ------------------------------
@app.route("/users/<id>", methods=["GET"])
def get_user(id):
    db = get_project_db()
    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE User_Id=%s", (id,))

    result = cursor.fetchone()
    return jsonify(result)


# ------------------------------
# Update User
# ------------------------------
@app.route("/users/<id>", methods=["PUT"])
def update_user(id):
    data = request.json
    db = get_project_db()

    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor()

    sql = """
    UPDATE users SET
        User_Name=%s,
        Email=%s,
        Mobile=%s,
        Password=%s,
        Created_by=%s,
        Approved_by=%s
    WHERE User_Id=%s
    """

    values = (
        data["User_Name"],
        data["Email"],
        data["Mobile"],
        data["Password"],
        data["Created_by"],
        data["Approved_by"],
        id
    )

    cursor.execute(sql, values)
    db.commit()

    return jsonify({"message": "User updated successfully"})


# ------------------------------
# Delete User
# ------------------------------
@app.route("/users/<id>", methods=["DELETE"])
def delete_user(id):
    db = get_project_db()

    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor()
    cursor.execute("DELETE FROM users WHERE User_Id=%s", (id,))
    db.commit()

    return jsonify({"message": "User deleted successfully"})

#-----------dashboard----------------
@app.route("/add_owner", methods=["POST"])
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
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
# ---------------- MODIFY OWNER ----------------
@app.route("/modify_owner_page", methods=["POST"])
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

from datetime import datetime

@app.route("/update_owner", methods=["POST"])
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
import base64
from flask import Response

# ---------------- GET OWNER WITH BASE64 IMAGES ----------------
@app.route("/owners/<int:owner_code>", methods=["GET"])
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
@app.route("/owner_image/<int:owner_code>/<img_type>")
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
@app.route("/delete_owner", methods=["POST"])
def delete_owner():
    data = request.get_json()
    if not data or "owner_code" not in data:
        return {"success": False, "message": "Owner code is required."}, 400

    try:
        owner_code = int(data.get("owner_code"))  # cast to int if column is numeric

        conn = get_owners_db()
        if not conn:
            return {"success": False, "message": "DB connection failed"}, 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM owner WHERE owner_code = %s", (owner_code,))
        owner = cursor.fetchone()
        if not owner:
            return {"success": False, "message": "Owner not found."}, 404

        cursor.execute("DELETE FROM owner WHERE owner_code = %s", (owner_code,))
        conn.commit()
        return {"success": True, "message": f"✅ Owner {owner_code} deleted successfully."}

    except Exception as e:
        print("Error deleting owner:", e)
        return {"success": False, "message": f"❌ Error deleting owner: {str(e)}"}, 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
# -------------------- LIST OWNERS ----------------
@app.route("/owners_list")
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
@app.route('/owner_image/<int:owner_code>/<field>')
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
    
@app.route("/add_property", methods=["POST"])
def add_property():
    try:
        form = request.form
        files = request.files
        owner_code = form.get("owner_code")

        print("✅ /add_property HIT")
        print("Form Data:", form)
        print("Files:", files)

        conn = get_owners_db()
        cursor = conn.cursor()

        # Auto-generate property_code
        cursor.execute("SELECT MAX(property_code) FROM property")
        max_id = cursor.fetchone()[0] or 0
        next_code = max_id + 1

        # Columns in DB
        columns = [
            "property_code","primary_owner_code","developer_name","building_name","property_type",
            "name","address1","address2","city","state","country","zip_code","municipality_number",
            "electricity_bill_number","water_bill_number","ownership_type","furnishing_status",
            "land_area","carpet_area","builtup_area","bedrooms","bathrooms","washrooms","facing",
            "car_parkings","servant_rooms","balconies","has_dishwasher","has_washing_machine",
            "property_value","year_of_construction","second_owner_code","expected_rent_value",
            "status","mtd_income","ytd_income","mtd_expense","ytd_expense","purchase_value",
            "construction_cost","renovation_cost","registration","transfer_fees","misc_expense",
            "created_by","creation_date","property_photo"
        ]

        # Columns that are numeric
        numeric_fields = [
            "land_area","carpet_area","builtup_area","bedrooms","bathrooms","washrooms",
            "car_parkings","servant_rooms","balconies","property_value","expected_rent_value",
            "mtd_income","ytd_income","mtd_expense","ytd_expense","purchase_value",
            "construction_cost","renovation_cost","registration","transfer_fees","misc_expense"
        ]

        values = []
        for col in columns:
            if col == "property_code":
                values.append(next_code)
            elif col == "primary_owner_code":
                values.append(owner_code or None)
            elif col == "created_by":
                values.append(session.get("user") or "admin")
            elif col == "creation_date":
                values.append(date.today())
            elif col == "property_photo":
                file = files.get("property_photo")
                values.append(file.read() if file else None)
            elif col in numeric_fields:
                try:
                    val = form.get(col)
                    values.append(float(val) if val else None)
                except ValueError:
                    values.append(None)
            elif col == "year_of_construction":
                val = form.get(col)
                values.append(val if val else None)
            else:
                val = form.get(col)
                values.append(val if val else None)

        placeholders = ",".join(["%s"] * len(columns))
        sql = f"INSERT INTO property ({','.join(columns)}) VALUES ({placeholders})"

        cursor.execute(sql, tuple(values))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": f"Property added successfully! Property Code: {next_code}"})

    except Exception as e:
        print("❌ ERROR in /add_property:", e)
        return jsonify({"success": False, "message": str(e)})
@app.route("/modify_property", methods=["POST"])
def modify_property():
    try:
        # ---- SEARCH ----
        if request.form.get("search_property_code"):
            search_code = request.form["search_property_code"]
            conn = get_owners_db()
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT * FROM property WHERE property_code=%s", (search_code,))
            property_data = cur.fetchone()

            if property_data and property_data.get("property_photo"):
                property_data["property_photo"] = base64.b64encode(property_data["property_photo"]).decode("utf-8")

            cur.close()
            conn.close()

            if property_data:
                return jsonify({"success": True, "property": property_data})
            else:
                return jsonify({"success": False, "message": "No property found with that code"})

        # ---- UPDATE ----
        elif request.form.get("property_code"):
            property_code = request.form["property_code"]
            conn = get_owners_db()
            cur = conn.cursor()

            update_query = """
                UPDATE property SET
                    primary_owner_code=%s,
                    developer_name=%s,
                    building_name=%s,
                    property_type=%s,
                    name=%s,
                    address1=%s,
                    address2=%s,
                    city=%s,
                    state=%s,
                    country=%s,
                    zip_code=%s,
                    municipality_number=%s,
                    electricity_bill_number=%s,
                    water_bill_number=%s,
                    ownership_type=%s,
                    furnishing_status=%s,
                    land_area=%s,
                    carpet_area=%s,
                    builtup_area=%s,
                    bedrooms=%s,
                    bathrooms=%s,
                    washrooms=%s,
                    facing=%s,
                    car_parkings=%s,
                    servant_rooms=%s,
                    balconies=%s,
                    has_dishwasher=%s,
                    has_washing_machine=%s,
                    property_value=%s,
                    year_of_construction=%s,
                    expected_rent_value=%s,
                    status=%s,
                    created_by=%s,
                    creation_date=%s,
                    property_photo=%s
                WHERE property_code=%s
            """

            data = (
                request.form.get("primary_owner_code"),
                request.form.get("developer_name"),
                request.form.get("building_name"),
                request.form.get("property_type"),
                request.form.get("name"),
                request.form.get("address1"),
                request.form.get("address2"),
                request.form.get("city"),
                request.form.get("state"),
                request.form.get("country"),
                request.form.get("zip_code"),
                request.form.get("municipality_number"),
                request.form.get("electricity_bill_number"),
                request.form.get("water_bill_number"),
                request.form.get("ownership_type"),
                request.form.get("furnishing_status"),
                request.form.get("land_area"),
                request.form.get("carpet_area"),
                request.form.get("builtup_area"),
                request.form.get("bedrooms"),
                request.form.get("bathrooms"),
                request.form.get("washrooms"),
                request.form.get("facing"),
                request.form.get("car_parkings"),
                request.form.get("servant_rooms"),
                request.form.get("balconies"),
                request.form.get("has_dishwasher"),
                request.form.get("has_washing_machine"),
                request.form.get("property_value"),
                request.form.get("year_of_construction") or None,
                request.form.get("expected_rent_value"),
                request.form.get("status"),
                request.form.get("created_by"),
                request.form.get("creation_date") or date.today(),
                request.files["property_photo"].read() if "property_photo" in request.files and request.files["property_photo"].filename else None,
                property_code
            )

            cur.execute(update_query, data)
            conn.commit()
            cur.close()
            conn.close()

            return jsonify({"success": True, "message": "Property updated successfully"})

        return jsonify({"success": False, "message": "Invalid request"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route("/delete_property", methods=["POST"])
def delete_property():
    response_data = {"success": False, "message": "", "property": None}

    property_code = request.form.get("property_code")
    if not property_code:
        response_data["message"] = "Property code is required"
        return jsonify(response_data)

    try:
        property_code = int(property_code)
    except ValueError:
        response_data["message"] = "Property code must be a number"
        return jsonify(response_data)

    conn = get_owners_db()
    cur = conn.cursor(dictionary=True)

    try:
        # -------- SEARCH --------
        if "search" in request.form:
            cur.execute("SELECT * FROM property WHERE property_code = %s", (property_code,))
            property_data = cur.fetchone()

            if property_data:
                # Convert decimals to float, dates to ISO strings
                for key, val in property_data.items():
                    if isinstance(val, decimal.Decimal):
                        property_data[key] = float(val)
                    elif isinstance(val, (date,)):
                        property_data[key] = val.isoformat()

                # Encode photo if exists
                if property_data.get("property_photo"):
                    property_data["property_photo"] = base64.b64encode(property_data["property_photo"]).decode("utf-8")

                response_data.update({
                    "success": True,
                    "message": "Property found",
                    "property": property_data
                })
            else:
                response_data.update({
                    "success": True,
                    "message": "No property found with that code",
                    "property": None
                })

        # -------- DELETE --------
        elif "delete" in request.form:
            cur.execute("DELETE FROM property WHERE property_code = %s", (property_code,))
            conn.commit()
            response_data.update({
                "success": True,
                "message": f"Property {property_code} deleted successfully",
                "property": None
            })
        else:
            response_data["message"] = "Invalid action"

    except Exception as e:
        response_data.update({
            "success": False,
            "message": str(e)
        })
    finally:
        cur.close()
        conn.close()

    return jsonify(response_data)

@app.route("/list_property")
def list_property():
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                p.property_code,
                p.primary_owner_code,
                CONCAT(o.first_name, ' ', o.last_name) AS owner_name,
                p.developer_name,
                p.building_name,
                p.property_type,
                p.name,
                p.address1,
                p.address2,
                p.city,
                p.state,
                p.country,
                p.zip_code,
                p.municipality_number,
                p.electricity_bill_number,
                p.water_bill_number,
                p.ownership_type,
                p.furnishing_status,
                p.land_area,
                p.carpet_area,
                p.builtup_area,
                p.bedrooms,
                p.bathrooms,
                p.washrooms,
                p.facing,
                p.car_parkings,
                p.servant_rooms,
                p.balconies,
                p.has_dishwasher,
                p.has_washing_machine,
                p.property_value,
                p.year_of_construction,
                p.second_owner_code,
                p.expected_rent_value,
                p.status,
                p.mtd_income,
                p.ytd_income,
                p.mtd_expense,
                p.ytd_expense,
                p.purchase_value,
                p.construction_cost,
                p.renovation_cost,
                p.registration,
                p.transfer_fees,
                p.misc_expense,
                p.created_by,
                p.creation_date,
                p.property_photo,

                -- ✅ contract_master data
                c.contract_start_date,
                c.contract_end_date,
                c.rent_amount AS current_rent,
                c.deposit_amount AS deposit_amount

            FROM property p
            LEFT JOIN owner o 
                ON p.primary_owner_code = o.owner_code
            LEFT JOIN contract_master c 
                ON p.property_code = c.property_id
                AND c.contract_start_date = (
                    SELECT MAX(c2.contract_start_date)
                    FROM contract_master c2
                    WHERE c2.property_id = p.property_code
                )
            ORDER BY p.property_code
        """)

        properties = cursor.fetchall()

        # Convert BLOB to Base64 for displaying images
        for prop in properties:
            if prop["property_photo"]:
                prop["property_photo"] = base64.b64encode(prop["property_photo"]).decode('utf-8')

        return jsonify({"success": True, "properties": properties})

    except mysql.connector.Error as err:
        print("❌ SQL Error:", err)
        return jsonify({"success": False, "error": str(err)})

    finally:
        try:
            if conn.is_connected():
                cursor.close()
                conn.close()
        except:
            pass
@app.route("/property_delete_api/<property_code>", methods=["DELETE"])
def property_delete_api(property_code):
    try:
        conn = get_owners_db()
        cursor = conn.cursor()

        # ✅ Step 1: Delete related contracts from contract_master
        cursor.execute("DELETE FROM contract_master WHERE property_id = %s", (property_code,))

        # ✅ Step 2: Delete related tenancy contracts
        cursor.execute("DELETE FROM tenancycontracts WHERE PropertyCode = %s", (property_code,))

        # ✅ Step 3: Delete related service transactions (ServTrans) — optional but recommended
        cursor.execute("DELETE FROM ServTrans WHERE PropertyCode = %s", (property_code,))

        # ✅ Step 4: Delete the property itself
        cursor.execute("DELETE FROM property WHERE property_code = %s", (property_code,))

        conn.commit()
        return jsonify({
            "success": True,
            "message": f"Property {property_code} deleted successfully"
        })

    except mysql.connector.IntegrityError as err:
        if err.errno == 1451:
            return jsonify({
                "success": False,
                "message": "Cannot delete property: linked records still exist (contracts or tenants)."
            })
        else:
            return jsonify({"success": False, "message": str(err)})

    except mysql.connector.Error as err:
        return jsonify({"success": False, "message": str(err)})

    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
# --- Update property API ---
@app.route("/property_update", methods=["POST"])
def property_update():
    try:
        conn = get_owners_db()
        cursor = conn.cursor()

        # ✅ Accept both form-data and JSON
        data = request.form.to_dict()
        if not data:
            data = request.get_json(force=True, silent=True) or {}

        property_code = (
            data.get("property_code")
            or data.get("PropertyCode")
            or data.get("propertyCode")
        )

        if not property_code:
            return jsonify({"success": False, "message": "Property code is required"}), 400

        # ✅ Build update fields dynamically
        update_fields = []
        update_values = []

        for key, value in data.items():
            if key.lower() != "property_code" and value != "":
                update_fields.append(f"{key}=%s")
                update_values.append(value)

        # ✅ Handle file upload (property_photo)
        if "property_photo" in request.files:
            file = request.files["property_photo"]
            update_fields.append("property_photo=%s")
            update_values.append(file.read())

        # ✅ Run the SQL update
        if not update_fields:
            return jsonify({"success": False, "message": "No fields to update"}), 400

        update_values.append(property_code)
        sql = f"UPDATE property SET {', '.join(update_fields)} WHERE property_code=%s"
        cursor.execute(sql, tuple(update_values))
        conn.commit()

        return jsonify({"success": True, "message": "Property updated successfully"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass
@app.route("/add_tenant", methods=["POST"])
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

@app.route("/modify_tenant/search", methods=["POST"])
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


@app.route("/modify_tenant/update", methods=["POST"])
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

@app.route("/modify_tenant/delete", methods=["POST"])
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

@app.route("/tenant_list", methods=["GET"])
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
@app.route("/tenant_list_api", methods=["GET"])
def tenant_list_api():
    conn = get_owners_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM TenancyContracts ORDER BY TenancyContractNumber DESC")
    tenants = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tenants)

@app.route("/tenant_delete_api/<contract_number>", methods=["DELETE"])
def tenant_delete_api(contract_number):
    conn = get_owners_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM TenancyContracts WHERE TenancyContractNumber=%s", (contract_number,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Tenant deleted successfully"})
# ----------------- Add Contract Endpoint -----------------
@app.route("/add_contract", methods=["POST"])
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
@app.route("/property/<int:property_code>", methods=["GET"])
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
@app.route("/tenant/<int:tenant_code>", methods=["GET"])
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
@app.route("/contract/<int:contract_id>", methods=["GET"])
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

@app.route("/modify_contract", methods=["POST"])
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
@app.route("/generate_update", methods=["POST"])
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
@app.route("/send_contract_email", methods=["POST"])
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
        smtp.login("pma503867@gmail.com", "wgszwpkdgvtebkkt")
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
@app.route("/delete_contract", methods=["POST"])
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
@app.route("/list_contracts", methods=["GET"])
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

@app.route("/view_property/<int:property_code>", methods=["GET"])
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
@app.route("/view_tenant/<int:tenant_id>", methods=["GET"])
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

# ---------------------- Add Financial Transaction ----------------------
@app.route("/add_fintrans", methods=["POST"])
def add_fintrans():
    try:
        connection = get_owners_db()
        cursor = connection.cursor(dictionary=True)

        data = request.get_json()
        print("📥 AddFinTrans JSON Data:", data)

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

        print("🟡 Insert Params:", params)
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

        print("✅ Transaction added + Contract updated!")
        return jsonify({"success": True, "message": "Transaction added successfully!"})

    except Exception as e:
        print("❌ Error in /add_fintrans:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        connection.close()
@app.route("/add_fin", methods=["POST"])
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

@app.route("/get_contract/<int:contract_id>")
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
@app.route("/get_contract_details/<int:contract_id>")
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
@app.route("/property/<int:property_code>")
def get_property_details(property_code):
    try:
        conn = get_owners_db()
        cursor = conn.cursor(dictionary=True)

        # Fetch property
        cursor.execute("SELECT * FROM property WHERE property_code = %s", (property_code,))
        property_data = cursor.fetchone()
        if not property_data:
            return jsonify({"success": False, "message": "Property not found"})

        # Fetch latest contract and tenant for that property
        cursor.execute("""
            SELECT c.*, t.TenantName AS tenant_name, t.TenantID AS tenant_id
            FROM contract_master c
            JOIN tenant_master t ON c.TenantID = t.TenantID
            WHERE c.PropertyCode = %s
            ORDER BY c.ContractStartDate DESC
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

@app.route("/fintrans/<int:ref_no>", methods=["GET"])
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


@app.route("/modify_fintrans", methods=["POST"])
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

from decimal import Decimal
import datetime

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

@app.route("/fintrans_list", methods=["GET"])
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
@app.route("/search_fintrans", methods=["GET"])
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
# ---------- Add Service Transaction ----------
@app.route("/add_servtrans", methods=["POST"])
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
@app.route("/list_servtrans", methods=["GET"])
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
@app.route("/get_servtrans/<int:sequence_no>", methods=["GET"])
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
@app.route("/update_servtrans/<int:sequence_no>", methods=["POST"])
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

@app.route("/dashboard_stats", methods=["GET"])
def dashboard_stats():
    """Get dashboard statistics for visualizations"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Get counts
        cursor.execute("SELECT COUNT(*) as total_properties FROM property")
        properties_count = cursor.fetchone()["total_properties"]

        cursor.execute("SELECT COUNT(*) as total_owners FROM owner")
        owners_count = cursor.fetchone()["total_owners"]

        cursor.execute("SELECT COUNT(*) as total_tenants FROM tenancycontracts")
        tenants_count = cursor.fetchone()["total_tenants"]

        cursor.execute("SELECT COUNT(*) as total_contracts FROM contract_master")
        contracts_count = cursor.fetchone()["total_contracts"]

        # Properties by status
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM property
            GROUP BY status
        """)
        properties_by_status = cursor.fetchall()

        # Properties by type
        cursor.execute("""
            SELECT property_type, COUNT(*) as count
            FROM property
            GROUP BY property_type
        """)
        properties_by_type = cursor.fetchall()

        # Monthly revenue (from FinTrans)
        cursor.execute("""
            SELECT
                DATE_FORMAT(TrDate, '%Y-%m') as month,
                SUM(CASE WHEN ReceiptPaymentReason = 'Rent' THEN TrAmount ELSE 0 END) as rent_revenue,
                SUM(CASE WHEN ReceiptPaymentReason IN ('Rent Deposit', 'Deposit') THEN TrAmount ELSE 0 END) as deposit_revenue
            FROM FinTrans
            WHERE TrDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(TrDate, '%Y-%m')
            ORDER BY month
        """)
        monthly_revenue = cursor.fetchall()

        # Properties by city
        cursor.execute("""
            SELECT city, COUNT(*) as count
            FROM property
            WHERE city IS NOT NULL AND city != ''
            GROUP BY city
            ORDER BY count DESC
            LIMIT 10
        """)
        properties_by_city = cursor.fetchall()

        # Recent transactions
        cursor.execute("""
            SELECT
                f.FinTransRefNo,
                f.PropertyCode,
                f.TrDate,
                f.TrAmount,
                f.ReceiptPaymentReason,
                f.ModeOfPayment,
                t.TenantName
            FROM FinTrans f
            LEFT JOIN TenancyContracts t ON f.TenancyContractNumber = t.TenancyContractNumber
            ORDER BY f.TrDate DESC
            LIMIT 10
        """)
        recent_transactions = cursor.fetchall()

        # Convert dates to strings for JSON serialization
        for transaction in recent_transactions:
            if transaction.get("TrDate"):
                transaction["TrDate"] = transaction["TrDate"].strftime("%Y-%m-%d")

        for revenue in monthly_revenue:
            if revenue.get("month"):
                revenue["month"] = str(revenue["month"])

        stats = {
            "success": True,
            "summary": {
                "total_properties": properties_count,
                "total_owners": owners_count,
                "total_tenants": tenants_count,
                "total_contracts": contracts_count,
                "occupancy_rate": round((contracts_count / properties_count * 100) if properties_count > 0 else 0, 2)
            },
            "charts": {
                "properties_by_status": properties_by_status,
                "properties_by_type": properties_by_type,
                "properties_by_city": properties_by_city,
                "monthly_revenue": monthly_revenue
            },
            "recent_activity": {
                "transactions": recent_transactions
            }
        }

        return jsonify(stats)

    except Exception as e:
        print("Error fetching dashboard stats:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

# ---------------------- Run Server ----------------------
if __name__ == "__main__":
    app.run(debug=True)
