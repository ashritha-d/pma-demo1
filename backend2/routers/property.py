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

property_bp = Blueprint('property', __name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

@property_bp.route("/")
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
@property_bp.route("/add_property", methods=["POST"])
def add_property():
    try:
        form = request.form
        files = request.files
        owner_code = form.get("owner_code")

        print("SUCCESS /add_property HIT")
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
        print("ERROR in /add_property:", e)
        return jsonify({"success": False, "message": str(e)})
@property_bp.route("/modify_property", methods=["POST"])
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


@property_bp.route("/delete_property", methods=["POST"])
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

@property_bp.route("/list_property")
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
@property_bp.route("/property_delete_api/<property_code>", methods=["DELETE"])
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
@property_bp.route("/property_update", methods=["POST"])
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
