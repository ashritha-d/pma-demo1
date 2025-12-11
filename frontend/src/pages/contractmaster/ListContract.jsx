import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

const ListContract = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Columns to display
  const columnOrder = [
    "contract_id",
    "property_code",
    "tenant_id",
    "tenant_name",
    "contract_start_date",
    "contract_end_date",
    "rent_amount",
    "deposit_amount",
    "rent_payment_mode",
    "new_or_old_tenant",
    "generate_contract",
    "send_email",
    "contract_status",
  ];

  const dateFields = ["contract_start_date", "contract_end_date"];

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/list_contracts", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) setContracts(data.contracts || []);
      else alert(data.message || "Error fetching contracts");
    } catch (err) {
      console.error(err);
      alert("Error fetching contracts");
    } finally {
      setLoading(false);
    }
  };

  const filtered = contracts.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.property_code?.toString() || "").toLowerCase().includes(q) ||
      (c.tenant_name?.toString().toLowerCase() || "").includes(q)
    );
  });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered;
    return [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (dateFields.includes(sortConfig.key))
        return sortConfig.direction === "asc"
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      if (!isNaN(valA) && !isNaN(valB))
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      return sortConfig.direction === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  }, [filtered, sortConfig]);

  const handleDelete = async (contractId) => {
    if (!window.confirm(`Delete contract ${contractId}?`)) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("contract_id", contractId);

      const res = await fetch("http://localhost:5000/delete_contract", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setContracts((prev) => prev.filter((c) => c.contract_id !== contractId));
      } else {
        alert(data.message || "Failed to delete contract");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting contract");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (contractId) => {
    if (!window.confirm("Send contract email to tenant?")) return;
    try {
      const res = await fetch("http://localhost:5000/send_contract_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_id: contractId }),
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) fetchContracts();
    } catch (err) {
      alert("Error sending email");
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2
        style={{
          textAlign: "center",
          background: "#2f3640",
          color: "white",
          padding: 15,
          margin: 0,
        }}
      >
        Contract List
      </h2>

      <div
        style={{
          maxWidth: 1600,
          margin: "20px auto",
          background: "#fff",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            {new Date().toLocaleDateString()} | Total Contracts: {contracts.length}
          </div>
          <input
            placeholder="Search by property or tenant"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
              width: 300,
            }}
          />
          <Link
            to="/index"
            style={{
              backgroundColor: "gray",
              textDecoration: "none",
              color: "#fff",
              fontWeight: "bold",
              padding: "15px 8px",
              borderRadius: 6,
            }}
          >
            ← Go Back Home
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columnOrder.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    style={{
                      padding: 6,
                      border: "1px solid #ddd",
                      background: "#273c75",
                      color: "#fff",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {col.toUpperCase()}
                    {sortConfig.key === col && (
                      <span style={{ marginLeft: 6 }}>
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}
                <th
                  style={{
                    padding: 6,
                    border: "1px solid #ddd",
                    background: "#273c75",
                    color: "#fff",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, idx) => (
                <tr
                  key={c.contract_id || idx}
                  style={{ background: idx % 2 === 0 ? "#fafafa" : "#fff" }}
                >
                  {columnOrder.map((key) => (
                    <td
                      key={key}
                      style={{
                        padding: 6,
                        border: "1px solid #eee",
                        textAlign: "center",
                      }}
                    >
                      {key === "property_code" ? (
                        <Link
                          to={`/property/view_property/${c.property_code}`}
                          style={{ color: "#2980b9", textDecoration: "underline" }}
                        >
                          {c.property_code}
                        </Link>
                      ) : key === "tenant_id" ? (
                        <Link
                          to={`/Tenants/view_tenant/${c.tenant_id}`}
                          style={{ color: "#27ae60", textDecoration: "underline" }}
                        >
                          {c.tenant_id}
                        </Link>
                      ) : ["generate_contract", "send_email", "contract_status"].includes(key) ? (
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            background:
                              key === "contract_status"
                                ? c[key] === "Closed"
                                  ? "#e74c3c"
                                  : c[key] === "Active"
                                  ? "#27ae60"
                                  : "#f39c12"
                                : c[key] === "Yes"
                                ? "#2ecc71"
                                : "#e67e22",
                            color: "#fff",
                            fontWeight: "bold",
                          }}
                        >
                          {c[key] || "—"}
                        </span>
                      ) : dateFields.includes(key) && c[key] ? (
                        c[key].slice(0, 10)
                      ) : (
                        c[key] ?? ""
                      )}
                    </td>
                  ))}
                  <td
                    style={{
                      display: "flex",
                      gap: 6,
                      justifyContent: "center",
                      padding: 6,
                    }}
                  >
                    <button
                      onClick={() => handleSendEmail(c.contract_id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "#2980b9",
                        color: "#fff",
                      }}
                    >
                      📧 Email
                    </button>
                    <button
                      onClick={() => handleDelete(c.contract_id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "#c0392b",
                        color: "#fff",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ListContract;
