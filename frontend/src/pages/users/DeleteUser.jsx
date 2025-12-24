import React, { useState } from "react";

const DeleteUser = () => {
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:5000/users/${userId}`);
      const data = await res.json();

      if (data) setUserData(data);
      else alert("User not found");

    } catch (err) {
      alert("Error fetching user");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!window.confirm(`Are you sure you want to delete user ${userId}?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/users/${userId}`, { method: "DELETE" });
      const data = await res.json();

      alert(data.message);
      setUserData(null);

    } catch (err) {
      alert("Error deleting user");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Delete User</h2>

      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px" }}>
        <label>Enter User ID:</label>
        <input 
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>Search</button>
      </form>

      {userData && (
        <form onSubmit={handleDelete} style={styles.container}>
          
          <div style={styles.row}>
            <Field label="User ID" value={userData.User_Id} />
            <Field label="User Name" value={userData.User_Name} />
            <Field label="Email" value={userData.Email} />
            <Field label="Mobile" value={userData.Mobile} />
            <Field label="Password" value={userData.Password} />
          </div>

          <div style={styles.row}>
            <Field label="Created By" value={userData.Created_by} />
            <Field label="Approved By" value={userData.Approved_by} />
          </div>

          <div style={{ textAlign: "center", marginTop: "25px" }}>
            <a href="/index" style={styles.backButton}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Delete User</button>
          </div>

        </form>
      )}
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <label style={styles.label}>{label}</label>
    <input value={value} readOnly style={styles.input} />
  </div>
);

const styles = {
  page: { background: "#f5f6fa", padding: "20px" },
  title: { background: "#2f3640", color: "white", padding: "15px", textAlign: "center" },
  searchInput: { width: "120px", padding: "7px", marginLeft: "10px", borderRadius: "5px" },
  searchButton: { padding: "7px 15px", background: "#0097e6", color: "white", borderRadius: "5px", marginLeft: "10px",width: 140},
  container: { maxWidth: "1500px", margin: "20px auto", background: "white", padding: "25px", borderRadius: "10px", boxShadow: "0 0 10px #ccc" },
  row: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "15px", marginBottom: "15px" },
  label: { fontWeight: "bold" },
  input: { width: "90%", padding: "7px", borderRadius: "6px", border: "1px solid #ccc", background: "#f0f0f0" },
  deleteButton: { width: 200, padding: "10px 20px", backgroundColor: "#f22913ff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer",marginLeft: 10 },
  backButton: { background: "#2b44c0ff", color: "white", padding: "10px 20px", borderRadius: "5px", textDecoration: "none" }
};

export default DeleteUser;
