import React, { useState } from "react";

const EditFinTrans = () => {
  const [refNo, setRefNo] = useState("");
  const [transaction, setTransaction] = useState(null);
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

  const readOnlyFields = [
    "FinTransRefNo",
    "PropertyCode",
    "TenancyContractNumber",
    "TenantName",
  ];

  const fields = [
    "FinTransRefNo",
    "PropertyCode",
    "TenancyContractNumber",
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
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!refNo) return alert("Enter a Transaction Reference Number");

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/fintrans/${refNo}`);
      const data = await res.json();

      if (res.ok && data.success && data.transaction) {
        const t = data.transaction;
        const formatted = {};
        Object.keys(t).forEach((k) => {
          formatted[k] = k.toLowerCase().includes("date") ? parseDate(t[k]) : t[k] || "";
        });
        setTransaction(t);
        setFormData(formatted);
      } else {
        alert(data.message || "Transaction not found");
        setTransaction(null);
        setFormData({});
      }
    } catch (err) {
      console.error("Error fetching transaction:", err);
      alert("Error fetching transaction");
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
    if (!transaction) return alert("Search a transaction first");

    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => data.append(key, val ?? ""));

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_fintrans", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert(result.message);
        await handleSearch();
      } else alert(result.message || "Failed to update transaction");
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert("Error updating transaction");
    } finally {
      setLoading(false);
    }
  };

  const getValue = (key) => formData[key] ?? "";

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15 }}>
        Edit Financial Transaction
      </h2>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label style={{ fontWeight: "bold" }}>Enter Transaction Ref No:</label>
        <input
          type="text"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
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
            width:200,
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {transaction && (
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

              return (
                <div key={field}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: 5 }}>
                    {labelize(field)}
                  </label>
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
              Update Transaction
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditFinTrans;
