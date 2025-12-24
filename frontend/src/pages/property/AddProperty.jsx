import React, { useState } from "react";

const AddProperty = ({ sessionUser }) => {
  const [ownerCode, setOwnerCode] = useState("");
  const [owner, setOwner] = useState(null);
  const [formData, setFormData] = useState({});
  const [previews, setPreviews] = useState({ property_photo: null });

  // ------------------- Search Owner -------------------
  const handleSearchOwner = async (e) => {
    e.preventDefault();
    if (!ownerCode) return;

    try {
      const res = await fetch(`http://localhost:5000/owners/${ownerCode}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) setOwner(data.owner);
      else alert(data.message || "Owner not found");
    } catch (err) {
      console.error(err);
      alert("Error fetching owner");
    }
  };

  // ------------------- Input Change -------------------
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
    } else {
      setPreviews((prev) => ({ ...prev, [key]: null }));
    }
  };

  // ------------------- Submit Form -------------------
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!owner) return alert("Please search and select an owner first");

  // ✅ Declare FormData BEFORE using it
  const data = new FormData();
  data.append("owner_code", owner.owner_code);

  Object.keys(formData).forEach((key) => {
    data.append(key, formData[key]);
  });

  if (!formData.created_by) data.append("created_by", sessionUser || "admin");
  if (!formData.creation_date)
    data.append("creation_date", new Date().toISOString().split("T")[0]);

  try {
    const res = await fetch("http://localhost:5000/add_property", {
      method: "POST",
      credentials: "include",
      body: data,
    });

    const result = await res.json();
    if (res.ok && result.success) {
      alert(`✅ ${result.message}`);
    } else {
      alert(`❌ ${result.message || "Failed to add property"}`);
    }
  } catch (err) {
    console.error("FETCH FAILED:", err);
    alert("❌ Error submitting form");
  }
};
  // ------------------- All Fields -------------------
  const propertyFields = [
    ["developer_name","building_name","property_type","name","address1"],
    ["address2","city","state","country","zip_code"],
    ["municipality_number","electricity_bill_number","water_bill_number","ownership_type","furnishing_status"],
    ["land_area","carpet_area","builtup_area","bedrooms","bathrooms"],
    ["washrooms","facing","car_parkings","servant_rooms","balconies"],
    ["has_dishwasher","has_washing_machine","property_value","year_of_construction","second_owner_code"],
    ["expected_rent_value","status","mtd_income","ytd_income","mtd_expense"],
    ["ytd_expense","purchase_value","construction_cost","renovation_cost","registration"],
    ["transfer_fees","misc_expense","created_by","creation_date","property_photo"]
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: "15px 0" }}>
        Add Property
      </h2>

      {/* Owner Search */}
      <form onSubmit={handleSearchOwner} style={{ textAlign: "center", margin: "20px 0" }}>
        <label>Enter Owner Code:</label>
        <input
          type="text"
          value={ownerCode}
          onChange={(e) => setOwnerCode(e.target.value)}
          placeholder="Ex: O001"
          required
          style={{ margin: "0 10px", padding: "5px",width:100 }}
        />
        <button type="submit" style={{ padding: "5px 10px", cursor: "pointer",width:100}}>Search</button>
      </form>

      {owner && (
        <>
          <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "20px" }}>
            Owner: {owner.first_name} {owner.last_name} | Email: {owner.email} | Mobile: {owner.mobile_number}
          </p>

          <form onSubmit={handleSubmit} encType="multipart/form-data">
            {propertyFields.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "10px" }}>
                {row.map((field) => {
                  const isFile = field === "property_photo";
                  const value =
                    field === "created_by" ? (sessionUser || "admin") :
                    field === "creation_date" ? new Date().toISOString().split("T")[0] :
                    formData[field] || "";

                  return (
                    <div key={field}>
                      <label style={{ fontWeight: "bold" }}>{field.replace(/_/g, " ").toUpperCase()}</label>
                      {isFile ? (
                        <>
                          <input type="file" name={field} onChange={(e) => handleFileChange(e, field)} />
                          {previews[field] && (
                            <img
                              src={previews[field]}
                              alt={field}
                              style={{ maxWidth: "200px", borderRadius: "10px", marginTop: "10px", border: "1px solid #ccc" }}
                            />
                          )}
                        </>
                      ) : field === "year_of_construction" || field === "creation_date" ? (
                        <input type="date" name={field} value={value} onChange={handleChange} />
                      ) : (
                        <input type="text" name={field} value={value} onChange={handleChange} />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: "20px", textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Add Property</button>
          </div>

          </form>
        </>
      )}

    </div>
  );
};
const styles={
    button: { width:200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  deleteButton: { width:200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },

};
export default AddProperty;
