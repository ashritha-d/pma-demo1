import React, { useEffect, useState } from "react";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("User_Id");
  const [sortOrder, setSortOrder] = useState("asc");

  // Sorting handler
  const handleSort = (field) => {
    const order =
      sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
  };

  // Sorting logic
  const sorted = [...users].sort((a, b) => {
    const x = a[sortField]?.toString().toLowerCase();
    const y = b[sortField]?.toString().toLowerCase();

    if (x < y) return sortOrder === "asc" ? -1 : 1;
    if (x > y) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Search filter on sorted data
  const filtered = sorted.filter((u) =>
    Object.values(u).some((v) =>
      v?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      alert("Error loading users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    const res = await fetch(`http://localhost:5000/users/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    alert(data.message);
    fetchUsers();
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Users List</h2>

      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={{ fontWeight: "bold" }}>
            {new Date().toLocaleDateString()} | Total Users: {users.length}
          </div>

          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />

          <a href="/index" style={styles.backButton}>
            ← Go Back Home
          </a>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th} onClick={() => handleSort("User_Id")}>
                User ID{" "}
                {sortField === "User_Id" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
              </th>

              <th style={styles.th} onClick={() => handleSort("User_Name")}>
                User Name{" "}
                {sortField === "User_Name"
                  ? sortOrder === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th style={styles.th} onClick={() => handleSort("Email")}>
                Email{" "}
                {sortField === "Email"
                  ? sortOrder === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th style={styles.th} onClick={() => handleSort("Mobile")}>
                Mobile{" "}
                {sortField === "Mobile"
                  ? sortOrder === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th style={styles.th} onClick={() => handleSort("Created_by")}>
                Created By{" "}
                {sortField === "Created_by"
                  ? sortOrder === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th style={styles.th} onClick={() => handleSort("Approved_by")}>
                Approved By{" "}
                {sortField === "Approved_by"
                  ? sortOrder === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u.User_Id}>
                <td style={styles.td}>{u.User_Id}</td>
                <td style={styles.td}>{u.User_Name}</td>
                <td style={styles.td}>{u.Email}</td>
                <td style={styles.td}>{u.Mobile}</td>
                <td style={styles.td}>{u.Created_by}</td>
                <td style={styles.td}>{u.Approved_by}</td>
                <td style={styles.actions}>
                  <a
                    href={`/edit-user/${u.User_Id}`}
                    style={styles.editBtn}
                  >
                    ✏️ Edit
                  </a>
                  <button
                    onClick={() => handleDelete(u.User_Id)}
                    style={styles.deleteBtn}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ------------------ STYLES ------------------

const styles = {
  page: { background: "#f5f6fa", padding: "20px" },
  title: {
    background: "#2f3640",
    color: "white",
    padding: "15px",
    textAlign: "center",
  },
  container: {
    background: "white",
    maxWidth: "1500px",
    margin: "20px auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 0 10px #ccc",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  searchInput: {
    width: "300px",
    padding: "7px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  backButton: {
    background: "gray",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    textDecoration: "none",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "8px",
    background: "#273c75",
    color: "white",
    border: "1px solid #ddd",
    cursor: "pointer",
  },
  td: { padding: "8px", border: "1px solid #ddd" },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    padding: "8px",
  },
  editBtn: {
    padding: "5px 10px",
    background: "#0097e6",
    color: "white",
    borderRadius: "5px",
    textDecoration: "none",
  },
  deleteBtn: {
    padding: "5px 10px",
    background: "#c0392b",
    color: "white",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
};

export default UsersList;
