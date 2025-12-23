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

auth_bp = Blueprint('auth', __name__)

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
    

@auth_bp.route("/register", methods=["POST"])
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
    if last and last[0]:
        # Extract numeric part from the end
        import re
        match = re.search(r'(\d+)$', last[0])
        if match:
            num = int(match.group(1)) + 1
            # Keep the prefix
            prefix = last[0][:match.start()]
            next_id = f"{prefix}{num:05d}"
        else:
            next_id = "USR00001"
    else:
        next_id = "USR00001"

    try:
        cursor.execute("""
            INSERT INTO users (User_Id, User_Name, Email, Mobile, Password)
            VALUES (%s, %s, %s, %s, %s)
        """, (next_id, name, email, mobile, hashed_password))
        conn.commit()

        # Send confirmation email
        try:
            send_signup_email(email, name, next_id)
        except Exception as email_error:
            print(f"Email sending failed, but registration successful: {email_error}")

        return jsonify({"success": True, "User_Id": next_id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

def send_signup_email(to_email, user_name, user_id):
    """Send signup confirmation email to the new user."""
    msg = EmailMessage()
    msg["Subject"] = "🎉 Welcome to PMA - Account Created Successfully"
    msg["From"] = "pma503867@gmail.com"
    msg["To"] = to_email

    msg.set_content(f"""
    Dear {user_name},

    Welcome to Property Management App (PMA)!

    Your account has been successfully created.

    📋 Account Details:
    ----------------------------------
    User ID: {user_id}
    Email: {to_email}
    Registration Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

    You can now log in to your account and start managing your properties efficiently.

    If you have any questions, feel free to contact our support team.

    Thank you for choosing PMA!

    Best regards,
    Property Management Team
    """)

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            smtp.login(os.environ.get("EMAIL_USER", "pma503867@gmail.com"), os.environ.get("EMAIL_PASSWORD", "wgszwpkdgvtebkkt"))
            smtp.send_message(msg)
        print(f"📧 Signup confirmation email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send signup email to {to_email}: {e}")

# ------------------ LOGIN ------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    conn = get_project_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM users WHERE User_Name=%s",
        (username,)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        stored_password = user["Password"]
        # Check if it's a werkzeug hash or MD5
        if check_password_hash(stored_password, password):
            session["user"] = user["User_Name"]
            return jsonify({"success": True, "user": user["User_Name"]})
        else:
            # Try MD5 for backward compatibility
            import hashlib
            if stored_password == hashlib.md5(password.encode()).hexdigest():
                session["user"] = user["User_Name"]
                return jsonify({"success": True, "user": user["User_Name"]})
    return jsonify({"success": False, "message": "Invalid username or password"}), 401
    

# ------------------ LOGOUT ------------------
@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True, "message": "Logged out successfully"})

# ------------------ HOME ------------------
@auth_bp.route("/", methods=["GET"])
def home():
    if "user" not in session:
        return jsonify({"success": False, "redirect": "/login"}), 401
    return jsonify({"success": True, "user": session["user"]})

@auth_bp.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'favicon.ico')

@auth_bp.route("/index", methods=["GET"])
def index():
    if "user" in session:
        return jsonify({"success": True, "user": session["user"]})
    else:
        return jsonify({"success": False, "redirect": "/login"}), 401

