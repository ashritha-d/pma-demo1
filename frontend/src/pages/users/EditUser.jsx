import React, { useState } from "react";

const ModifyUser = () => {
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/users/${userId}`);
      const data = await res.json();
      
      if (data) {
        setUserData(data);
        setFormData(data);
      } else {
        alert("User not found");
      }
    } catch (err) {
      alert("Error fetching user");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Error updating user");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Modify User</h2>

      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label>Enter User ID:</label>
        <input 
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={styles.searchInput}
          required
        />
        <button type="submit" style={styles.buttont}>Search</button>
      </form>

      {userData && (
        <form onSubmit={handleUpdate} style={styles.container}>
          
          <div style={styles.row}>
            <Input label="User ID" name="User_Id" value={formData.User_Id} readOnly />
            <Input label="User Name" name="User_Name" value={formData.User_Name} onChange={handleChange} />
            <Input label="Email" name="Email" type="email" value={formData.Email} onChange={handleChange} />
            <Input label="Mobile" name="Mobile" value={formData.Mobile} onChange={handleChange} />
            <Input label="Password" name="Password" type="password" value={formData.Password} onChange={handleChange} />
          </div>

          <div style={styles.row}>
            <Input label="Created By" name="Created_by" value={formData.Created_by} onChange={handleChange} />
            <Input label="Approved By" name="Approved_by" value={formData.Approved_by} onChange={handleChange} />
          </div>

          <div style={{ textAlign: "center", marginTop: "25px" }}>
            <a href="/index" style={styles.backButton}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Save Changes</button>
          </div>

        </form>
      )}
    </div>
  );
};

const Input = ({ label, name, value, onChange, readOnly, type = "text" }) => (
  <div>
    <label style={styles.label}>{label}</label>
    <input 
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      readOnly={readOnly}
      style={styles.input}
    />
  </div>
);

const styles = {
  page: { background: "#f5f6fa", padding: "20px" },
  title: { textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0" },
  searchInput: { width: "120px", padding: "7px", marginLeft: "10px", borderRadius: "5px" },
  searchButton: { padding: "7px 15px", background: "#0097e6", color: "white", border: "none", borderRadius: "5px", marginLeft: "10px" },
  container: { background: "white", padding: "20px", borderRadius: "10px", maxWidth: "1500px", margin: "20px auto", boxShadow: "0 0 10px #ccc" },
  row: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "15px", marginBottom: "15px" },
  label: { fontWeight: "bold" },
  input: { width: "90%", padding: "7px", borderRadius: "5px", border: "1px solid #ccc" },
  backButton: { background: "#492bc0ff", color: "white", padding: "10px", borderRadius: "6px", textDecoration: "none" },
  // saveButton: { background: "#0097e6", color: "white", padding: "10px 20px", borderRadius: "6px", marginLeft: "20px" },
    buttont: { width: 140,marginLeft: 10, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  deleteButton: { width: 160, padding: "10px 20px", backgroundColor: "#19d516ff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px",marginLeft: 10 },

};

export default ModifyUser;
