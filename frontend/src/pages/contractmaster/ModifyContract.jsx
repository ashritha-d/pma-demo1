import React, { useState } from "react";

const ModifyContract = ({ sessionUser }) => {
  const [contractNumber, setContractNumber] = useState("");
  const [contract, setContract] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
const [viewMode, setViewMode] = useState(false);
const [messageStatus, setMessageStatus] = useState({ email: null, sms: null });

  const parseDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return "";
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const labelize = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

  const fields = [
    "contract_id",
    "property_id",
    "tenant_id",
    "tenant_name",
    "contract_start_date",
    "contract_end_date",
    "contract_termination_date",
    "move_in_date",
    "move_out_date",
    "rent_amount",
    "deposit_amount",
    "notice_period",
    "rent_payment_mode",
    "rent_payment_type",
    "deposit_payment_type",
    "new_or_old_tenant",
    "contract_renewal_date",
    "first_time_move_in_date",
    "rent_due_day"
  ];

  const paymentModes = ["cash", "cheque", "online", "card"];
  const rentTypes = ["monthly", "yearly", "halfyearly"];

  // ------------------- Search Contract -------------------
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!contractNumber) return alert("Please enter Contract Number");

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/contract/${contractNumber}`);
      const data = await res.json();

      if (res.ok && data.success && data.contract) {
        setContract(data.contract);

        const initial = {};
        Object.keys(data.contract).forEach((k) => {
          initial[k] = ["creation_date",
    "contract_start_date",
    "contract_end_date",
    "contract_termination_date",
    "move_in_date",
    "move_out_date",
    "first_time_move_in_date",
    "contract_renewal_date"].includes(k)
            ? parseDate(data.contract[k])
            : data.contract[k] ?? "";
        });
        setFormData(initial);
      } else {
        alert(data.message || "Contract not found");
        setContract(null);
        setFormData({});
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching contract");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Input Change -------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------- Update Contract -------------------
const handleUpdate = async (e) => {
  e.preventDefault();
  if (!contract) return alert("Search a contract first");

  const data = new FormData();
  data.append("contract_id", contract.contract_id || contractNumber);

  Object.entries(formData).forEach(([key, val]) => {
    if (val != null) data.append(key, val);
  });

  try {
    setLoading(true);
    const res = await fetch("http://localhost:5000/modify_contract", {
      method: "POST",
      credentials: "include",
      body: data,
    });
    const result = await res.json();

    if (res.ok && result.success) {
  let msg = `✅ ${result.message}`;
  if (result.fintrans) {
    msg += `\n\nFetched from FinTrans:\n`
         + `• Rent Amount: ${result.fintrans.rent_amount || "N/A"}\n`
         + `• Rent Mode: ${result.fintrans.rent_payment_mode || "N/A"}\n`
         + `• Deposit Amount: ${result.fintrans.deposit_amount || "N/A"}\n`
         + `• Deposit Mode: ${result.fintrans.deposit_payment_type || "N/A"}`;
    
    // 🪄 Update formData so values show in UI
    setFormData((prev) => ({
      ...prev,
      rent_amount: result.fintrans.rent_amount || "",
      rent_payment_mode: result.fintrans.rent_payment_mode || "",
      deposit_amount: result.fintrans.deposit_amount || "",
      deposit_payment_type: result.fintrans.deposit_payment_type || ""
    }));
  }
  alert(msg);
  await handleSearch(); // optional


    } else {
      alert(`❌ ${result.message || "Failed to update contract"}`);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error updating contract");
  } finally {
    setLoading(false);
  }
};
  const getValue = (key) => formData[key] ?? contract?.[key] ?? "";
  const readOnlyFields = ["contract_id","property_id","tenant_id","tenant_name"];

  // ------------------- Render -------------------
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Update Contract
      </h2>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label style={{ fontWeight: "bold", marginRight: 8 }}>Enter Contract ID:</label>
        <input
          type="text"
          value={contractNumber}
          onChange={(e) => setContractNumber(e.target.value)}
          placeholder="Ex: 1001"
          required
          style={{ width: 150, padding: 6, borderRadius: 5, border: "1px solid #aaa" }}
        />
        <button
          type="submit"
          style={{
            marginLeft: 8,
            padding: "6px 12px",
            background: "#273c75",
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

      {/* Contract Form */}
      {contract && (
        <form
          onSubmit={handleUpdate}
          encType="multipart/form-data"
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            background: "white",
            padding: 20,                                                                                                                                      
            borderRadius: 10,
            boxShadow: "0 0 10px #ccc",
          }}
        >
          {fields.reduce((rows, field, i) => {
            if (i % 5 === 0) rows.push([]);
            rows[rows.length - 1].push(field);
            return rows;
          }, []).map((cols, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 15, marginBottom: 15 }}>
              {cols.map((field) => {
                const isDate = field.includes("date");
                const isReadOnly = readOnlyFields.includes(field);

                // ----------------- Dropdowns -----------------
                if (["rent_payment_mode","deposit_payment_type"].includes(field)) {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                      <select name={field} value={getValue(field)} onChange={handleChange}>
                        <option value="">Select</option>
                        {paymentModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                      </select>
                    </div>
                  );
                }

                if (field === "rent_payment_type") {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                      <select name={field} value={getValue(field)} onChange={handleChange}>
                        <option value="">Select</option>
                        {rentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                  );
                }

                if (field === "new_or_old_tenant") {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                      <div>
                        <label>
                          <input type="radio" name={field} value="new" checked={getValue(field) === "new"} onChange={handleChange}/> New
                        </label>
                        <label style={{ marginLeft: 10 }}>
                          <input type="radio" name={field} value="old" checked={getValue(field) === "old"} onChange={handleChange}/> Old
                        </label>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={field}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
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
                        cursor: isReadOnly ? "not-allowed" : "text"
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 30 }}>
  <button
    type="button"
    onClick={async () => {
      if (!contract) return alert("Search a contract first");
      try {
        const res = await fetch("http://localhost:5000/generate_update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contract_id: contract.contract_id }),
        });
        const data = await res.json();
        if (res.ok && data.success) alert("✅ Contract marked as generated");
        else alert(`❌ ${data.message || "Failed to update"}`);
      } catch (err) {
        console.error(err);
        alert("Error updating generate_update");
      }
    }}
    style={{
      ...styles.button,
      backgroundColor: "#492bc0ff",
      textDecoration: "none",
      display: "inline-block",
    }}
  >
    Generate Contract
  </button>

<button
  type="button"
  onClick={() => setViewMode(true)}
  style={styles.updateButton}
>
  View
</button>
  <a
    href="/index"
    style={{
      ...styles.button,
      backgroundColor: "#492bc0ff",
      textDecoration: "none",
      display: "inline-block",
    }}
  >
    ← Go Back Home
  </a>

  <button type="submit" style={styles.updateButton}>
    Modify Contract
  </button>
</div>
{viewMode && contract && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}
  >
    <div
      style={{
        width: "80%",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "white",
        padding: 20,
        borderRadius: 10,
        boxShadow: "0 0 15px rgba(0,0,0,0.3)"
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 20, color: "#2f3640", fontSize: 24 }}>
        📄 Contract Details Summary
      </h3>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20
        }}
      >
        {fields.map((key) => (
          <div
            key={key}
            style={{
              padding: 15,
              borderRadius: 10,
              background: "white",
              boxShadow: "0 0 8px rgba(0,0,0,0.1)"
            }}
          >
            <div style={{ fontSize: 14, color: "#718093", marginBottom: 5 }}>{labelize(key)}</div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#2f3640" }}>
              {contract[key] || "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 30 }}>
        {/* Send Email / SMS */}
        <button
          type="button"
          onClick={async () => {
            if (!contract) return alert("Search a contract first");

            try {
              const res = await fetch("http://localhost:5000/send_contract_email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contract_id: contract.contract_id })
              });

              const data = await res.json();

              // Update state to show results
              setMessageStatus({
                email: data.email_result || "No email attempted",
                sms: data.sms_result ? JSON.stringify(data.sms_result, null, 2) : "No SMS attempted"
              });

            } catch (err) {
              console.error(err);
              setMessageStatus({
                email: "Error sending email",
                sms: "Error sending SMS"
              });
            }
          }}
          style={{
            padding: "10px 20px",
            background: "#009432",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            width: 200,
            fontSize: 16
          }}
        >
          Send Email / SMS
        </button>

        {/* Close Modal */}
        <button
          type="button"
          onClick={() => setViewMode(false)}
          style={{
            padding: "10px 20px",
            background: "#e84118",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            width: 150,
            fontSize: 16
          }}
        >
          Close
        </button>
      </div>

      {/* Message Status */}
      <div style={{ marginTop: 30, background: "#f5f6fa", padding: 15, borderRadius: 8 }}>
        <h4>📩 Message Status</h4>
        <p><strong>Email:</strong> {messageStatus.email || "Not sent"}</p>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          <strong>SMS:</strong> {messageStatus.sms || "Not sent"}
        </pre>
      </div>
    </div>
  </div>
)}
        </form>
      )}
    </div>
  );
};

const styles = {
  button: { width: 200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16 },
  updateButton: { width: 200, padding: "10px 20px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16 },
};

export default ModifyContract;
