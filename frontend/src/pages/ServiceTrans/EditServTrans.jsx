import React, { useState } from "react";

const EditServTrans = () => {
  const [seqNo, setSeqNo] = useState("");
  const [service, setService] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const parseDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
  };

  const labelize = (s) =>
    s.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  const readOnlyFields = ["SequenceNo", "PropertyCode", "TenancyContractNumber"];

  const fields = [
    "SequenceNo",
    "PropertyCode",
    "TenancyContractNumber",
    "ServiceRequestType",
    "ServiceRequestDescription",
    "ServiceRequestLoginDate",
    "ServiceRequestAttendedBy",
    "ServiceRequestStartDate",
    "ServiceRequestEstimatedCost",
    "ServiceRequestActualCost",
    "StatusOfServiceRequest",
    "ServiceRequestEndDate",
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!seqNo) return alert("Enter a Service Transaction Sequence Number");

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/get_servtrans/${seqNo}`);
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const t = data.data;
        const formatted = {};
        Object.keys(t).forEach((k) => {
          formatted[k] = k.toLowerCase().includes("date") ? parseDate(t[k]) : t[k] || "";
        });
        setService(t);
        setFormData(formatted);
      } else {
        alert(data.message || "Record not found");
        setService(null);
        setFormData({});
      }
    } catch (err) {
      console.error("Error fetching service record:", err);
      alert("Error fetching record");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!service) return alert("Search a service transaction first");

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => data.append(key, val ?? ""));

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/update_servtrans/${seqNo}`, {
        method: "POST",
        body: data,
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert(result.message);
        await handleSearch(e); // refresh data
      } else alert(result.message || "Failed to update record");
    } catch (err) {
      console.error("Error updating service record:", err);
      alert("Error updating record");
    } finally {
      setLoading(false);
    }
  };

  const getValue = (key) => formData[key] ?? "";

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15 }}>
        Edit Service Transaction
      </h2>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label style={{ fontWeight: "bold" }}>Enter Sequence No:</label>
        <input
          type="text"
          value={seqNo}
          onChange={(e) => setSeqNo(e.target.value)}
          required
          style={{ margin: "0 10px", padding: "6px", width: 150 }}
        />
        <button
          type="submit"
          style={{
            padding: "6px 12px",
            backgroundColor: "#273c75",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            width: 200,
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Edit Form */}
      {service && (
        <form
          onSubmit={handleUpdate}
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 0 10px #ccc",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 15,
              marginBottom: 15,
            }}
          >
            {fields.map((field) => {
              const isDate = field.toLowerCase().includes("date");
              const isReadOnly = readOnlyFields.includes(field);
              const isSelect =
                field === "ServiceRequestType" || field === "StatusOfServiceRequest";

              return (
                <div key={field}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
                    {labelize(field)}
                  </label>

                  {isSelect ? (
                    <select
                      name={field}
                      value={getValue(field)}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: 7,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="">Select</option>
                      {field === "ServiceRequestType" &&
                        [
  "Plumbing",
  "Painting",
  "Cleaning",
  "Damages",
  "Electrical",
  "Others"

].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      {field === "StatusOfServiceRequest" &&
                        ["Open Progress", "In Progress", "Closed "].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type={isDate ? "date" : "text"}
                      name={field}
                      value={getValue(field)}
                      onChange={isReadOnly ? undefined : handleChange}
                      readOnly={isReadOnly}
                      style={{
                        width: "100%",
                        padding: 7,
                        borderRadius: 6,
                        border: "1px solid #ccc",
                        backgroundColor: isReadOnly ? "#f0f0f0" : "white",
                        cursor: isReadOnly ? "not-allowed" : "text",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <a
              href="/index"
              style={{
                width: 200,
                padding: "10px 20px",
                backgroundColor: "#492bc0ff",
                color: "white",
                borderRadius: 6,
                textDecoration: "none",
                marginRight: 20,
              }}
            >
              ← Go Back Home
            </a>
            <button
              type="submit"
              style={{
                width: 200,
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Update Service
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditServTrans;
