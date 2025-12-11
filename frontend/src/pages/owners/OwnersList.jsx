// OwnersList.jsx
import React, { useEffect, useState } from "react";

const OwnersList = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewSrc, setPreviewSrc] = useState(null);

  const [editingOwner, setEditingOwner] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFiles, setEditFiles] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const imageFields = ["eid_image", "passport_copy", "res_visa"];

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/owners_list", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success) {
        setOwners(data.owners || []);
      } else {
        alert(data.message || "Failed to fetch owners");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching owners");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (owner_code) => {
    if (!window.confirm("Are you sure you want to delete this owner?")) return;
    try {
      const res = await fetch("http://localhost:5000/delete_owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ owner_code }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Owner deleted successfully");
        fetchOwners();
      } else {
        alert(data.message || "Failed to delete owner");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting owner");
    }
  };

  const openEditModal = (owner) => {
    setEditingOwner(owner);
    setEditForm({
      first_name: owner.first_name || "",
      last_name: owner.last_name || "",
      email: owner.email || "",
      mobile_number: owner.mobile_number || "",
      nationality: owner.nationality || "",
      address1: owner.address1 || "",
      address2: owner.address2 || "",
      city: owner.city || "",
      state: owner.state || "",
      country: owner.country || "",
      date_of_birth: owner.date_of_birth ? owner.date_of_birth.slice(0, 10) : "",
      visa_expiry_date: owner.visa_expiry_date ? owner.visa_expiry_date.slice(0, 10) : "",
      passport_expiry_date: owner.passport_expiry_date ? owner.passport_expiry_date.slice(0, 10) : "",
    });
    setEditFiles({});
  };

  const closeEditModal = () => {
    setEditingOwner(null);
    setEditForm({});
    setEditFiles({});
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const onEditFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditFiles((prev) => ({ ...prev, [key]: file }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingOwner) return;
    try {
      setEditLoading(true);
      const data = new FormData();
      data.append("owner_code", editingOwner.owner_code);

      Object.entries(editForm).forEach(([k, v]) => data.append(k, v ?? ""));
      if (editFiles.eid_image) data.append("OwnerEID", editFiles.eid_image);
      if (editFiles.passport_copy) data.append("OwnerPassportCopy", editFiles.passport_copy);
      if (editFiles.res_visa) data.append("OwnerResVisa", editFiles.res_visa);

      const res = await fetch("http://localhost:5000/update_owner", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("✅ Owner updated successfully");
        fetchOwners();
        closeEditModal();
      } else {
        alert(result.message || "Failed to update owner");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating owner");
    } finally {
      setEditLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // toggle asc <-> desc <-> none
        const newDir = prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc";
        return { key: newDir ? key : null, direction: newDir || "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return " ";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const filteredOwners = owners
    .filter((o) => {
      const q = searchTerm.toLowerCase();
      return (
        o.first_name?.toLowerCase().includes(q) ||
        o.last_name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.mobile_number?.toLowerCase().includes(q) ||
        o.nationality?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";
      return sortConfig.direction === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

  const renderImage = (o, key, size = 48) => {
    if (!o[key]) return <div style={{ fontSize: 12, color: "#666" }}>—</div>;
    const src = `data:image/jpeg;base64,${o[key]}`;
    return (
      <img
        src={src}
        alt={key}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius: 4,
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
        onClick={() => setPreviewSrc(src)}
      />
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Owner List
      </h2>

      <div
        style={{
          maxWidth: 1500,
          margin: "20px auto",
          background: "white",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 0 12px rgba(0,0,0,0.12)",
          overflowX: "auto",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}
        >
          <div style={{ fontWeight: "bold" }}>
            {new Date().toLocaleDateString()} | Total Owners: {owners.length}
          </div>
          <input
            placeholder="Search owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", width: 350 }}
          />
          <a
            href="/index"
            style={{
              backgroundColor: "gray",
              textDecoration: "none",
              color: "#333",
              fontWeight: "bold",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            ← Go Back Home
          </a>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort("owner_code")}>
                  Owner Code {getSortIndicator("owner_code")}
                </th>
                <th style={thStyle} onClick={() => handleSort("first_name")}>
                  First Name {getSortIndicator("first_name")}
                </th>
                <th style={thStyle} onClick={() => handleSort("last_name")}>
                  Last Name {getSortIndicator("last_name")}
                </th>
                <th style={thStyle} onClick={() => handleSort("email")}>
                  Email {getSortIndicator("email")}
                </th>
                <th style={thStyle} onClick={() => handleSort("mobile_number")}>
                  Mobile {getSortIndicator("mobile_number")}
                </th>
                <th style={thStyle} onClick={() => handleSort("nationality")}>
                  Nationality {getSortIndicator("nationality")}
                </th>
                
                <th style={thStyle}>EID</th>
                <th style={thStyle}>Passport</th>
                <th style={thStyle}>Visa</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map((o, i) => (
                <tr key={o.owner_code || i} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <td style={tdStyle}>{`OW${o.owner_code.toString().padStart(5, "0")}`}</td>
                  <td style={tdStyle}>{o.first_name}</td>
                  <td style={tdStyle}>{o.last_name}</td>
                  <td style={tdStyle}>{o.email}</td>
                  <td style={tdStyle}>{o.mobile_number}</td>
                  <td style={tdStyle}>{o.nationality}</td>
                  <td style={tdStyleCenter}>{renderImage(o, "eid_image")}</td>
                  <td style={tdStyleCenter}>{renderImage(o, "passport_copy")}</td>
                  <td style={tdStyleCenter}>{renderImage(o, "res_visa")}</td>
                  <td style={{ display: "flex", justifyContent: "center", gap: 8, padding: 6 }}>
                    <button onClick={() => openEditModal(o)} style={btnStyle}>
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(o.owner_code)}
                      style={{ ...btnStyle, background: "#c0392b", color: "#fff" }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOwners.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ padding: 16, textAlign: "center" }}>
                    No owners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Image Preview */}
      {previewSrc && (
        <div
          onClick={() => setPreviewSrc(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <img src={previewSrc} alt="preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 6 }} />
        </div>
      )}

      {/* Edit Modal */}
      {editingOwner && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 800,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3>Edit Owner — {`OW${editingOwner.owner_code.toString().padStart(5, "0")}`}</h3>
            <form onSubmit={submitEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {Object.keys(editForm).map((key) => (
                  <div key={key}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </label>
{/**** FIXED DATE DETECTION ****/}
{key.toLowerCase().includes("date") ? (
  <input
    type="date"
    name={key}
    value={editForm[key] || ""}
    onChange={onEditChange}
    style={{
      width: "100%",
      padding: 8,
      borderRadius: 6,
      border: "1px solid #ccc",
    }}
  />
) : (
  <input
    type="text"
    name={key}
    value={editForm[key] || ""}
    onChange={onEditChange}
    style={{
      width: "100%",
      padding: 8,
      borderRadius: 6,
      border: "1px solid #ccc",
    }}
  />
)}
                  </div>
                ))}
              </div>

              <hr style={{ margin: "16px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {imageFields.map((imgKey) => (
                  <div key={imgKey} style={{ textAlign: "center" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>
                      {imgKey.toUpperCase()}
                    </label>
                    {editingOwner[imgKey] ? (
                      <img
                        src={`data:image/jpeg;base64,${editingOwner[imgKey]}`}
                        alt={imgKey}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          marginBottom: 8,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: "#f3f3f3",
                          borderRadius: 6,
                          margin: "0 auto 8px",
                        }}
                      />
                    )}
                    <input type="file" onChange={(e) => onEditFileChange(e, imgKey)} />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" onClick={closeEditModal} style={{ padding: "8px 12px", borderRadius: 6 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ padding: "8px 12px", borderRadius: 6, background: "#2ecc71", color: "#fff" }}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const thStyle = {
  padding: 8,
  border: "1px solid #ddd",
  background: "#273c75",
  color: "#fff",
  cursor: "pointer",
  userSelect: "none",
};
const tdStyle = { padding: 6, border: "1px solid #eee" };
const tdStyleCenter = { ...tdStyle, textAlign: "center" };
const btnStyle = { padding: "6px 10px", borderRadius: 6, cursor: "pointer" };

export default OwnersList;
