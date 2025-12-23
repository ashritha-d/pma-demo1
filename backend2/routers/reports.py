from flask import Blueprint, jsonify
import mysql.connector
from mysql.connector import Error

reports_bp = Blueprint('reports', __name__)

def get_owners_db():
    """Connect to 'owners' database for reports"""
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

@reports_bp.route("/")
def home():
    return "Reports API"

@reports_bp.route("/dashboard_stats", methods=["GET"])
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

@reports_bp.route("/tenants_report", methods=["GET"])
def tenants_report():
    """Detailed tenants report"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                t.TenancyContractNumber,
                t.TenantName,
                t.TenantEmail,
                t.TenantMobile,
                t.PropertyCode,
                t.ContractStartDate,
                t.ContractEndDate,
                t.RentAmount,
                t.DepositAmount,
                t.RentPaymentMode,
                p.name as property_name,
                p.city,
                p.property_type
            FROM TenancyContracts t
            LEFT JOIN property p ON t.PropertyCode = p.property_code
            ORDER BY t.TenancyContractNumber
        """)

        tenants = cursor.fetchall()

        # Convert dates
        for tenant in tenants:
            for date_field in ["ContractStartDate", "ContractEndDate"]:
                if tenant.get(date_field):
                    tenant[date_field] = tenant[date_field].strftime("%Y-%m-%d")

        return jsonify({
            "success": True,
            "tenants": tenants,
            "total_count": len(tenants)
        })

    except Exception as e:
        print("Error fetching tenants report:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@reports_bp.route("/contracts_report", methods=["GET"])
def contracts_report():
    """Detailed contracts report"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                c.contract_id,
                c.property_id,
                c.tenant_id,
                c.tenant_name,
                c.contract_start_date,
                c.contract_end_date,
                c.rent_amount,
                c.deposit_amount,
                c.rent_payment_mode,
                c.new_or_old_tenant,
                c.generate_contract,
                c.send_email,
                c.contract_status,
                p.name as property_name,
                p.city,
                p.property_type
            FROM contract_master c
            LEFT JOIN property p ON c.property_id = p.property_code
            ORDER BY c.contract_id
        """)

        contracts = cursor.fetchall()

        # Convert dates
        for contract in contracts:
            for date_field in ["contract_start_date", "contract_end_date"]:
                if contract.get(date_field):
                    contract[date_field] = contract[date_field].strftime("%Y-%m-%d")

        return jsonify({
            "success": True,
            "contracts": contracts,
            "total_count": len(contracts)
        })

    except Exception as e:
        print("Error fetching contracts report:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@reports_bp.route("/fintrans_report", methods=["GET"])
def fintrans_report():
    """Detailed financial transactions report"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                f.FinTransRefNo,
                f.PropertyCode,
                f.TenancyContractNumber,
                f.TrDate,
                f.TrAmount,
                f.ReceiptPaymentReason,
                f.ModeOfPayment,
                f.Remarks,
                t.TenantName,
                p.name as property_name
            FROM FinTrans f
            LEFT JOIN TenancyContracts t ON f.TenancyContractNumber = t.TenancyContractNumber
            LEFT JOIN property p ON f.PropertyCode = p.property_code
            ORDER BY f.TrDate DESC
        """)

        transactions = cursor.fetchall()

        # Convert dates
        for trans in transactions:
            if trans.get("TrDate"):
                trans["TrDate"] = trans["TrDate"].strftime("%Y-%m-%d")

        return jsonify({
            "success": True,
            "transactions": transactions,
            "total_count": len(transactions)
        })

    except Exception as e:
        print("Error fetching fintrans report:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@reports_bp.route("/servtrans_report", methods=["GET"])
def servtrans_report():
    """Detailed service transactions report"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                s.ServiceTransRefNo,
                s.PropertyCode,
                s.TenancyContractNumber,
                s.ServiceDate,
                s.ServiceType,
                s.ServiceAmount,
                s.ServiceDescription,
                s.PaymentStatus,
                t.TenantName,
                p.name as property_name
            FROM ServiceTransactions s
            LEFT JOIN TenancyContracts t ON s.TenancyContractNumber = t.TenancyContractNumber
            LEFT JOIN property p ON s.PropertyCode = p.property_code
            ORDER BY s.ServiceDate DESC
        """)

        services = cursor.fetchall()

        # Convert dates
        for service in services:
            if service.get("ServiceDate"):
                service["ServiceDate"] = service["ServiceDate"].strftime("%Y-%m-%d")

        return jsonify({
            "success": True,
            "services": services,
            "total_count": len(services)
        })

    except Exception as e:
        print("Error fetching servtrans report:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@reports_bp.route("/properties_report", methods=["GET"])
def properties_report():
    """Detailed properties report"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                p.property_code,
                p.name,
                p.building_name,
                p.property_type,
                p.city,
                p.status,
                p.created_by,
                p.creation_date,
                o.first_name,
                o.last_name,
                c.tenant_name,
                c.contract_start_date,
                c.contract_end_date,
                c.rent_amount
            FROM property p
            LEFT JOIN owner o ON p.primary_owner_code = o.owner_code
            LEFT JOIN contract_master c ON p.property_code = c.property_id
            ORDER BY p.property_code
        """)

        properties = cursor.fetchall()

        # Convert dates
        for prop in properties:
            for date_field in ["creation_date", "contract_start_date", "contract_end_date"]:
                if prop.get(date_field):
                    prop[date_field] = prop[date_field].strftime("%Y-%m-%d")

        return jsonify({
            "success": True,
            "properties": properties,
            "total_count": len(properties)
        })

    except Exception as e:
        print("Error fetching properties report:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@reports_bp.route("/owners_report", methods=["GET"])
def owners_report():
    """Detailed owners report"""
    conn = get_owners_db()
    if not conn:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                o.owner_code,
                CONCAT(o.first_name, ' ', o.last_name) as full_name,
                o.email,
                o.mobile_number,
                o.nationality,
                o.city,
                o.country,
                COUNT(p.property_code) as property_count,
                SUM(p.property_value) as total_property_value,
                o.created_by
            FROM owner o
            LEFT JOIN property p ON o.owner_code = p.primary_owner_code
            GROUP BY o.owner_code, o.first_name, o.last_name, o.email, o.mobile_number,
                     o.nationality, o.city, o.country, o.created_by
            ORDER BY o.owner_code
        """)

        owners = cursor.fetchall()

        # No date conversion needed for owners report

        return jsonify({
            "success": True,
            "owners": owners,
            "total_count": len(owners)
        })

    except Exception as e:
        print("Error fetching owners report:", e)
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()