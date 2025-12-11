import React, { useEffect, useState } from "react";

const ListFinTrans = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTrans, setEditingTrans] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ---------------- FETCH ALL ----------------
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/fintrans_list");
      const data = await res.json();
      if (res.ok && data.success) {
        setTransactions(data.transactions || []);
      } else {
        alert(data.message || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      alert("Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (FinTransRefNo) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch("http://localhost:5000/delete_fintrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ FinTransRefNo }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Transaction deleted successfully");
        fetchTransactions();
      } else {
        alert(data.message || "Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting transaction");
    }
  };

  // ---------------- EDIT MODAL ----------------
  const openEditModal = (t) => {
    setEditingTrans(t);
    setEditForm({
      ReceiptPayment: t.ReceiptPayment || "",
      ReceiptPaymentReason: t.ReceiptPaymentReason || "",
      ModeOfPayment: t.ModeOfPayment || "",
      TrDate: t.TrDate ? t.TrDate.slice(0, 10) : "",
      TrAmount: t.TrAmount || "",
      ReferenceNumber: t.ReferenceNumber || "",
      ChequeDate: t.ChequeDate ? t.ChequeDate.slice(0, 10) : "",
      BankName: t.BankName || "",
      BankCity: t.BankCity || "",
      IFSCCode: t.IFSCCode || "",
      ChequeStatus: t.ChequeStatus || "",
    });
  };

  const closeEditModal = () => {
    setEditingTrans(null);
    setEditForm({});
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingTrans) return;

    try {
      setEditLoading(true);
      const data = new FormData();
      data.append("FinTransRefNo", editingTrans.FinTransRefNo);
      Object.entries(editForm).forEach(([k, v]) => data.append(k, v ?? ""));

      const res = await fetch("http://localhost:5000/modify_fintrans", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert("✅ Transaction updated successfully");
        fetchTransactions();
        closeEditModal();
      } else {
        alert(result.message || "Failed to update transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating transaction");
    } finally {
      setEditLoading(false);
    }
  };

  // ---------------- SORT ----------------
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
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

  const filteredTrans = transactions
    .filter((t) => {
      const q = searchTerm.toLowerCase();
      return (
        t.PropertyCode?.toString().includes(q) ||
        t.FinTransRefNo?.toString().includes(q) ||
        t.TenantName?.toLowerCase().includes(q) ||
        t.ReceiptPaymentReason?.toLowerCase().includes(q)
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

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Financial Transactions List
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: "bold" }}>
            {new Date().toLocaleDateString()} | Total Transactions: {transactions.length}
          </div>
          <input
            placeholder="Search transaction..."
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
                {[
                  "FinTransRefNo",
                  "PropertyCode",
                  "TenancyID",
                  "TenantName",
                  "ReceiptPayment",
                  "ReceiptPaymentReason",
                  "ModeOfPayment",
                  "TrDate",
                  "TrAmount",
                  "ReferenceNumber",
                  "ChequeDate",
                  "BankName",
                  "BankCity",
                  "IFSCCode",
                  "ChequeStatus",
                  "CreatedBy",
                  "CreationDate",
                ].map((key) => (
                  <th key={key} style={thStyle} onClick={() => handleSort(key)}>
                    {key} {getSortIndicator(key)}
                  </th>
                ))}
                {/* <th style={thStyle}>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredTrans.map((t, i) => (
                <tr key={t.FinTransRefNo || i} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <td style={tdStyle}>{t.FinTransRefNo}</td>
                  <td style={tdStyle}>{t.PropertyCode}</td>
                  <td style={tdStyle}>{t.TenancyContractNumber}</td>
                  <td style={tdStyle}>{t.TenantName || "-"}</td>
                  <td style={tdStyle}>{t.ReceiptPayment}</td>
                  <td style={tdStyle}>{t.ReceiptPaymentReason || "-"}</td>
                  <td style={tdStyle}>{t.ModeOfPayment}</td>
                  <td style={tdStyle}>{t.TrDate}</td>
                  <td style={tdStyle}>{t.TrAmount}</td>
                  <td style={tdStyle}>{t.ReferenceNumber}</td>
                  <td style={tdStyle}>{t.ChequeDate || "-"}</td>
                  <td style={tdStyle}>{t.BankName || "-"}</td>
                  <td style={tdStyle}>{t.BankCity || "-"}</td>
                  <td style={tdStyle}>{t.IFSCCode || "-"}</td>
                  <td style={tdStyle}>{t.ChequeStatus || "-"}</td>
                  <td style={tdStyle}>{t.CreatedBy || "-"}</td>
                  <td style={tdStyle}>{t.CreationDate || "-"}</td>
                  {/* <td style={{ display: "flex", justifyContent: "center", gap: 8, padding: 6 }}>
                    <button onClick={() => openEditModal(t)} style={btnStyle}>
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.FinTransRefNo)}
                      style={{ ...btnStyle, background: "#c0392b", color: "#fff" }}
                    >
                      🗑️ Delete
                    </button>
                  </td> */}
                </tr>
              ))}
              {filteredTrans.length === 0 && (
                <tr>
                  <td colSpan="18" style={{ padding: 16, textAlign: "center" }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingTrans && (
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
            <h3>Edit Transaction — #{editingTrans.FinTransRefNo}</h3>
            <form onSubmit={submitEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {Object.keys(editForm).map((key) => (
                  <div key={key}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>
                      {key.replace(/_/g, " ").toUpperCase()}
                    </label>
                    {key.toLowerCase().includes("date") ? (
                      <input
                        type="date"
                        name={key}
                        value={editForm[key] || ""}
                        onChange={onEditChange}
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        type="text"
                        name={key}
                        value={editForm[key] || ""}
                        onChange={onEditChange}
                        style={inputStyle}
                      />
                    )}
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
const btnStyle = { padding: "6px 10px", borderRadius: 6, cursor: "pointer" };
const inputStyle = { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" };

export default ListFinTrans;
