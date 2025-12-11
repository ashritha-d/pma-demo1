import React, { useState } from "react";

const AddTenant = () => {
  const [formData, setFormData] = useState({
    tenant_name: "",
    tenant_dob: "",
    tenant_nationality: "",
    tenant_passport_number: "",
    tenant_emirates_id: "",
    tenant_passport_expiry: "",
    tenant_eid_expiry: "",
    tenant_employer: "",
    tenant_mobile: "",
    tenant_email: "",
    lease_start: "",
    lease_end: "",
    move_in: "",
    move_out: "",
    rent_amount: "",
    deposit_amount: "",
    number_of_payments: "",
    created_by: "admin",
    creation_date: new Date().toISOString().split("T")[0],
  });

  const [files, setFiles] = useState({});

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Input
  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(files).forEach(([key, file]) => data.append(key, file));

    try {
      const res = await fetch("http://localhost:5000/add_tenant", {
        method: "POST",
        body: data,
      });

      const result = await res.text();
      alert(result); // Can improve with toast later
    } catch (err) {
      alert("Error submitting tenant data");
      console.error(err);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Add Tenant</h2>

      <div style={styles.container}>
        <form onSubmit={handleSubmit} encType="multipart/form-data">

          {/* Row 1 */}
          <div style={styles.row}>
            <InputField label="Tenant Name" name="tenant_name" value={formData.tenant_name} onChange={handleChange} required />
            <InputField type="date" label="Date of Birth" name="tenant_dob" value={formData.tenant_dob} onChange={handleChange} />
            <InputField label="Nationality" name="tenant_nationality" value={formData.tenant_nationality} onChange={handleChange} />
            <InputField label="Passport Number" name="tenant_passport_number" value={formData.tenant_passport_number} onChange={handleChange} />
            <InputField label="Emirates ID" name="tenant_emirates_id" value={formData.tenant_emirates_id} onChange={handleChange} />
          </div>

          {/* Row 2 */}
          <div style={styles.row}>
            <InputField type="date" label="Passport Expiry" name="tenant_passport_expiry" value={formData.tenant_passport_expiry} onChange={handleChange} />
            <InputField type="date" label="EID Expiry" name="tenant_eid_expiry" value={formData.tenant_eid_expiry} onChange={handleChange} />
            <InputField label="Employer" name="tenant_employer" value={formData.tenant_employer} onChange={handleChange} />
            <InputField label="Mobile Number" name="tenant_mobile" value={formData.tenant_mobile} onChange={handleChange} />
            <InputField type="email" label="Email ID" name="tenant_email" value={formData.tenant_email} onChange={handleChange} />
          </div>

          {/* Row 3 */}
          <div style={styles.row}>
            <InputField type="date" label="Lease Start Date" name="lease_start" value={formData.lease_start} onChange={handleChange} />
            <InputField type="date" label="Lease End Date" name="lease_end" value={formData.lease_end} onChange={handleChange} />
            <InputField type="date" label="Move In Date" name="move_in" value={formData.move_in} onChange={handleChange} />
            <InputField type="date" label="Move Out Date" name="move_out" value={formData.move_out} onChange={handleChange} />
            <InputField type="number" label="Rent Amount" name="rent_amount" value={formData.rent_amount} onChange={handleChange} />
          </div>

          {/* Row 4 */}
          <div style={styles.row}>
            <InputField type="number" label="Deposit Received" name="deposit_amount" value={formData.deposit_amount} onChange={handleChange} />
            <InputField type="number" label="Number of Payments" name="number_of_payments" value={formData.number_of_payments} onChange={handleChange} />
            <InputField label="Created By" name="created_by" value={formData.created_by} onChange={handleChange} readOnly />
            <InputField type="date" label="Creation Date" name="creation_date" value={formData.creation_date} onChange={handleChange} readOnly />
          </div>

          {/* File Uploads */}
          <div style={styles.row}>
            {["passportcopypath", "eidcopypath", "residencevisacopypath", "bankstatementcopypath", "depositchequecopypath"].map((name, i) => (
              <FileField key={i} label={name.replace(/([A-Z])/g, " $1")} name={name} onChange={handleFileChange} />
            ))}
          </div>

          <div style={styles.row}>
            {["securitychequecopypath", "ejarimunicipalregistrationcopypath"].map((name, i) => (
              <FileField key={i} label={name.replace(/([A-Z])/g, " $1")} name={name} onChange={handleFileChange} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <a href="/index" style={{ ...styles.button, backgroundColor: "#492bc0ff", marginRight: "20px", textDecoration: "none", display: "inline-block" }}>← Go Back Home</a>
            <button type="submit" style={styles.deleteButton}>Add Tenant</button>
          </div>
        </form>

      </div>
    </div>
  );
};

// Reusable Input Component
const InputField = ({ label, name, value, onChange, type = "text", readOnly, required }) => (
  <div>
    <label style={styles.label}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} readOnly={readOnly} required={required} style={styles.input} />
  </div>
);

// Reusable File Input Component
const FileField = ({ label, name, onChange }) => (
  <div>
    <label style={styles.label}>{label}</label>
    <input type="file" name={name} onChange={onChange} style={styles.input} />
  </div>
);

// Inline Styles
const styles = {
  page: { background: "#f5f6fa", padding: 0, margin: 0 },
  title: { background: "#2f3640", color: "white", padding: "15px 0", textAlign: "center", margin: 0, fontSize: "24px" },
  container: { background: "white", maxWidth: "1500px", margin: "20px auto", padding: "25px", borderRadius: "10px", boxShadow: "0 0 10px #ccc" },
  row: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "15px" },
  label: { fontWeight: "bold", marginBottom: "5px", display: "block" },
  input: { width: "90%", padding: "7px", border: "1px solid #ccc", borderRadius: "6px" },
  btnContainer: { textAlign: "center", marginTop: "20px" },
  button: { width:200, padding: "10px 20px", backgroundColor: "#0097e6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
  deleteButton: { width:200, padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" },
};

export default AddTenant;
