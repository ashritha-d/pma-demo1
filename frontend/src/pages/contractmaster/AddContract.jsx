import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

const AddContract = ({ sessionUser }) => {
  const [propertyCode, setPropertyCode] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [property, setProperty] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [formData, setFormData] = useState({});
  // const navigate = useNavigate();

  // ------------------- Unified Search -------------------
  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      const [propertyRes, tenantRes] = await Promise.all([
        fetch(`http://localhost:5000/property/${propertyCode}`),
        fetch(`http://localhost:5000/tenant/${tenantCode}`),
      ]);

      const propertyData = await propertyRes.json();
      const tenantData = await tenantRes.json();

      if (!propertyData.success) return alert(propertyData.message || "Property not found");
      if (!tenantData.success) return alert(tenantData.message || "Tenant not found");

      if (propertyData.property.status?.toLowerCase() !== "vacant") {
        alert("❌ Property is currently occupied! Cannot create a new contract.");
        setProperty(null);
        setTenant(null);
        return;
      }

      setProperty(propertyData.property);
      setTenant(tenantData.tenant);

      setFormData({
        property_code: propertyData.property.property_code || "",
        tenant_id: tenantData.tenant.TenancyContractNumber || "",
        tenant_name: tenantData.tenant.TenantName || "",
        tenant_email: tenantData.tenant.TenantEmailID || "",
        created_by: sessionUser || "admin",
        creation_date: new Date().toISOString().split("T")[0],
        contract_start_date: new Date().toISOString().split("T")[0], // Auto-fill today
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error fetching property or tenant data!");
    }
  };

  // ------------------- Input Change -------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------- Submit Contract -------------------
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!property || !tenant) {
    alert("Please search and select both Property and Tenant first");
    return;
  }

  const rentDue = parseInt(formData.rent_due_day, 10);
  if (isNaN(rentDue) || rentDue < 1 || rentDue > 31) {
    alert("❌ Please enter a valid Rent Due Day between 1 and 31.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/add_contract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // ✅ Prepare data for FinTrans
      const contractData = {
        contract_id: result.contract_id,
        property_code: formData.PropertyCode,
        tenant_id: formData.TenantID,
        tenant_name: formData.TenantName,
        tenant_email: formData.TenantEmailID,
        rent_amount: formData.RentAmount,
        deposit_amount: formData.DepositAmount,
      };

      // ✅ Store locally
      localStorage.setItem("pending_contract", JSON.stringify(contractData));

      alert(`✅ Contract #${result.contract_id} created successfully! Redirecting to FinTrans...`);

      // ✅ Redirect
      window.location.href = `http://localhost:3000/fintrans/addfintrans/${result.contract_id}`;
    } else {
      alert("❌ Failed to create contract!");
    }
  } catch (err) {
    console.error("Error creating contract:", err);
    alert("⚠️ Error creating contract!");
  }
};
  // ------------------- Contract Fields -------------------
  const contractFields = [
    ["property_code", "tenant_id", "tenant_name", "contract_start_date", "contract_end_date"],
    [ "move_in_date", "notice_period", "rent_amount_description","rent_due_day", "new_or_old_tenant",],
    [ "rent_payment_type"],
  ];

  const paymentModes = ["cash", "cheque", "online", "card"];
  const rentTypes = ["monthly", "yearly", "halfyearly"];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0" }}>
        Add Contract
      </h2>

      {/* Unified Search Form */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label>Enter Property Code:</label>
        <input
          type="text"
          value={propertyCode}
          onChange={(e) => setPropertyCode(e.target.value)}
          placeholder="Ex: 101"
          required
          style={{ margin: "0 10px", padding: "5px", width: 100 }}
        />

        <label>Enter Tenant ID:</label>
        <input
          type="text"
          value={tenantCode}
          onChange={(e) => setTenantCode(e.target.value)}
          placeholder="Ex: 2001"
          required
          style={{ margin: "0 10px", padding: "5px", width: 120 }}
        />

        <button type="submit" style={{ padding: "5px 10px", cursor: "pointer", width: 100 }}>
          Search
        </button>
      </form>

      {property && tenant && (
        <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "20px" }}>
          <span>Developer Name: </span> {property.developer_name} |{" "}
          <span>Property Type: </span> {property.property_type || "-"}
          <br />
          <span>👤 Tenant:</span> {tenant.TenantName} |{" "}
          <span>Email:</span> {tenant.TenantEmailID || "-"}
        </p>
      )}

      {property && tenant && (
        <form onSubmit={handleSubmit}>
          {contractFields.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              {row.map((field) => {
                const value = formData[field] || "";
                const isDateField = field.includes("date") || field.includes("Date");

                // Read-only fields
                if (["property_code", "tenant_id", "tenant_name"].includes(field)) {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold" }}>
                        {field.replace(/_/g, " ").toUpperCase()}
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={value}
                        readOnly
                        style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                      />
                    </div>
                  );
                }

                // Dropdowns
                if (field === "rent_payment_mode" || field === "deposit_payment_type") {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold" }}>
                        {field.replace(/_/g, " ").toUpperCase()}
                      </label>
                      <select name={field} value={value} onChange={handleChange}>
                        <option value="">Select</option>
                        {paymentModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field === "rent_payment_type") {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold" }}>
                        {field.replace(/_/g, " ").toUpperCase()}
                      </label>
                      <select name={field} value={value} onChange={handleChange}>
                        <option value="">Select</option>
                        {rentTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // Radio for new/old tenant
                if (field === "new_or_old_tenant") {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold" }}>
                        {field.replace(/_/g, " ").toUpperCase()}
                      </label>
                      <div>
                        <label>
                          <input
                            type="radio"
                            name={field}
                            value="new"
                            checked={value === "new"}
                            onChange={handleChange}
                          />
                          New
                        </label>
                        <label style={{ marginLeft: "10px" }}>
                          <input
                            type="radio"
                            name={field}
                            value="old"
                            checked={value === "old"}
                            onChange={handleChange}
                          />
                          Old
                        </label>
                      </div>
                    </div>
                  );
                }

                // Rent Due Day (special field)
                if (field === "rent_due_day") {
                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold" }}>Rent Due Date (1–31)</label>
                      <input
                        type="number"
                        name={field}
                        value={value}
                        min="1"
                        max="31"
                        onChange={handleChange}
                        placeholder="Enter day of month"
                        required
                      />
                    </div>
                  );
                }

                // Default text/date input
                return (
                  <div key={field}>
                    <label style={{ fontWeight: "bold" }}>
                      {field.replace(/_/g, " ").toUpperCase()}
                    </label>
                    <input
                      type={isDateField ? "date" : "text"}
                      name={field}
                      value={value}
                      onChange={handleChange}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a
              href="/index"
              style={{
                width: 200,
                padding: "10px 20px",
                backgroundColor: "#492bc0ff",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
                marginRight: "20px",
                display: "inline-block",
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
                borderRadius:


                 "6px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
             Add FinTrans
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddContract;
