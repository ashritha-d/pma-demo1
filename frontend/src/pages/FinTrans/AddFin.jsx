import React, { useState } from "react";

const AddFin = () => {
  const [contractId, setContractId] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contract_id: "",
    property_id: "",
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

  const reasons = ["Rent", "Deposit", "Maintenance", "Other"];
  const paymentModes = ["Cash", "Cheque", "Online"];
  const chequeStatuses = ["Cleared", "Pending", "Bounced"];

  // 🔍 Search for contract ID
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!contractId) return alert("Enter a Contract ID first");

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/get_contract_details/${contractId}`);
      const data = await res.json();

      if (res.ok && data.contract_id) {
        setFormData((prev) => ({
          ...prev,
          contract_id: data.contract_id,
          property_id: data.property_id || "",
          tenant_id: data.tenant_id || "",
          tenant_name: data.tenant_name || "",
        }));
        alert("Contract details loaded successfully!");
      } else {
        alert(data.message || "Contract not found");
      }
    } catch (err) {
      console.error("Error fetching contract:", err);
      alert("Error fetching contract details");
    } finally {
      setLoading(false);
    }
  };

  // 📝 Handle form field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

// 💾 Save transaction
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.contract_id)
    return alert("Search for a valid contract first!");

  try {
    setLoading(true);
    const res = await fetch("http://localhost:5000/add_fin", {
      method: "POST",
       credentials: "include",
      headers: {
        "Content-Type": "application/json", // important
      },
       body: JSON.stringify({
  PropertyCode: formData.property_id,
  TenancyContractNumber: formData.contract_id,
  ReceiptPayment: formData.receipt_payment,
  ReceiptPaymentReason: formData.receipt_payment_reason,
  ModeOfPayment: formData.mode_of_payment,
  TrDate: formData.tr_date,
  TrAmount: formData.tr_amount,
  ReferenceNumber: formData.reference_number,
  ChequeDate: formData.cheque_date,
  BankName: formData.bank_name,
  BankCity: formData.bank_city,
  IFSCCode: formData.ifsc_code,
  ChequeStatus: formData.cheque_status,
  CreatedBy: formData.created_by,
})
    });

    const result = await res.json();

    if (res.ok && result.success) {
      alert(result.message || "Transaction added successfully!");
      // reset fields but keep contract info
      setFormData((prev) => ({
        ...prev,
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
      }));
    } else {
      alert(result.message || "Failed to add transaction");
    }
  } catch (err) {
    console.error("Error adding transaction:", err);
    alert("Error adding transaction");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h2 style={{ textAlign: "center", background: "#34495e", color: "white", padding: "15px 0" }}>
        Add Financial Transaction
      </h2>

      {/* 🔍 Contract ID Search */}
      <form onSubmit={handleSearch} style={{ textAlign: "center", margin: "20px 0" }}>
        <label style={{ fontWeight: "bold" }}>Enter Contract ID:</label>
        <input
          type="number"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          style={{ margin: "0 10px", padding: "6px", width: 150 }}
        />
        <button
          type="submit"
          style={{
            padding: "6px 12px",
            backgroundColor: "#273c75",
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

      {/* Transaction Form */}
      {formData.contract_id && (
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
              <input type="text" name="property_id" value={formData.property_id} readOnly style={{ background: "#f0f0f0" }} />
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
              href="/contractmaster/AddContract"
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
              {loading ? "Saving..." : "Save Transaction →"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddFin;
