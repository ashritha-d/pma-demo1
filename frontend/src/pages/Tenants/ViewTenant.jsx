import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ViewTenant = () => {
  const { tenant_id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`http://localhost:5000/view_tenant/${tenant_id}`, { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.success) setTenant(data.tenant);
        else alert(data.message || "Tenant not found");
      } catch (err) {
        console.error(err);
        alert("Error fetching tenant");
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [tenant_id]);

  if (loading) return <p>Loading tenant details...</p>;
  if (!tenant) return <p>Tenant not found</p>;

  // Helper: 4 labels per row
  const Label = ({ label, value }) => (
    <div style={{ flex: 1, minWidth: "200px" }}>
      <strong>{label}:</strong> <br /> {value || "-"}
    </div>
  );

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", padding: 20, background: "#f7f9fb", minHeight: "100vh" }}>
      <h2 style={{ textAlign: "center", background: "#273c75", color: "white", padding: 15, borderRadius: 8, marginBottom: 30 }}>
        Tenant Details
      </h2>

      <button
        onClick={() => navigate(-1)}
        style={{ backgroundColor: "#7f8c8d", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6, cursor: "pointer", width: 150, marginBottom: 20 }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", gap: 30, background: "white", padding: 20, borderRadius: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        {tenant.eidcopypath ? (
          <img
            src={`data:image/jpeg;base64,${tenant.eidcopypath}`}
            alt="Tenant"
            style={{ width: "250px", height: "200px", objectFit: "cover", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
          />
        ) : (
          <div style={{ width: "250px", height: "200px", background: "#dcdde1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontStyle: "italic" }}>
            No Image Available
          </div>
        )}

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px 20px", fontSize: 14 }}>
          <Label label="Name" value={tenant.tenantname} />
          <Label label="DOB" value={tenant.tendantob?.slice(0, 10)} />
          <Label label="Nationality" value={tenant.tenantnationality} />
          <Label label="Email" value={tenant.tenantemailid} />
          <Label label="Mobile" value={tenant.tenantmobilenumber} />
          <Label label="Employer" value={tenant.tenantemployer} />
          <Label label="Lease Start" value={tenant.leasestartdate?.slice(0, 10)} />
          <Label label="Lease End" value={tenant.leaseenddate?.slice(0, 10)} />
          <Label label="Rent" value={tenant.rentamount} />
          <Label label="Deposit" value={tenant.depositamountreceived} />
        </div>
      </div>

      {/* Documents / Photos */}
      <div style={{ marginTop: 30, background: "white", padding: 20, borderRadius: 10, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#27ae60", marginBottom: 15 }}>Documents / Photos</h3>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {tenant.passportcopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.passportcopypath}`}
              alt="Passport Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}
          {tenant.eidcopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.eidcopypath}`}
              alt="EID Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}
                    {tenant.residencevisacopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.residencevisacopypath}`}
              alt="Passport Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}
          {tenant.bankstatementcopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.bankstatementcopypath}`}
              alt="EID Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}
          {tenant.depositchequecopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.depositchequecopypath}`}
              alt="Passport Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}
          {tenant.securitychequecopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.securitychequecopypath}`}
              alt="EID Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}
          {tenant.ejarimunicipalregistrationcopypath && (
            <img
              src={`data:image/jpeg;base64,${tenant.ejarimunicipalregistrationcopypath}`}
              alt="EID Copy"
              style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default ViewTenant;
