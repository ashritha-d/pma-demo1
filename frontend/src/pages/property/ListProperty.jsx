import React, { useEffect, useState } from "react";

const ListProperty = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [previewSrc, setPreviewSrc] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

const columnOrder = [
  "property_code",
  "primary_owner_code",
  "owner_name",           // 🆕 Owner Name
  "contract_start_date",  // 🆕 Contract Start Date
  "contract_end_date",    // 🆕 Contract End Date
  "status",
  "developer_name",
  "building_name",
  "property_type",
  "name",
  "address1",
  "address2",
  "city",
  "state",
  "country",
  "zip_code",
  "municipality_number",
  "electricity_bill_number",
  "water_bill_number",
  "ownership_type",
  "furnishing_status",
  "land_area",
  "carpet_area",
  "builtup_area",
  "bedrooms",
  "bathrooms",
  "washrooms",
  "facing",
  "car_parkings",
  "servant_rooms",
  "balconies",
  "has_dishwasher",
  "has_washing_machine",
  "property_value",
  "year_of_construction",
  "second_owner_code",
  "expected_rent_value",
  "status",
  "mtd_income",
  "ytd_income",
  "mtd_expense",
  "ytd_expense",
  "purchase_value",
  "construction_cost",
  "renovation_cost",
  "registration",
  "transfer_fees",
  "misc_expense",
  "current_rent",       // 🆕 Must be visible
  "deposit_amount",    // 🆕 Must be visible
  "created_by",
  "creation_date",
  "property_photo"
];

  const photoFields = ["property_photo"];
  const dateFields = ["year_of_construction", "creation_date","contract_start_date", 
  "contract_end_date" ];

  const dbToFormMap = {
    propertyCode:"property_code",
    PrimaryOwnerCode: "primary_owner_code",
    DeveloperName: "developer_name",
    BuildingName: "building_name",
    PropertyType: "property_type",
    Address1: "address1",
    Address2: "address2",
    City: "city",
    State: "state",
    Country: "country",
    ZipCode: "zip_code",
    MunicipalityNumber: "municipality_number",
    ElectricityBillNumber: "electricity_bill_number",
    WaterBillNumber: "water_bill_number",
    OwnershipType: "ownership_type",
    FurnishingStatus: "furnishing_status",
    LandArea: "land_area",
    CarpetArea: "carpet_area",
    BuiltupArea: "builtup_area",
    Bedrooms: "bedrooms",
    Bathrooms: "bathrooms",
    Washrooms: "washrooms",
    Facing: "facing",
    CarParkings: "car_parkings",
    ServantRooms: "servant_rooms",
    Balconies: "balconies",
    HasDishwasher: "has_dishwasher",
    HasWashingMachine: "has_washing_machine",
    PropertyValue: "property_value",
    YearOfConstruction: "year_of_construction",
    ExpectedRentValue: "expected_rent_value",
    Status: "status",
    PurchaseValue: "purchase_value",
    CreatedBy: "created_by",
    CreationDate: "creation_date",

  };

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/list_property", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) setProperties(data.properties || []);
      else alert(data.message || "Error fetching properties");
    } catch (err) {
      console.error(err);
      alert("Error fetching properties");
    } finally {
      setLoading(false);
    }
  }

  const filtered = properties.filter(p => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.property_code || "").toString().toLowerCase().includes(q) ||
      (p.developer_name || "").toString().toLowerCase().includes(q)
    );
  });

  // --- Sorting Logic ---
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const sorted = React.useMemo(() => {
    if (!sortConfig.key) return filtered;
    const sortedData = [...filtered].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (!isNaN(valA) && !isNaN(valB))
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      if (dateFields.includes(sortConfig.key))
        return sortConfig.direction === "asc"
          ? new Date(valA) - new Date(valB)
          : new Date(valB) - new Date(valA);
      return sortConfig.direction === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
    return sortedData;
  }, [filtered, sortConfig]);

  const openEditModal = (property) => {
    setEditingProperty(property);
    setEditForm({ ...property });
  };

  const closeEditModal = () => {
    setEditingProperty(null);
    setEditForm({});
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const onEditFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submitEditProperty = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;
    try {
      setEditLoading(true);
      const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      // Skip empty values
      if (value !== null && value !== undefined && value !== "") {
        formData.append(key, value);
      }
    });
      const res = await fetch("http://localhost:5000/property_update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert(result.message);
        fetchProperties();
        closeEditModal();
      } else alert(result.message || "Failed to update property");
    } catch (err) {
      console.error(err);
      alert("Error updating property");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete property ${code}?`)) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/property_delete_api/${code}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setProperties(prev => prev.filter(p => p.property_code !== code));
      } else alert(data.message || "Failed to delete property");
    } catch (err) {
      console.error(err);
      alert("Error deleting property");
    } finally {
      setLoading(false);
    }
  };

  const renderThumb = (p, key) => {
    if (!p[key]) return <div style={{ fontSize: 12, color: "#666" }}>—</div>;
    const src = p[key].startsWith("data:") ? p[key] : `data:image/jpeg;base64,${p[key]}`;
    return (
      <img
        src={src}
        alt={key}
        style={{
          width: 48,
          height: 48,
          objectFit: "cover",
          borderRadius: 4,
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
        onClick={() => setPreviewSrc(src)}
      />
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Property List
      </h2>

      <div style={{ maxWidth: 1600, margin: "20px auto", background: "#fff", padding: 16, borderRadius: 8, overflowX: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div>{new Date().toLocaleDateString()} | Total Properties: {properties.length}</div>
          <input
            placeholder="Search by code or name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 300 }}
          />
          <a
            href="/index"
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
          </a>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {columnOrder.map(col => (
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
                    {col}
                    {sortConfig.key === col && (
                      <span style={{ marginLeft: 6 }}>
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}
                <th style={{ padding: 6, border: "1px solid #ddd", background: "#273c75", color: "#fff" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, idx) => (
                <tr key={p.property_code || idx} style={{ background: idx % 2 === 0 ? "#fafafa" : "#fff" }}>
                  {columnOrder.map(key => (
                    <td key={key} style={{ padding: 6, border: "1px solid #eee", textAlign: "center" }}>
                      {photoFields.includes(key)
                        ? renderThumb(p, key)
                        : dateFields.includes(key) && p[key]
                        ? p[key].slice(0, 10)
                        : p[key] ?? ""}
                    </td>
                  ))}
                  <td style={{ display: "flex", gap: 6, justifyContent: "center", padding: 6 }}>
                    <button onClick={() => openEditModal(p)} style={{ padding: "6px 10px", borderRadius: 6 }}>
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.property_code)}
                      style={{ padding: "6px 10px", borderRadius: 6, background: "#c0392b", color: "#fff" }}
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

      {/* Preview Image Modal */}
      {previewSrc && (
        <div
          onClick={() => setPreviewSrc(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <img src={previewSrc} alt="preview" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 6 }} />
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 900,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Edit Property — {editingProperty.property_code}
            </h3>

            <form onSubmit={submitEditProperty}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
              ><div style={{ gridColumn: "1 / -1" }}>
      <label
        style={{
          display: "block",
          fontWeight: "bold",
          marginBottom: 6,
        }}
      >
        Property Code
      </label>
      <input
        type="text"
        name="property_code"
        value={editForm.property_code || ""}
        readOnly
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
          backgroundColor: "#f0f0f0",
          color: "#555",
        }}
      />
    </div>
                {Object.entries(dbToFormMap).map(([dbCol, formKey]) => (
                  <div key={formKey}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        marginBottom: 6,
                      }}
                    >
                      {dbCol.replace(/([A-Z])/g, " $1")}
                    </label>

                    {["creation_date", "handover_date", "year_of_construction"].includes(formKey) ? (
                      <input
                        type="date"
                        name={formKey}
                        value={editForm[formKey] || ""}
                        onChange={onEditChange}
                        style={{
                          width: "100%",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        name={formKey}
                        value={editForm[formKey] || ""}
                        onChange={onEditChange}
                        style={{
                          width: "100%",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <hr style={{ margin: "16px 0" }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 12,
                }}
              >
                {photoFields.map((pf) => (
                  <div key={pf} style={{ textAlign: "center" }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        marginBottom: 6,
                      }}
                    >
                      {pf}
                    </label>

                    {editingProperty[pf] ? (
                      <img
                        src={
                          editingProperty[pf].startsWith("data:")
                            ? editingProperty[pf]
                            : `data:image/jpeg;base64,${editingProperty[pf]}`
                        }
                        alt={pf}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                          display: "block",
                          margin: "0 auto 8px",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: "#f3f3f3",
                          borderRadius: 6,
                          display: "inline-block",
                          marginBottom: 8,
                        }}
                      />
                    )}

                    <input
                      type="file"
                      name={pf}
                      onChange={(e) => onEditFileChange(e, pf)}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "#bdc3c7",
                    border: "none",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "#2ecc71",
                    color: "#fff",
                    border: "none",
                  }}
                >
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

export default ListProperty;
