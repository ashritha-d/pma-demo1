import React, { useState } from "react";

const DeleteTenant = ({ sessionUser }) => {
  const [tenancyId, setTenancyId] = useState("");
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(false);

  const photoFields = [
    "PassportCopyPath",
    "EIDCopyPath",
    "ResidenceVisaCopyPath",
    "BankStatementCopyPath",
    "DepositChequeCopyPath",
    "SecurityChequeCopyPath",
    "EjariMunicipalRegistrationCopyPath",
  ];

  // ------------------- Format Date -------------------
  const formatDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return "";
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // ------------------- Labelize -------------------
  const labelize = (s) =>
    s.replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .trim();

  // ------------------- Search Tenant -------------------
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!tenancyId) return alert("Please enter a tenant contract number");

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_tenant/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tenancyContractNumber: tenancyId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTenant(data.tenant);
      } else {
        alert(data.message || "Tenant not found");
        setTenant(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching tenant");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Delete Tenant -------------------
  const handleDelete = async () => {
    if (!tenant) return;
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_tenant/delete", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ tenancyContractNumber: tenant.TenancyContractNumber }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ ${data.message}`);
        setTenant(null);
        setTenancyId("");
      } else {
        alert(`❌ ${data.message || "Failed to delete tenant"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f5f6fa" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Delete Tenant
      </h2>

      {/* Search Tenant */}
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <form onSubmit={handleSearch}>
          <label style={{ fontWeight: "bold", marginRight: 8 }}>Enter Tenant Number:</label>
          <input
            type="text"
            value={tenancyId}
            onChange={(e) => setTenancyId(e.target.value)}
            placeholder="Ex: TC001"
            required
            style={{ width: 120, padding: 6, borderRadius: 5, border: "1px solid #aaa" }}
          />
          <button
            type="submit"
            style={{
              padding: "6px 12px",
              marginLeft: 6,
              background: "#273c75",
              color: "white",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
              width: 200,
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {tenant && (
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            background: "white",
            padding: 25,
            borderRadius: 10,
            boxShadow: "0 0 15px rgba(0,0,0,0.1)",
          }}
        >
          {/* Tenant Info */}
          {[
            ["TenantName","TenantDOB","TenantNationality","TenantPassportNumber"],
            ["TenantEmiratesID","TenantPassportExpiryDate","TenantEIDExpiryDate","TenantEmployer","TenantMobileNumber"],
            ["TenantEmailID","LeaseStartDate","LeaseEndDate","MoveInDate","MoveOutDate"],
            ["RentAmount","DepositAmountReceived","NumberOfPayments","RentAmountReceived","RentAmountOutstanding"]
          ].map((row, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: 15, marginBottom: 15 }}>
              {row.map((field) => (
                <div key={field}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>{labelize(field)}</label>
                  <input
                    type={field.toLowerCase().includes("date") ? "date" : "text"}
                    value={field.toLowerCase().includes("date") ? formatDate(tenant[field]) : tenant[field] || ""}
                    readOnly
                    style={{ width: "80%", padding: 7, border: "1px solid #ccc", borderRadius: 6, background: "#f3f3f3" }}
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Photos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, textAlign: "center", marginTop: 20 }}>
            {photoFields.map((field) => (
              <div key={field}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                {tenant[field] ? (
                  <img
                    src={`data:image/jpeg;base64,${tenant[field]}`}
                    alt={field}
                    style={{ width: 60, height: 60, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                ) : (
                  <p style={{ margin: "6px 0" }}>No file</p>
                )}
              </div>
            ))}
          </div>

          {/* Delete Button */}
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <a
              href="/index"
              style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: 20, textDecoration: "none", display: "inline-block" }}
            >
              ← Go Back Home
            </a>
            <button onClick={handleDelete} type="button" style={styles.deleteButton}>
              Delete Tenant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  button: { width: 200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 16 },
  deleteButton: { width: 200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: 16 },
};

export default DeleteTenant;
