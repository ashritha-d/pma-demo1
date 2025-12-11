import React, { useState } from "react";

const ModifyTenant = ({ sessionUser }) => {
  const [tenancyId, setTenancyId] = useState("");
  const [tenant, setTenant] = useState(null);
  const [formData, setFormData] = useState({});
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);

  const photoFields = [
    "PassportCopyPath",
    "EIDCopyPath",
    "ResidenceVisaCopyPath",
    "BankStatementCopyPath",
    "DepositChequeCopyPath",
    "SecurityChequeCopyPath",
    "EjariMunicipalRegistrationCopyPath",
  ];
  const dateFields = [
          "TenantDOB",
          "TenantPassportExpiryDate",
          "TenantEIDExpiryDate",
          "LeaseStartDate",
          "LeaseEndDate",
          "MoveInDate",
          "MoveOutDate",
          "CreationDate",
        ];


  // ------------------- Helpers -------------------
  const formatDate = (dateStr) => (dateStr ? dateStr.slice(0, 10) : "");

  const labelize = (s) =>
    s
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
      .trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, [key]: file }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPreviews((prev) => ({ ...prev, [key]: ev.target.result }));
      reader.readAsDataURL(file);
    } else setPreviews((prev) => ({ ...prev, [key]: null }));
  };

  // ------------------- Search Tenant -------------------
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!tenancyId) return alert("Please enter a tenancy ID");

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_tenant/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tenancyContractNumber: tenancyId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTenant(data.tenant);

        // Initialize formData
        const initial = {};
        Object.keys(data.tenant).forEach((k) => {
          if (photoFields.includes(k)) return;
          if (dateFields.includes(k) && data.tenant[k]) {
            initial[k] = formatDate(data.tenant[k]);
          } else {
            initial[k] = data.tenant[k] ?? "";
          }
        });
        setFormData(initial);

        // Set image previews
        const p = {};
        photoFields.forEach((f) => {
          if (data.tenant[f]) {
            const img = data.tenant[f];
            p[f] = img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
          } else p[f] = null;
        });
        setPreviews(p);
      } else {
        alert(data.message || "Tenant not found");
        setTenant(null);
        setFormData({});
        setPreviews({});
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching tenant");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Update Tenant -------------------
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!tenant) return alert("Please search a tenant first");

    const data = new FormData();
    data.append("tenancy_contract_number", tenant.TenancyContractNumber || tenancyId);

    // Append all formData fields
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val instanceof File) data.append(key, val, val.name);
      else if (val != null) data.append(key, val);
    });

    // Defaults
    if (!formData.CreatedBy) data.append("CreatedBy", sessionUser || "admin");
    if (!formData.CreationDate)
      data.append("CreationDate", new Date().toISOString().slice(0, 10));

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_tenant/update", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert(`✅ ${result.message}`);
        await handleSearch(null); // Refresh data
      } else alert(`❌ ${result.message || "Failed to update tenant"}`);
    } catch (err) {
      console.error(err);
      alert("❌ Error updating tenant");
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    ["TenantName","TenantDOB","TenantNationality","TenantPassportNumber"],
    ["TenantEmiratesID","TenantPassportExpiryDate","TenantEIDExpiryDate","TenantEmployer","TenantMobileNumber"],
    ["TenantEmailID","LeaseStartDate","LeaseEndDate","MoveInDate","MoveOutDate"],
    ["RentAmount","DepositAmountReceived","NumberOfPayments","RentAmountReceived","RentAmountOutstanding"],
    ["CreatedBy","CreationDate"]
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f5f6fa" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Modify Tenant
      </h2>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label style={{ fontWeight: "bold", marginRight: 8 }}>Enter Tenant ID:</label>
        <input
          type="text"
          value={tenancyId}
          onChange={(e) => setTenancyId(e.target.value)}
          placeholder="Ex: 1"
          required
          style={{ width: 150, padding: 6, borderRadius: 5, border: "1px solid #aaa" }}
        />
        <button
          type="submit"
          style={{ marginLeft: 8, padding: "6px 12px", background: "#273c75", color: "white", border: "none", borderRadius: 5, cursor: "pointer", width: 200 }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {tenant && (
        <form
          onSubmit={handleUpdate}
          encType="multipart/form-data"
          style={{ maxWidth: 1500, margin: "0 auto", background: "white", padding: 20, borderRadius: 10, boxShadow: "0 0 10px #ccc" }}
        >
          {/* Fields */}
          {rows.map((cols, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 15, marginBottom: 15 }}>
              {cols.map((field) => (
                <div key={field}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                  <input
                    type={dateFields.includes(field) ? "date" : "text"}
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    style={{ width: "100%", padding: 7, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
              ))}
            </div>
          ))}

          {/* Photos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, marginTop: 20, textAlign: "center" }}>
            {photoFields.map((field) => (
              <div key={field}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                {previews[field] ? (
                  <img
                    src={previews[field]}
                    alt={field}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, border: "1px solid #ccc", marginBottom: 6 }}
                  />
                ) : (
                  <p style={{ margin: "6px 0" }}>N/A</p>
                )}
                <input type="file" onChange={(e) => handleFileChange(e, field)} />
              </div>
            ))}
          </div>

          {/* Update Button */}
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: 20, textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.updateButton}>Modify Tenant</button>
          </div>
        </form>
      )}
    </div>
  );
};

const styles = {
  button: { width: 200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16 },
  updateButton: { width: 200, padding: "10px 20px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16 },
};

export default ModifyTenant;
