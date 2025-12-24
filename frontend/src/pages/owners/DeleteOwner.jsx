import React, { useState } from "react";

const DeleteOwner = () => {
  const [ownerCode, setOwnerCode] = useState("");
  const [ownerData, setOwnerData] = useState(null);
  const [eidPreview, setEidPreview] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [visaPreview, setVisaPreview] = useState(null);

  // -------- Format Date Helper --------
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // -------- Search Owner --------
  const handleSearch = async (e) => {
    e.preventDefault();
    setOwnerData(null);
    setEidPreview(null);
    setPassportPreview(null);
    setVisaPreview(null);

    try {
      const res = await fetch(`http://localhost:5000/owners/${ownerCode}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOwnerData(data.owner);
        setEidPreview(data.owner.eid_image ? `http://localhost:5000/owner_image/${data.owner.owner_code}/eid_image` : null);
        setPassportPreview(data.owner.passport_copy ? `http://localhost:5000/owner_image/${data.owner.owner_code}/passport_copy` : null);
        setVisaPreview(data.owner.res_visa ? `http://localhost:5000/owner_image/${data.owner.owner_code}/res_visa` : null);
      } else {
        alert(data.message || "Owner not found");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching owner");
    }
  };

  // -------- Delete Owner --------
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!ownerData) return;
    if (!window.confirm(`Are you sure you want to delete owner ${ownerData.owner_code}?`)) return;

    try {
      const res = await fetch("http://localhost:5000/delete_owner", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_code: ownerData.owner_code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ ${data.message}`);
        setOwnerData(null);
        setOwnerCode("");
        setEidPreview(null);
        setPassportPreview(null);
        setVisaPreview(null);
      } else {
        alert(`❌ ${data.message || "Error deleting owner"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting owner");
    }
  };

  // -------- Render Owner Fields --------
  const renderFields = () => {
    if (!ownerData) return null;
    const fields = [
      "salutation", "first_name", "last_name", "nationality",
      "address1", "address2", "city", "state",
      "country", "zip_code", "mobile_number", "email",
      "passport_number", "date_of_birth", "visa_expiry_date", "passport_expiry_date"
    ];
    return fields.map((field, idx) => (
      <div key={idx} style={styles.field}>
        <label style={styles.label}>{field.replace(/_/g," ").toUpperCase()}</label>
        <input
          type={field.includes("date") ? "date" : "text"}
          value={field.includes("date") ? formatDate(ownerData[field]) : ownerData[field] || ""}
          readOnly
          style={styles.input}
        />
      </div>
    ));
  };

  // -------- File Preview Component --------
  const FilePreview = ({ label, preview }) => (
    <div style={{ textAlign: "center" }}>
      <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>{label}</label>
      {preview ? (
        <img src={preview} alt={label} style={{ maxWidth: "150px", maxHeight: "120px", borderRadius: "8px", border: "1px solid #ccc" }} />
      ) : (
        <p style={{ fontSize: "0.8rem", color: "#666" }}>No file</p>
      )}
    </div>
  );

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Delete Owner</h2>

      {/* Search Form */}
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <form onSubmit={handleSearch}>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Enter Owner Code:</label>
          <input
            type="text"
            value={ownerCode}
            onChange={(e) => setOwnerCode(e.target.value)}
            style={{ width: "120px", padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
          <button type="submit" style={{ width:100, padding: "6px 12px", background: "#273c75", color: "white", border: "none", borderRadius: "5px", marginLeft: "10px", cursor: "pointer" }}>
            Search
          </button>
        </form>
      </div>

      {/* Owner Details */}
      {ownerData && (
        <form onSubmit={handleDelete} style={styles.container}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {renderFields()}
          </div>

          {/* Images */}
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "20px" }}>
            <FilePreview label="Emirates ID" preview={eidPreview} />
            <FilePreview label="Passport Copy" preview={passportPreview} />
            <FilePreview label="Residence Visa" preview={visaPreview} />
          </div>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: "20px", textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Delete Owner</button>
          </div>
        </form>
      )}
    </div>
  );
};

// -------- Styles --------
const styles = {
  page: { fontFamily: "Arial, sans-serif", padding: "20px", background: "#f5f6fa" },
  title: { textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0", margin: 0 },
  container: { background: "white", width: "100%", maxWidth: "1500px", margin: "0 auto", padding: "25px", borderRadius: "10px", boxShadow: "0 0 10px #ccc" },
  field: { flex: "1 0 20%" },
  label: { fontWeight: "bold" },
  input: { width: "90%", padding: "5px", marginTop: "3px", borderRadius: "5px", border: "1px solid #ccc", background: "#f0f0f0" },
  button: { width:200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  deleteButton: { width:200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
};

export default DeleteOwner;
