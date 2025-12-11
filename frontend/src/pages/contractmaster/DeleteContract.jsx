import React, { useState } from "react";

const DeleteContract = () => {
  const [contractNumber, setContractNumber] = useState("");
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const parseDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d)) return "";
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  // Field groups in desired order
  const fieldGroups = [
    ["property_code", "tenant_id", "tenant_name", "contract_start_date", "contract_end_date"],
    ["contract_termination_date", "move_in_date", "move_out_date", "first_time_move_in_date", "contract_renewal_date"],
    ["rent_amount", "deposit_amount", "notice_period", "rent_amount_description", "rent_payment_mode"],
    ["rent_payment_type", "deposit_payment_type", "new_or_old_tenant", "contract_period"]
  ];

  // -------- Search Contract --------
const handleSearch = async (e) => {
  e.preventDefault();
  if (!contractNumber) return;

  
  setLoading(true);
  try {
    // Fetch contract
    const res = await fetch(`http://localhost:5000/contract/${contractNumber}`);
    const data = await res.json();

    if (res.ok && data.success && data.contract) {
      let contractData = data.contract;

      // Fetch property to get property_code
      if (contractData.property_id) {
        try {
          const resProp = await fetch(`http://localhost:5000/property/${contractData.property_id}`);
          const propData = await resProp.json();
          if (propData.success && propData.property) {
            contractData.property_code = propData.property.property_code;
          } else {
            contractData.property_code = contractData.property_id; // fallback
          }
        } catch (err) {
          console.error("Error fetching property for property_code:", err);
          contractData.property_code = contractData.property_id;
        }
      } else {
        contractData.property_code = ""; // fallback if no property_id
      }

      setContract(contractData);
      setMessage("Contract found");
    } else {
      setContract(null);
      setMessage(data.message || "Contract not found");
    }
  } catch (err) {
    console.error(err);
    setContract(null);
    setMessage("Error fetching contract");
  } finally {
    setLoading(false);
  }
};

  // -------- Delete Contract --------
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!contract) return;

    if (!window.confirm(`Are you sure you want to delete contract ${contract.contract_id}?`)) return;

    const formData = new FormData();
    formData.append("contract_id", contract.contract_id);
    formData.append("delete", "true");

    try {
      const res = await fetch("http://localhost:5000/delete_contract", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`Contract ${contract.contract_id} deleted successfully`);
        setContract(null);
        setContractNumber("");
      } else {
        setMessage(data.message || "Failed to delete contract");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error deleting contract");
    }
  };

  // -------- Render Fields --------
  const renderFields = () => {
    if (!contract) return null;

    return fieldGroups.map((group, i) => (
      <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${group.length}, 1fr)`, gap: 15, marginBottom: 15 }}>
        {group.map((field) => {
          let value = contract[field] ?? "";
          const isDate = field.includes("date");
          return (
            <div key={field}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>
                {field.replace(/_/g, " ").toUpperCase()}
              </label>
              <input
                type={isDate ? "date" : "text"}
                value={isDate ? parseDate(value) : value}
                readOnly
                style={{
                  width: "100%",
                  padding: 7,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  backgroundColor: "#f0f0f0",
                  cursor: "not-allowed"
                }}
              />
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", background: "#f5f6fa" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0" }}>Delete Contract</h2>

      {/* Search */}
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <form onSubmit={handleSearch}>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Enter Contract ID:</label>
          <input
            type="text"
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            style={{ width: "120px", padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
          <button
            type="submit"
            style={{ width: 100, padding: "6px 12px", background: "#c0392b", color: "white", border: "none", borderRadius: "5px", marginLeft: "10px", cursor: "pointer" }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
      </div>

      {/* Contract Details */}
      {contract && (
        <form onSubmit={handleDelete} style={{
          background: "white",
          width: "100%",
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px #ccc"
        }}>
          {renderFields()}

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a
              href="/index"
              style={{
                width: 200,
                padding: "10px 20px",
                backgroundColor: "#492bc0ff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                marginRight: "20px",
                textDecoration: "none",
                display: "inline-block"
              }}
            >
              ← Go Back Home
            </a>
            <button
              type="submit"
              style={{
                width: 200,
                padding: "10px 20px",
                backgroundColor: "#c0392b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Delete Contract
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DeleteContract;
