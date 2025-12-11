import React, { useState } from "react";

const AddUser = () => {
  const [formData, setFormData] = useState({
    User_Name: "",
    Email: "",
    Mobile: "",
    Password: "",
    Created_by: "",
    Approved_by: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:5000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      alert(
  result.success 
    ? `✅ ${result.message}\n\nGenerated User ID: ${result.User_Id}` 
    : `❌ ${result.message}`
);


      if (result.success) {
        setFormData({
          User_Name: "",
          Email: "",
          Mobile: "",
          Password: "",
          Created_by: "",
          Approved_by: ""
        });
      }
    } catch (error) {
      alert("❌ Error submitting form! Check backend.");
      console.error(error);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Add User</h2>

      <div style={styles.container}>
        <form onSubmit={handleSubmit}>

          {/* Row 1 */}
          <div style={styles.row}>
            <InputField label="User Name" name="User_Name" value={formData.User_Name} onChange={handleChange} required />
            <InputField label="Email" name="Email" value={formData.Email} onChange={handleChange} type="email" required />
            <InputField label="Mobile" name="Mobile" value={formData.Mobile} onChange={handleChange} required />
            <InputField label="Password" name="Password" type="password" value={formData.Password} onChange={handleChange} required />
            <InputField label="Created By" name="Created_by" value={formData.Created_by} onChange={handleChange} required />
          </div>

          {/* Row 2 */}
          <div style={styles.row}>
            <InputField label="Approved By" name="Approved_by" value={formData.Approved_by} onChange={handleChange} required />
          </div>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a
              href="/index"
              style={{
                ...styles.button,
                backgroundColor: "#492bc0ff",
                marginRight: "20px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              ← Go Back Home
            </a>
            <button type="submit" style={styles.deleteButton}>Add User</button>
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
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      style={styles.input}
    />
  </div>
);

// Same styles as AddOwner
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

export default AddUser;
