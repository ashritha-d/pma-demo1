import React, { useState } from "react";

const ModifyOwner = () => {
  const [ownerCode, setOwnerCode] = useState("");
  const [ownerData, setOwnerData] = useState(null);
  const [formData, setFormData] = useState({});
  const [eidPreview, setEidPreview] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [visaPreview, setVisaPreview] = useState(null);

  // -------- Format date as YYYY-MM-DD --------
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
    resetForm();

    try {
      const res = await fetch(`http://localhost:5000/owners/${ownerCode}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loadOwnerData(data.owner);
      } else {
        alert(data.message || "Owner not found");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching owner");
    }
  };

  // -------- Load Owner Data into State --------
  const loadOwnerData = (owner) => {
    // Convert date fields
    const dateFields = ["date_of_birth", "visa_expiry_date", "passport_expiry_date"];
    const formattedOwner = { ...owner };
    dateFields.forEach(field => {
      if (formattedOwner[field]) formattedOwner[field] = formatDate(formattedOwner[field]);
    });

    setOwnerData(formattedOwner);
    setFormData(formattedOwner);

    setEidPreview(owner.eid_image ? `data:image/jpeg;base64,${owner.eid_image}` : null);
    setPassportPreview(owner.passport_copy ? `data:image/jpeg;base64,${owner.passport_copy}` : null);
    setVisaPreview(owner.res_visa ? `data:image/jpeg;base64,${owner.res_visa}` : null);
  };

  const resetForm = () => {
    setOwnerData(null);
    setFormData({});
    setEidPreview(null);
    setPassportPreview(null);
    setVisaPreview(null);
  };

  // -------- Input Change --------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, [e.target.name]: file }));

    const reader = new FileReader();
    reader.onload = (event) => {
      if (type === "eid") setEidPreview(event.target.result);
      if (type === "passport") setPassportPreview(event.target.result);
      if (type === "visa") setVisaPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // -------- Update Owner --------
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!ownerData) return alert("Please search an owner first");

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append("owner_code", ownerData.owner_code);

    try {
      const res = await fetch("http://localhost:5000/update_owner", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();

      if (result.success) {
        alert(`✅ ${result.message}`);

        // Auto-refresh owner data after update
        const refreshRes = await fetch(`http://localhost:5000/owners/${ownerData.owner_code}`, {
          method: "GET",
          credentials: "include",
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.success) {
          loadOwnerData(refreshData.owner);
        }
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error updating owner");
    }
  };

  // -------- Render Input Rows --------
  const renderFields = (fields) => {
    const rows = [];
    for (let i = 0; i < fields.length; i += 5) {
      const rowFields = fields.slice(i, i + 5);
      rows.push(
        <div key={i} style={styles.row}>
          {rowFields.map((field) => (
            <div key={field.name}>
              <label style={styles.label}>{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          ))}
        </div>
      );
    }
    return rows;
  };

  // -------- Define Owner Fields --------
  const ownerFields = [
    { name: "salutation", label: "Salutation" },
    { name: "first_name", label: "First Name" },
    { name: "last_name", label: "Last Name" },
    { name: "nationality", label: "Nationality" },
    { name: "mobile_number", label: "Mobile Number" },
    { name: "email", label: "Email", type: "email" },
    { name: "passport_number", label: "Passport Number" },
    { name: "date_of_birth", label: "Date of Birth", type: "date" },
    { name: "visa_expiry_date", label: "Visa Expiry Date", type: "date" },
    { name: "passport_expiry_date", label: "Passport Expiry Date", type: "date" },
    { name: "address1", label: "Address 1" },
    { name: "address2", label: "Address 2" },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
    { name: "country", label: "Country" },
    { name: "zip_code", label: "Zip Code" },
  ];

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Modify Owner</h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label>Enter Owner Code:</label>
        <input
          type="text"
          value={ownerCode}
          onChange={(e) => setOwnerCode(e.target.value)}
          placeholder="Owner Code"
          required
          style={{ width: "120px", margin: "0 10px", padding: "6px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button type="submit" style={styles.buttont}>Search</button>
      </form>

      {/* Owner Form */}
      {ownerData && (
        <form onSubmit={handleUpdate} encType="multipart/form-data" style={styles.container}>
          {renderFields(ownerFields)}

          {/* File Upload Section */}
          <div style={styles.row}>
            <FileField label="Emirates ID" name="OwnerEID" preview={eidPreview} onChange={(e) => handleFileChange(e, "eid")} />
            <FileField label="Passport Copy" name="OwnerPassportCopy" preview={passportPreview} onChange={(e) => handleFileChange(e, "passport")} />
            <FileField label="Residence Visa" name="OwnerResVisa" preview={visaPreview} onChange={(e) => handleFileChange(e, "visa")} />
          </div>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: "20px", textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Modify Owner</button>
          </div>
        </form>
      )}
    </div>
  );
};

// -------- FileField Component --------
const FileField = ({ label, name, preview, onChange }) => (
  <div>
    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>{label}</label>
    <input type="file" name={name} onChange={onChange} style={{ width: "90%" }} />
    {preview && <img src={preview} alt={`${name} Preview`} style={{ maxWidth: "100px", maxHeight: "80px", marginTop: "5px" }} />}
  </div>
);

// -------- Styles --------
const styles = {
  page: { fontFamily: "Arial, sans-serif", padding: "20px", background: "#f5f6fa" },
  title: { textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0", margin: 0, fontSize: "24px" },
  container: { background: "white", padding: "25px", borderRadius: "10px", maxWidth: "1500px", margin: "0 auto 30px", boxShadow: "0 0 10px #ccc" },
  row: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "15px" },
  label: { fontWeight: "bold", marginBottom: "5px", display: "block" },
  input: { width: "90%", padding: "6px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { width: 200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  deleteButton: { width: 200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  buttont: { width: 160, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
};

export default ModifyOwner;
