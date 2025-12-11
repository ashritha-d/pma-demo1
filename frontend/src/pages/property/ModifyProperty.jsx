import React, { useState } from "react";

const ModifyProperty = ({ sessionUser }) => {
  const [propertyCode, setPropertyCode] = useState("");
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ------------------- Helpers -------------------
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
    "primary_owner_code", "developer_name", "building_name", "property_type", "name",
    "address1", "address2", "city", "state", "country", "zip_code", "municipality_number",
    "electricity_bill_number", "water_bill_number", "ownership_type", "furnishing_status",
    "land_area", "carpet_area", "builtup_area", "bedrooms", "bathrooms", "washrooms",
    "facing", "car_parkings", "servant_rooms", "balconies", "has_dishwasher",
    "has_washing_machine", "property_value", "year_of_construction", "expected_rent_value",
    "status", "created_by", "creation_date"
  ];

  // ------------------- Search Property -------------------
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!propertyCode) return alert("Please enter a Property Code");

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_property", {
        method: "POST",
        credentials: "include",
        body: new URLSearchParams({ search_property_code: propertyCode }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.property) {
        setProperty(data.property);

        // Populate form fields
        const initial = {};
        Object.keys(data.property).forEach((k) => {
          if (k !== "property_photo") {
            initial[k] = ["creation_date","year_of_construction"].includes(k)
              ? parseDate(data.property[k])
              : data.property[k] ?? "";
          }
        });
        setFormData(initial);

        // Image preview
        setPhotoPreview(data.property.property_photo ? `data:image/jpeg;base64,${data.property.property_photo}` : null);
      } else {
        alert(data.message || "Property not found");
        setProperty(null);
        setFormData({});
        setPhotoPreview(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching property");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Input & File Change -------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, property_photo: file }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else setPhotoPreview(null);
  };

  // ------------------- Update Property -------------------
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!property) return alert("Search a property first");

    const data = new FormData();
    data.append("property_code", property.property_code || propertyCode);

    Object.entries(formData).forEach(([key, val]) => {
      if (val instanceof File) data.append(key, val, val.name);
      else if (val != null) data.append(key, val);
    });

    if (!formData.created_by) data.append("created_by", sessionUser || "admin");
    if (!formData.creation_date)
      data.append("creation_date", new Date().toISOString().slice(0, 10));

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/modify_property", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert(`✅ ${result.message}`);
        await handleSearch(); // Refresh updated details
      } else alert(`❌ ${result.message || "Failed to update property"}`);
    } catch (err) {
      console.error(err);
      alert("❌ Error updating property");
    } finally {
      setLoading(false);
    }
  };

  const getValue = (key) => formData[key] ?? property?.[key] ?? "";

  // ------------------- Render -------------------
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20 }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Modify Property
      </h2>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label style={{ fontWeight: "bold", marginRight: 8 }}>Enter Property Code:</label>
        <input
          type="text"
          value={propertyCode}
          onChange={(e) => setPropertyCode(e.target.value)}
          placeholder="Ex: P001"
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

      {/* Property Form */}
      {property && (
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
                const isDate = ["creation_date", "year_of_construction"].includes(field);
                return (
                  <div key={field}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>{labelize(field)}</label>
                    <input
                      type={isDate ? "date" : "text"}
                      name={field}
                      value={getValue(field)}
                      onChange={handleChange}
                      style={{ width: "100%", padding: 7, borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Photo */}
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <label style={{ fontWeight: "bold" }}>Property Photo:</label>
            <br />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Property"
                style={{ maxWidth: 100, borderRadius: 10, border: "1px solid #ccc", marginTop: 10 }}
              />
            ) : (
              <p>No photo available</p>
            )}
            <br />
            <input type="file" name="property_photo" onChange={handleFileChange} style={{ marginTop: 10, width: 200 }} />
          </div>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: 20, textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Modify Property</button>
          </div>
        </form>
      )}
    </div>
  );
};

const styles = {
  button: { width: 200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16 },
  deleteButton: { width: 200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 16 },
};

export default ModifyProperty;
