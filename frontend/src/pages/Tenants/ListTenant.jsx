// TenantList.jsx
import React, { useEffect, useState } from "react";

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Sorting
const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });


  // Preview modal
  const [previewSrc, setPreviewSrc] = useState(null);

  // Edit modal
  const [editingTenant, setEditingTenant] = useState(null); // full tenant object
  const [editForm, setEditForm] = useState({}); // keys are backend form keys (tenant_name, etc.)
  const [editFiles, setEditFiles] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Exact MySQL column order
  const columnOrder = [
    "TenancyContractNumber",
    "TenantName",
    "TenantDOB",
    "TenantNationality",
    "TenantPassportNumber",
    "TenantEmiratesID",
    "TenantPassportExpiryDate",
    "TenantEIDExpiryDate",
    "TenantEmployer",
    "TenantMobileNumber",
    "TenantEmailID",
    "LeaseStartDate",
    "LeaseEndDate",
    "MoveInDate",
    "MoveOutDate",
    "RentAmount",
    "DepositAmountReceived",
    "NumberOfPayments",
    "RentAmountReceived",
    "RentAmountOutstanding",
    "PassportCopyPath",
    "EIDCopyPath",
    "ResidenceVisaCopyPath",
    "BankStatementCopyPath",
    "DepositChequeCopyPath",
    "SecurityChequeCopyPath",
    "EjariMunicipalRegistrationCopyPath",
    "CreatedBy",
    "CreationDate",
  ];

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

  // Map DB columns -> backend form keys used by /modify_tenant/update
  const dbToFormMap = {
    TenantName: "tenant_name",
    TenantDOB: "tenant_dob",
    TenantNationality: "tenant_nationality",
    TenantPassportNumber: "tenant_passport",
    TenantEmiratesID: "tenant_eid",
    TenantPassportExpiryDate: "passport_expiry",
    TenantEIDExpiryDate: "eid_expiry",
    TenantEmployer: "tenant_employer",
    TenantMobileNumber: "tenant_mobile",
    TenantEmailID: "tenant_email",
    LeaseStartDate: "lease_start",
    LeaseEndDate: "lease_end",
    MoveInDate: "move_in",
    MoveOutDate: "move_out",
    RentAmount: "rent_amount",
    DepositAmountReceived: "deposit_amount",
    NumberOfPayments: "number_of_payments",
    CreatedBy: "created_by",
    CreationDate: "creation_date",
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/tenant_list", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTenants(data.tenants || []);
      } else {
        alert(data.message || "Failed to fetch tenants");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching tenants");
    } finally {
      setLoading(false);
    }
  }

  // Filter by name or tenancy contract number
  const filtered = tenants.filter((t) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.TenantName || "").toString().toLowerCase().includes(q) ||
      (t.TenancyContractNumber || "").toString().toLowerCase().includes(q)
    );
  });

  // Navigate to edit/delete pages (if you still want navigation options)
  const navigateToModify = (contract) => {
    window.location.href = `/modify_tenant?contract=${encodeURIComponent(contract)}`;
  };
  const navigateToDelete = (contract) => {
    window.location.href = `/delete_tenant?contract=${encodeURIComponent(contract)}`;
  };

  // Delete via API with confirmation
  const handleDeleteApi = async (contract) => {
    if (!window.confirm(`Confirm deletion of tenant ${contract}?`)) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_tenant/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tenancyContractNumber: contract }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ ${data.message}`);
        // remove locally
        setTenants((prev) => prev.filter((p) => p.TenancyContractNumber !== contract));
      } else {
        alert(`❌ ${data.message || "Failed to delete tenant"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting tenant");
    } finally {
      setLoading(false);
    }
  };
const sortedTenants = React.useMemo(() => {
  let sortable = [...filtered];
  if (sortConfig.key) {
    sortable.sort((a, b) => {
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";

      // Try numeric compare first
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      // Fallback to string compare
      return sortConfig.direction === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  }
  return sortable;
}, [filtered, sortConfig]);

const handleSort = (key) => {
  setSortConfig((prev) => {
    if (prev.key === key) {
      // toggle direction
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    }
    return { key, direction: "asc" };
  });
};

  // Open edit modal and populate editForm with mapped fields
// Opens edit modal for the selected tenant
const openEditModal = (tenant) => {
  console.log("openEditModal called for:", tenant?.TenancyContractNumber || tenant);

  if (!tenant) {
    console.warn("openEditModal: tenant undefined");
    return;
  }

  const form = {};
  for (const [dbCol, formKey] of Object.entries(dbToFormMap)) {
    const val = tenant[dbCol];
    form[formKey] = val
      ? typeof val === "string" && val.length >= 10
        ? val.slice(0, 10)
        : val
      : "";
  }

  form.tenancy_contract_number = tenant.TenancyContractNumber;

  setEditForm(form);
  setEditingTenant(tenant);
  setEditFiles({});
  console.log("Modal state set — editingTenant:", tenant.TenancyContractNumber);
};

// Closes edit modal
const closeEditModal = () => {
  console.log("Closing modal...");
  setEditingTenant(null);
  setEditForm({});
  setEditFiles({});
};

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const onEditFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditFiles((p) => ({ ...p, [key]: file }));
  };

  // Submit update via FormData to /modify_tenant/update
  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      setEditLoading(true);
      const data = new FormData();
      data.append("tenancy_contract_number", editForm.tenancy_contract_number);

      // append mapped fields
      Object.entries(editForm).forEach(([k, v]) => {
        if (k === "tenancy_contract_number") return;
        // append only if not undefined
        if (v !== undefined) data.append(k, v === null ? "" : v);
      });

      // append files (photoFields backend keys are as in DB)
      photoFields.forEach((field) => {
        const file = editFiles[field];
        if (file) data.append(field, file, file.name);
      });

      // ensure created_by/creation_date exist
      if (!editForm.created_by) data.append("created_by", "admin");
      if (!editForm.creation_date) data.append("creation_date", new Date().toISOString().slice(0, 10));

      const res = await fetch("http://localhost:5000/modify_tenant/update", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert(`✅ ${result.message}`);
        // refresh list and close
        await fetchTenants();
        closeEditModal();
      } else {
        alert(`❌ ${result.message || "Failed to update tenant"}`);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error updating tenant");
    } finally {
      setEditLoading(false);
    }
  };

  // Helper to render thumbnail cell for a document field
  const renderThumb = (t, key) => {
    const val = t[key];
    if (!val) return <div style={{ fontSize: 12, color: "#666" }}>—</div>;
    // val expected base64 without data: prefix
    const src = val.startsWith("data:") ? val : `data:image/jpeg;base64,${val}`;
    return (
      <img
        src={src}
        alt={key}
        style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4, border: "1px solid #ccc", cursor: "pointer" }}
        onClick={() => setPreviewSrc(src)}
      />
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>Tenant List</h2>

      <div style={{ maxWidth: 1500, margin: "20px auto", background: "white", padding: 16, borderRadius: 8, boxShadow: "0 0 12px rgba(0,0,0,0.12)", overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: "bold" }}>{new Date().toLocaleDateString()} | Total Tenants: {tenants.length}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Search by name or Tenant number "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", width: 350 }}
            />
            {/* <button onClick={() => fetchTenants()} style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>Refresh</button> */}
        
          </div>
                        <div style={{ fontWeight: "bold" }}>
            <a href="/index" style={{ backgroundColor: "gray",textDecoration: "none", color: "#333", fontWeight: "bold",padding: "8px 12px", borderRadius: 6, cursor: "pointer",width:300 }}>← Go Back Home</a>
          </div>

        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
  <tr>
    {columnOrder.map((col) => {
      const isSorted = sortConfig.key === col;
      const arrow = isSorted ? (sortConfig.direction === "asc" ? "▲" : "▼") : "";
      return (
        <th
          key={col}
          onClick={() => handleSort(col)}
          style={{
            padding: 8,
            border: "1px solid #ddd",
            background: "#273c75",
            color: "#fff",
            fontSize: 12,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {col} {arrow}
        </th>
      );
    })}
    <th style={{ padding: 8, border: "1px solid #ddd", background: "#273c75", color: "#fff", fontSize: 12 }}>
      Actions
    </th>
  </tr>
</thead>


            <tbody>
              {sortedTenants.map((t, idx) => (
                <tr key={t.TenancyContractNumber || idx} style={{ background: idx % 2 === 0 ? "#fafafa" : "#fff" }}>
                  {columnOrder.map((key) => (
                    <td key={key} style={{ padding: 6, border: "1px solid #eee", textAlign: "center", fontSize: 13 }}>
                      {photoFields.includes(key) ? (
                        renderThumb(t, key)
                      ) : dateFields.includes(key) && t[key] ? (
                        (t[key] || "").slice(0, 10)
                      ) : (
                        t[key] ?? ""
                      )}
                    </td>
                  ))}

                  <td style={{ padding: 8, border: "1px solid #eee", display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => openEditModal(t)} style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>✏️ Edit</button>
                    <button onClick={() => handleDeleteApi(t.TenancyContractNumber)} style={{ padding: "6px 10px", borderRadius: 6, background: "#c0392b", color: "#fff", cursor: "pointer" }}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={columnOrder.length + 1} style={{ padding: 16, textAlign: "center" }}>No tenants found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Modal */}
      {previewSrc && (
        <div
          onClick={() => setPreviewSrc(null)}
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
          }}
        >
          <img src={previewSrc} alt="preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 6 }} />
        </div>
      )}

      {/* Edit Modal */}
      {editingTenant && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
        }}>
          <div style={{ width: 900, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Edit Tenant — {editingTenant.TenancyContractNumber}</h3>

            <form onSubmit={submitEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {/* Render editable fields from dbToFormMap */}
                {Object.entries(dbToFormMap).map(([dbCol, formKey]) => (
                  <div key={formKey}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>{dbCol.replace(/([A-Z])/g, " $1")}</label>
                    {["tenant_dob", "passport_expiry", "eid_expiry", "lease_start", "lease_end", "move_in", "move_out", "creation_date"].includes(formKey) ? (
                      <input type="date" name={formKey} value={editForm[formKey] || ""} onChange={onEditChange} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} />
                    ) : (
                      <input type="text" name={formKey} value={editForm[formKey] || ""} onChange={onEditChange} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} />
                    )}
                  </div>
                ))}
              </div>

              <hr style={{ margin: "16px 0" }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {photoFields.map((pf) => (
                  <div key={pf} style={{ textAlign: "center" }}>
                    <label style={{ display: "block", fontWeight: "bold", marginBottom: 6 }}>{pf}</label>
                    {editingTenant[pf] ? (
                      <img
                        src={editingTenant[pf].startsWith("data:") ? editingTenant[pf] : `data:image/jpeg;base64,${editingTenant[pf]}`}
                        alt={pf}
                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #ccc", display: "block", margin: "0 auto 8px" }}
                      />
                    ) : (
                      <div style={{ width: 80, height: 80, background: "#f3f3f3", borderRadius: 6, display: "inline-block", marginBottom: 8 }} />
                    )}
                    <input type="file" name={pf} onChange={(e) => onEditFileChange(e, pf)} />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" onClick={closeEditModal} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
                <button type="submit" disabled={editLoading} style={{ padding: "8px 12px", borderRadius: 6, background: "#2ecc71", color: "#fff" }}>
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

export default TenantList;
