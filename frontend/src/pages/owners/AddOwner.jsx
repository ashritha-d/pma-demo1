import React, { useState } from "react";

const AddOwner = () => {
  const [formData, setFormData] = useState({
    OwnerSalutation: "",
    OwnerFirstName: "",
    OwnerLastName: "",
    OwnerNationality: "",
    OwnerAddress1: "",
    OwnerAddress2: "",
    OwnerCity: "",
    OwnerState: "",
    OwnerCountry: "",
    OwnerZipCode: "",
    OwnerMobileNumber: "",
    OwnerEmailId: "",
    OwnerPassportNumber: "",
    OwnerDateOfBirth: "",
    OwnerVisaExpiryDate: "",
    OwnerPassportExpiryDate: ""
  });

  const [files, setFiles] = useState({
    OwnerEID: null,
    OwnerPassportCopy: null,
    OwnerResVisa: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(files).forEach(([key, file]) => data.append(key, file));

    try {
      const response = await fetch("http://localhost:5000/add_owner", {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      alert(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);

      if (result.success) e.target.reset();
    } catch (error) {
      alert("❌ Error submitting form! Check console for details.");
      console.error(error);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Add Owner</h2>

      <div style={styles.container}>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Row 1 */}
          <div style={styles.row}>
            <InputField label="Salutation" name="OwnerSalutation" value={formData.OwnerSalutation} onChange={handleChange} required />
            <InputField label="FirstName" name="OwnerFirstName" value={formData.OwnerFirstName} onChange={handleChange} required />
            <InputField label="LastName" name="OwnerLastName" value={formData.OwnerLastName} onChange={handleChange} required />
            <InputField label="Nationality" name="OwnerNationality" value={formData.OwnerNationality} onChange={handleChange} required />
            <InputField label="MobileNumber" name="OwnerMobileNumber" value={formData.OwnerMobileNumber} onChange={handleChange} required />
          </div>

          {/* Row 2 */}
          <div style={styles.row}>
            <InputField type="email" label="EmailId" name="OwnerEmailId" value={formData.OwnerEmailId} onChange={handleChange} required />
            <InputField label="PassportNumber" name="OwnerPassportNumber" value={formData.OwnerPassportNumber} onChange={handleChange} required />
            <InputField type="date" label="DateOfBirth" name="OwnerDateOfBirth" value={formData.OwnerDateOfBirth} onChange={handleChange} required />
            <InputField type="date" label="ExpiryDate" name="OwnerVisaExpiryDate" value={formData.OwnerVisaExpiryDate} onChange={handleChange} required />
            <InputField type="date" label="PassportExpiryDate" name="OwnerPassportExpiryDate" value={formData.OwnerPassportExpiryDate} onChange={handleChange} required />
          </div>

          {/* Row 3 */}
          <div style={styles.row}>
            <InputField label="Address1" name="OwnerAddress1" value={formData.OwnerAddress1} onChange={handleChange} required />
            <InputField label="Address2" name="OwnerAddress2" value={formData.OwnerAddress2} onChange={handleChange} />
            <InputField label="City" name="OwnerCity" value={formData.OwnerCity} onChange={handleChange} required />
            <InputField label="State" name="OwnerState" value={formData.OwnerState} onChange={handleChange} required />
            <InputField label="Country" name="OwnerCountry" value={formData.OwnerCountry} onChange={handleChange} required />
          </div>

          {/* Row 4 */}
          <div style={styles.row}>
            <InputField label="ZipCode" name="OwnerZipCode" value={formData.OwnerZipCode} onChange={handleChange} required />
          </div>

          {/* File Uploads */}
          <div style={styles.row}>
            <FileField label="EID" name="OwnerEID" onChange={handleFileChange} required />
            <FileField label="PassportCopy" name="OwnerPassportCopy" onChange={handleFileChange} required />
            <FileField label="ResVisa" name="OwnerResVisa" onChange={handleFileChange} required />
          </div>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: "20px", textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Add Owner</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable Input Component
const InputField = ({ label, name, value, onChange, type = "text", readOnly, required }) => (
  <div>
    <label style={styles.label}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} readOnly={readOnly} required={required} style={styles.input} />
  </div>
);

// Reusable File Input Component
const FileField = ({ label, name, onChange, required }) => (
  <div>
    <label style={styles.label}>{label}</label>
    <input type="file" name={name} onChange={onChange} style={styles.input} required={required} />
  </div>
);

const styles = {
  page: { background: "#f5f6fa", padding: 0, margin: 0 },
  title: { background: "#2f3640", color: "white", padding: "15px 0", textAlign: "center", margin: 0, fontSize: "24px" },
  container: { background: "white", maxWidth: "1500px", margin: "20px auto", padding: "25px", borderRadius: "10px", boxShadow: "0 0 10px #ccc" },
  row: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "15px" },
  label: { fontWeight: "bold", marginBottom: "5px", display: "block" },
  input: { width: "90%", padding: "7px", border: "1px solid #ccc", borderRadius: "6px" },
  button: { width: 200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  deleteButton: { width: 200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
};

export default AddOwner;
