import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ViewProperty = () => {
  const { property_code } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`http://localhost:5000/view_property/${property_code}`, { credentials: "include" });
        const data = await res.json();
        console.log(data);
        if (res.ok && data.success) {
          setProperty(data.property);
          setTenant(data.tenant);
        } else {
          alert(data.message || "Property not found");
        }
      } catch (err) {
        console.error(err);
        alert("Error fetching property");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [property_code]);

  if (loading) return <p>Loading property details...</p>;
  if (!property) return <p>Property not found</p>;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", padding: 20, background: "#f7f9fb", minHeight: "100vh" }}>
      <h2
        style={{
          textAlign: "center",
          background: "#2f3640",
          color: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 30,
        }}
      >
        Property Details
      </h2>

      <button
        onClick={() => navigate(-1)}
        style={{
          backgroundColor: "#7f8c8d",
          color: "#fff",
          padding: "8px 12px",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          width: 150,
          marginBottom: 20,
        }}
      >
        ← Back
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 30,
          background: "white",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        {property.property_photo ? (
          <img
            src={`data:image/jpeg;base64,${property.property_photo}`}
            alt="Property"
            style={{
              width: "250px",
              height: "180px",
              objectFit: "cover",
              borderRadius: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          />
        ) : (
          <div
            style={{
              width: "250px",
              height: "180px",
              background: "#dcdde1",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#555",
              fontStyle: "italic",
            }}
          >
            No Image Available
          </div>
        )}

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px 20px",
              fontSize: "14px",
            }}
          >
            <div><strong>Property Code:</strong><br />{property.property_code}</div>
            <div><strong>Name:</strong><br />{property.name}</div>
            <div><strong>Developer:</strong><br />{property.developer_name}</div>
            <div><strong>Building:</strong><br />{property.building_name}</div>
            <div><strong>Type:</strong><br />{property.property_type}</div>
            <div><strong>Bedrooms:</strong><br />{property.bedrooms}</div>
            <div><strong>Bathrooms:</strong><br />{property.bathrooms}</div>
            <div><strong>Car Parkings:</strong><br />{property.car_parkings}</div>
            <div><strong>Ownership:</strong><br />{property.ownership_type}</div>
            <div><strong>Furnishing:</strong><br />{property.furnishing_status}</div>
            <div><strong>Rent Value:</strong><br />{property.expected_rent_value}</div>
            <div><strong>City:</strong><br />{property.city}</div>
            <div><strong>State:</strong><br />{property.state}</div>
            <div><strong>Country:</strong><br />{property.country}</div>
            <div><strong>Zip Code:</strong><br />{property.zip_code}</div>
          </div>
        </div>
      </div>

      {tenant ? (
        <div
          style={{
            marginTop: 30,
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ color: "#27ae60", marginBottom: 15 }}>Current Tenant</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px 20px",
              fontSize: "14px",
            }}
          >
            <div><strong>Name:</strong><br />{tenant.tenantname}</div>
            <div><strong>Email:</strong><br />{tenant.tenantemailid}</div>
            <div><strong>Mobile:</strong><br />{tenant.tenantmobilenumber}</div>
            <div><strong>Nationality:</strong><br />{tenant.tenantnationality}</div>
            <div><strong>Employer:</strong><br />{tenant.tenantemployer}</div>
            <div><strong>Lease Start:</strong><br />{tenant.leasestartdate?.slice(0, 10)}</div>
            <div><strong>Lease End:</strong><br />{tenant.leaseenddate?.slice(0, 10)}</div>
            <div><strong>Rent Amount:</strong><br />{tenant.rentamount}</div>
          </div>
        </div>
      ) : (
        <p style={{ color: "gray", marginTop: 30 }}>No tenant currently assigned.</p>
      )}
    </div>
  );
};

export default ViewProperty;
