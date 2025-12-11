import React, { useState } from "react";

const AddServTrans = ({ sessionUser }) => {
  const [propertyCode, setPropertyCode] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [property, setProperty] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [formData, setFormData] = useState({});

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

      setProperty(propertyData.property);
      setTenant(tenantData.tenant);

      setFormData({
        property_code: propertyData.property.property_code || "",
        tenancy_contract_number: tenantData.tenant.TenancyContractNumber || "",
        created_by: sessionUser || "admin",
        creation_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error fetching property or tenant data!");
    }
  };

  // ------------------- Handle Change -------------------
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ------------------- Submit Form -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!property) return alert("Please search and select a Property first");

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    try {
      const res = await fetch("http://localhost:5000/add_servtrans", {
        method: "POST",
        credentials: "include",
        body: data,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert(`✅ ${result.message}`);
        setProperty(null);
        setTenant(null);
        setFormData({});
        setPropertyCode("");
        setTenantCode("");
      } else {
        alert(`❌ ${result.message || "Failed to add service transaction"}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("❌ Error submitting service transaction");
    }
  };

const serviceTypes = [
  "Plumbing",
  "Painting",
  "Cleaning",
  "Damages",
  "Electrical",
  "Others"
];

const statuses = [
  "Open",
  "In Progress",
  "Closed"
];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0" }}>
        Add Service Transaction
      </h2>

      {/* Search Section */}
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
          style={{ margin: "0 10px", padding: "5px", width: 120 }}
        />

        <button type="submit" style={{ padding: "5px 10px", cursor: "pointer", width: 100 }}>
          Search
        </button>
      </form>

      {property && tenant && (
        <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "20px" }}>
          🏢 {property.building_name || property.name} | 👤 {tenant.TenantName}
        </p>
      )}

      {property && (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <div>
              <label>PROPERTY CODE</label>
              <input name="property_code" value={formData.property_code || ""} readOnly />
            </div>

            <div>
              <label>TENANCY ID</label>
              <input name="tenancy_contract_number" value={formData.tenancy_contract_number || ""} readOnly />
            </div>

            <div>
              <label>SERVICE TYPE</label>
              <select name="service_request_type" value={formData.service_request_type || ""} onChange={handleChange}>
                <option value="">Select</option>
                {serviceTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label>DESCRIPTION</label>
              <input name="service_request_description" value={formData.service_request_description || ""} onChange={handleChange} />
            </div>

            <div>
              <label>LOGIN DATE</label>
              <input type="date" name="service_request_login_date" value={formData.service_request_login_date || ""} onChange={handleChange} />
            </div>

            <div>
              <label>ATTENDED BY</label>
              <input name="service_request_attended_by" value={formData.service_request_attended_by || ""} onChange={handleChange} />
            </div>

            <div>
              <label>START DATE</label>
              <input type="date" name="service_request_start_date" value={formData.service_request_start_date || ""} onChange={handleChange} />
            </div>

            <div>
              <label>ESTIMATED COST</label>
              <input type="number" step="0.01" name="service_request_estimated_cost" value={formData.service_request_estimated_cost || ""} onChange={handleChange} />
            </div>

            <div>
              <label>ACTUAL COST</label>
              <input type="number" step="0.01" name="service_request_actual_cost" value={formData.service_request_actual_cost || ""} onChange={handleChange} />
            </div>

            <div>
              <label>END DATE</label>
              <input type="date" name="service_request_end_date" value={formData.service_request_end_date || ""} onChange={handleChange} />
            </div>

            <div>
              <label>STATUS</label>
              <select name="status_of_service_request" value={formData.status_of_service_request || ""} onChange={handleChange}>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label>CREATED BY</label>
              <input name="created_by" value={formData.created_by || ""} readOnly />
            </div>

            <div>
              <label>CREATION DATE</label>
              <input type="date" name="creation_date" value={formData.creation_date || ""} readOnly />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{
              width: 200,
              padding: "10px 20px",
              backgroundColor: "#492bc0ff",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              marginRight: "20px",
              display: "inline-block",
            }}>
              ← Go Back Home
            </a>
            <button type="submit" style={{
              width: 200,
              padding: "10px 20px",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}>
              Add Service
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddServTrans;
