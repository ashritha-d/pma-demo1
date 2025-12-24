import React, { useState } from "react";

const Register = () => {
  const [formData, setFormData] = useState({
    User_Name: "",
    Email: "",
    Mobile: "",
    Password: "",
    ConfirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (data.success) {
      alert("Registered Successfully! User ID: " + data.User_Id);
      window.location.href = "/login";
    } else {
      alert("Error: " + data.message);
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit}>
          <input type="text" name="User_Name" placeholder="Full Name" required onChange={handleChange} />
          <input type="email" name="Email" placeholder="Email Address" required onChange={handleChange} />
          <input type="text" name="Mobile" placeholder="Mobile Number" required onChange={handleChange} />
          <input type="password" name="Password" placeholder="Password" required onChange={handleChange} />
          <input type="password" name="ConfirmPassword" placeholder="Confirm Password" required onChange={handleChange} />
          <button type="submit">Register</button>
        </form>

        <div className="link">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
