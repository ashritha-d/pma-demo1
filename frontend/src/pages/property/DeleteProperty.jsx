import React, { useState } from "react";

const DeleteProperty = () => {
  const [searchCode, setSearchCode] = useState("");
  const [property, setProperty] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState("");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  // -------- Search Property --------
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode) return;

    const formData = new FormData();
    formData.append("property_code", searchCode);
    formData.append("search", "true");

    try {
      const res = await fetch("http://localhost:5000/delete_property", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.property) {
        setProperty(data.property);
        setMessage("Property found");

        if (data.property.property_photo) {
          setPhotoPreview(`data:image/jpeg;base64,${data.property.property_photo}`);
        } else {
          setPhotoPreview(null);
        }
      } else {
        setProperty(null);
        setPhotoPreview(null);
        setMessage(data.message || "No property found");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error fetching property");
      setProperty(null);
      setPhotoPreview(null);
    }
  };

  // -------- Delete Property --------
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!property) return;

    if (!window.confirm(`Are you sure you want to delete property ${property.property_code}?`)) return;

    const formData = new FormData();
    formData.append("property_code", property.property_code);
    formData.append("delete", "true");

    try {
      const res = await fetch("http://localhost:5000/delete_property", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setMessage(`Property ${property.property_code} deleted successfully`);
        setProperty(null);
        setSearchCode("");
        setPhotoPreview(null);
      } else {
        setMessage(data.message || "Failed to delete property");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error deleting property");
    }
  };

  // -------- Render Property Fields --------
  const renderFields = () => {
    if (!property) return null;

    const fields = [
      "primary_owner_code","developer_name","building_name","property_type",
      "name","address1","address2","city","state","country","zip_code","municipality_number",
      "electricity_bill_number","water_bill_number","ownership_type","furnishing_status",
      "land_area","carpet_area","builtup_area","bedrooms","bathrooms","washrooms","facing",
      "car_parkings","servant_rooms","balconies","has_dishwasher","has_washing_machine",
      "property_value","year_of_construction","expected_rent_value","status","created_by",
      "creation_date","second_owner_code","mtd_income","ytd_income","mtd_expense","ytd_expense",
      "purchase_value","construction_cost","renovation_cost","registration","transfer_fees","misc_expense"
    ];

    return fields.map((field, idx) => {
      let value = property[field];
      if (value === null || value === undefined) value = "";
      if (field.includes("date") && value) value = formatDate(value);

      return (
        <div key={idx} style={{ display: "flex", flexDirection: "column", minWidth: "180px", marginBottom: "15px" }}>
          <label style={{ fontWeight: "bold", marginBottom: "3px" }}>{field.replace(/_/g," ").toUpperCase()}</label>
          <input
            type={field.includes("date") ? "date" : "text"}
            value={value}
            readOnly
            style={{
              padding: "6px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              background: "#f0f0f0",
              width: "100%"
            }}
          />
        </div>
      );
    });
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", background: "#f5f6fa" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0" }}>Delete Property</h2>

      {/* Search */}
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <form onSubmit={handleSearch}>
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>Enter Property Code:</label>
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            style={{ width: "120px", padding: "6px", borderRadius: "5px", border: "1px solid #aaa" }}
          />
          <button
            type="submit"
            style={{ width:100, padding: "6px 12px", background: "#c0392b", color: "white", border: "none", borderRadius: "5px", marginLeft: "10px", cursor: "pointer" }}
          >
            Search
          </button>
        </form>
        {message && <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>}
      </div>

      {/* Property Details */}
      {property && (
        <form onSubmit={handleDelete} style={{
          background: "white",
          width: "100%",
          maxWidth: "1500px",
          margin: "0 auto",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 0 10px #ccc"
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
            {renderFields()}
          </div>

          {/* Photo */}
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <label style={{ fontWeight: "bold" }}>Property Photo:</label><br />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Property"
                style={{ maxWidth: "200px", marginTop: "10px", borderRadius: "10px", border: "1px solid #ccc" }}
              />
            ) : (
              <p>No photo available</p>
            )}
          </div>

          {/* Buttons */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a
              href="/index"
              style={{
                width:200,
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
              disabled={!property}
              style={{
                width:200,
                padding: "10px 20px",
                backgroundColor: property ? "#c0392b" : "#aaa",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: property ? "pointer" : "not-allowed",
                fontSize: "16px"
              }}
            >
              Delete Property
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DeleteProperty;
