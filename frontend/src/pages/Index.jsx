import React, { useEffect, useState } from "react";
import "./Home.css";
// import  from "react-router-dom";
const Index = () => {
  const [slideIndex, setSlideIndex] = useState(0);

  const images = [
    "/image1.jpeg",
    "/image2.jpeg",
    "/image3.webp",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = (n) => {
    setSlideIndex((prev) => (prev + n + images.length) % images.length);
  };

  return (
    <div>
      <nav>
        <ul>
          <li><a href="/index">🏠 Home</a></li>
                    <li>
            <a href="/index">👤 Users</a>
            <ul>
              <li><a href="users/AddUser">Add User</a></li>
              <li><a href="users/EditUser">Edit User</a></li>
              <li><a href="users/DeleteUser">Delete User</a></li>
              <li><a href="users/UsersList">List User</a></li>
            </ul>
          </li>

          <li>
            <a href="/index">👤 Owners</a>
            <ul>
              <li><a href="owners/AddOwner">Add Owner</a></li>
              <li><a href="owners/ModifyOwner">Edit Owner</a></li>
              <li><a href="owners/DeleteOwner">Delete Owner</a></li>
              <li><a href="owners/OwnersList">List Owners</a></li>
            </ul>
          </li>
 <li>
            <a href="/index">🏢 Properties</a>
            <ul>
              <li><a href="property/AddProperty">Add Property</a></li>
              <li><a href="property/ModifyProperty">Edit Property</a></li>
              <li><a href="property/DeleteProperty">Delete Property</a></li>
              <li><a href="property/ListProperty">List Properties</a></li>
              <li><a href="/ViewProperty">View Property</a></li>

            </ul>
          </li>

          <li>
            <a href="/index">👥 Tenants</a>
            <ul>
              <li><a href="Tenants/AddTenant">Add Tenant</a></li>
              <li><a href="Tenants/ModifyTenant">Edit Tenant</a></li>
              <li><a href="Tenants/DeleteTenant">Delete Tenant</a></li>
              <li><a href="Tenants/ListTenant">List of Tenants</a></li>
                <li><a href="/ViewTenant">View Tenants</a></li>

            </ul>
          </li>

           <li>
            <a href="/index">📄Contracts</a> 
             <ul>
              <li><a href="contractmaster/AddContract">Add Contract</a></li>
              <li><a href="contractmaster/ModifyContract">Edit Contracts</a></li>
              <li><a href="contractmaster/DeleteContract">Delete Contract</a></li>
              <li><a href="contractmaster/ListContract">List Contracts</a></li>
            </ul>
          </li> 
            <li>
            <a href="/index">📄FinTrans</a> 
             <ul>
              <li><a href="Fintrans/AddFin">Add FinTrans</a></li>
              <li><a href="Fintrans/EditFinTrans">Edit FinTrans</a></li>
              <li><a href="Fintrans/ListFinTrans">List FinTrans</a></li>
            </ul>
          </li> 
            <li>
            <a href="/index">🧰 Services</a> 
             <ul>
              <li><a href="ServiceTrans/AddServTrans">Add Service</a></li>
              <li><a href="ServiceTrans/EditServTrans">Edit Service</a></li>
              <li><a href="ServiceTrans/ListServTrans">List Services</a></li>
            </ul>
          </li> 

          <li>
            <a href="/">📊 Reports</a>
            <ul>
              <li><a href="/">Owner Report</a></li>
              <li><a href="/">Property Report</a></li>
            </ul>
          </li>          
                    <li style={{ marginLeft: "auto" }}>
      <button
        onClick={() => {
          localStorage.removeItem("token"); // Or sessionStorage.clear()
          window.location.href = "/login";  // Redirect to login
        }}
        style={{
          color: "white",
          padding: "20px",
          margin:"0",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          display:"flex",

        }}
      >
         Logout
      </button>
    </li>

        </ul>
      </nav>

      <div style={{ padding: "20px" }}>
        <h2 style={{ textAlign: "center" }}>Welcome to Property Management App</h2>
      </div>

      <div className="slideshow-container">
        {images.map((img, i) => (
          <div
            className="slide"
            style={{ display: slideIndex === i ? "block" : "none" }}
            key={i}
          >
            <img src={img} alt={`Slide ${i + 1}`} />
          </div>
        ))}
{/* <button className="prev" onClick={() => nextSlide(-1)} aria-label="Previous Slide">
  &#10094;
</button>
<button className="next" onClick={() => nextSlide(1)} aria-label="Next Slide">
  &#10095;
</button> */}
      </div>
    </div>
  );
};

export default Index;
