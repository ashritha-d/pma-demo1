import os
from flask import Flask
from flask_cors import CORS
# from dotenv import load_dotenv  # Temporarily commented for local testing
from routers.auth import auth_bp
from routers.owners import owners_bp
from routers.property import property_bp
from routers.fintrans import fintrans_bp
from routers.servTrans import servtrans_bp
from routers.contract import contract_bp
from routers.tenant import tenant_bp
from routers.users import users_bp
from routers.reports import reports_bp

# Load environment variables
# load_dotenv()  # Temporarily commented for local testing

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "secret")

# Configure CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
CORS(app, supports_credentials=True, origins=[
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(owners_bp)
app.register_blueprint(property_bp)
app.register_blueprint(fintrans_bp)
app.register_blueprint(servtrans_bp)
app.register_blueprint(contract_bp)
app.register_blueprint(tenant_bp)
app.register_blueprint(users_bp)
app.register_blueprint(reports_bp)

if __name__ == "__main__":
    app.run(debug=True)