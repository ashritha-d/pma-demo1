import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ListServTrans = () => {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/list_servtrans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRecords(data.data);
          setFiltered(data.data);
        } else alert("Error fetching data");
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleFilter = (status) => {
    setFilterStatus(status);
    if (!status) setFiltered(records);
    else setFiltered(records.filter((r) => r.StatusOfServiceRequest === status));
  };

  const handleSearch = (q) => {
    setSearchTerm(q);
    q = q.toLowerCase();
    setFiltered(
      records.filter(
        (r) =>
          r.ServiceRequestDescription?.toLowerCase().includes(q) ||
          r.TenantName?.toLowerCase().includes(q) ||
          r.PropertyCode?.toString().includes(q) ||
          r.building_name?.toLowerCase().includes(q)
      )
    );
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
        Service Transactions List
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
        {/* Top Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {new Date().toLocaleDateString()} | Total Records: {records.length}
          </div>

          <input
            placeholder="🔍 Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              width: 300,
            }}
          />

          <div>
            <label style={{ marginRight: 8 }}>Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => handleFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                marginRight: 12,
              }}
            >
              <option value="">All</option>
              <option value="OP">Open</option>
              <option value="IP">In Progress</option>
              <option value="CL">Closed</option>
            </select>

            <Link
              to="/index"
              style={{
                backgroundColor: "gray",
                textDecoration: "none",
                color: "#fff",
                fontWeight: "bold",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              ← Go Back Home
            </Link>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Seq No",
                  "Property",
                  "Tenant",
                  "Type",
                  "Description",
                  "Login Date",
                  "Est. Cost",
                  "Act. Cost",
                  "Status",
                  
                ].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.SequenceNo} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <td style={tdStyle}>{r.SequenceNo}</td>
                  <td style={tdStyle}>{r.building_name || r.PropertyCode}</td>
                  <td style={tdStyle}>{r.TenantName || "-"}</td>
                  <td style={tdStyle}>{r.ServiceRequestType}</td>
                  <td style={tdStyle}>{r.ServiceRequestDescription}</td>
                  <td style={tdStyle}>{r.ServiceRequestLoginDate}</td>
                  <td style={tdStyle}>{r.ServiceRequestEstimatedCost || "-"}</td>
                  <td style={tdStyle}>{r.ServiceRequestActualCost || "-"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        backgroundColor:
                          r.StatusOfServiceRequest === "OP"
                            ? "#f1c40f"
                            : r.StatusOfServiceRequest === "IP"
                            ? "#3498db"
                            : "#2ecc71",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      {r.StatusOfServiceRequest}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: 16 }}>
                    No service transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// --- Styles (consistent with OwnersList) ---
const thStyle = {
  padding: 8,
  border: "1px solid #ddd",
  background: "#273c75",
  color: "#fff",
  userSelect: "none",
};
const tdStyle = {
  padding: 6,
  border: "1px solid #eee",
  verticalAlign: "middle",
};

export default ListServTrans;
