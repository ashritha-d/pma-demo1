import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const AddFinTrans = () => {
  const { contract_id } = useParams();

  const [formData, setFormData] = useState({
    contract_id: contract_id || "",
    property_code: "",
    tenant_id: "",
    tenant_name: "",
    receipt_payment: "Receipt",
    receipt_payment_reason: "",
    mode_of_payment: "",
    tr_date: new Date().toISOString().split("T")[0],
    tr_amount: "",
    reference_number: "",
    cheque_date: "",
    bank_name: "",
    bank_city: "",
    ifsc_code: "",
    cheque_status: "",
    created_by: "admin",
    creation_date: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(true);

  // ✅ Fetch contract details by contract_id
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`http://localhost:5000/get_contract/${contract_id}`);
        const result = await res.json();

        if (result.success && result.contract) {
          const c = result.contract;
          setFormData((prev) => ({
            ...prev,
            property_code: c.property_id,
            tenant_id: c.tenant_id,
            tenant_name: c.tenant_name,
          }));
        } else {
          alert("Contract not found!");
          window.location.href = "http://localhost:3000/contractmaster/AddContract";
        }
      } catch (err) {
        console.error("Error fetching contract:", err);
        alert("Error fetching contract details!");
      } finally {
        setLoading(false);
      }
    };

    if (contract_id) fetchContract();
  }, [contract_id]);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submit
const handleSubmit = async (e) => {
  e.preventDefault();

  // ✅ Convert empty strings to null for optional fields
  const cleanedData = Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [key, value === "" ? null : value])
  );

  try {
    const res = await fetch("http://localhost:5000/add_fintrans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanedData),
    });

    const result = await res.json();

    if (result.success) {
      alert("✅ Financial Transaction saved successfully!");
      window.location.href = "http://localhost:3000/contractmaster/AddContract";
    } else {
      alert("❌ " + (result.message || "Failed to save transaction"));
    }
  } catch (err) {
    console.error("Error submitting FinTrans:", err);
    alert("Error saving transaction!");
  }
};

  if (loading) return <p>Loading...</p>;

  const paymentModes = ["Cash", "Cheque", "Online"];
  const reasons = ["Rent", "Rent Deposit", "Maintenance", "Electrical bill", "Water Bill", "Others"];
  const chequeStatuses = ["Cleared", "Bounced"];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2 style={{ textAlign: "center", background: "#34495e", color: "white", padding: "15px 0" }}>
        Add Financial Transaction
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px",
            margin: "20px 0",
          }}
        >
          <div>
            <label>Contract ID</label>
            <input type="text" name="contract_id" value={formData.contract_id} readOnly style={{ background: "#f0f0f0" }} />
          </div>

          <div>
            <label>Property Code</label>
            <input type="text" name="property_code" value={formData.property_code} readOnly style={{ background: "#f0f0f0" }} />
          </div>

          <div>
            <label>Tenant ID</label>
            <input type="text" name="tenant_id" value={formData.tenant_id} readOnly style={{ background: "#f0f0f0" }} />
          </div>

          <div>
            <label>Tenant Name</label>
            <input type="text" name="tenant_name" value={formData.tenant_name} readOnly style={{ background: "#f0f0f0" }} />
          </div>

          <div>
            <label>Receipt / Payment</label>
            <select name="receipt_payment" value={formData.receipt_payment} onChange={handleChange}>
              <option value="Receipt">Receipt</option>
              <option value="Payment">Payment</option>
            </select>
          </div>

          <div>
            <label>Reason</label>
            <select name="receipt_payment_reason" value={formData.receipt_payment_reason} onChange={handleChange}>
              <option value="">Select</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Mode of Payment</label>
            <select name="mode_of_payment" value={formData.mode_of_payment} onChange={handleChange}>
              <option value="">Select</option>
              {paymentModes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Transaction Date</label>
            <input type="date" name="tr_date" value={formData.tr_date} onChange={handleChange} />
          </div>

          <div>
            <label>Transaction Amount</label>
            <input type="number" name="tr_amount" value={formData.tr_amount} onChange={handleChange} placeholder="Enter amount" />
          </div>

          {formData.mode_of_payment === "Online" && (
            <div>
              <label>Reference Number</label>
              <input type="text" name="reference_number" value={formData.reference_number} onChange={handleChange} />
            </div>
          )}

          {formData.mode_of_payment === "Cheque" && (
            <>
              <div>
                <label>Cheque Date</label>
                <input type="date" name="cheque_date" value={formData.cheque_date} onChange={handleChange} />
              </div>
              <div>
                <label>Bank Name</label>
                <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} />
              </div>
              <div>
                <label>Bank City</label>
                <input type="text" name="bank_city" value={formData.bank_city} onChange={handleChange} />
              </div>
              <div>
                <label>IFSC Code</label>
                <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleChange} />
              </div>
              <div>
                <label>Cheque Status</label>
                <select name="cheque_status" value={formData.cheque_status} onChange={handleChange}>
                  <option value="">Select</option>
                  {chequeStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <a
            href="http://localhost:3000/contractmaster/AddContract"
            style={{
              width: 200,
              padding: "10px 20px",
              backgroundColor: "#555",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              marginRight: "20px",
              display: "inline-block",
            }}
          >
            ← Back to Contract
          </a>
          <button
            type="submit"
            style={{
              width: 200,
              padding: "10px 20px",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Save Transaction →
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFinTrans;
