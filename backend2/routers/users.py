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
import re

users_bp = Blueprint('users', __name__)

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

@users_bp.route("/")
def home():
    return "Users API"

def get_project_db():
    try:
        conn = mysql.connector.connect(
            host=os.environ.get("DB_HOST", "localhost"),
            user=os.environ.get("DB_USER", "root"),
            password=os.environ.get("DB_PASSWORD", "ashu"),
            database=os.environ.get("DB_NAME", "project")
        )
        if conn.is_connected():
            return conn
    except Error as e:
        print(f"Error connecting to database: {e}")
        return None

def generate_user_id():
    db = get_project_db()
    if not db:
        return "USR00001"
    cursor = db.cursor()
    cursor.execute("SELECT User_Id FROM users ORDER BY User_Id DESC LIMIT 1")
    last = cursor.fetchone()
    cursor.close()
    db.close()
    if last and last[0]:
        match = re.search(r'(\d+)$', last[0])
        if match:
            num = int(match.group(1)) + 1
            prefix = last[0][:match.start()]
            return f"{prefix}{num:05d}"
    return "USR00001"


@users_bp.route("/users", methods=["POST"])
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

    db = get_project_db()
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
@users_bp.route("/users", methods=["GET"])
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
@users_bp.route("/users/<id>", methods=["GET"])
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
@users_bp.route("/users/<id>", methods=["PUT"])
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
@users_bp.route("/users/<id>", methods=["DELETE"])
def delete_user(id):
    db = get_project_db()

    if not db:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = db.cursor()
    cursor.execute("DELETE FROM users WHERE User_Id=%s", (id,))
    db.commit()

    return jsonify({"message": "User deleted successfully"})
