import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PropertiesReport = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPropertiesReport();
  }, []);

  const fetchPropertiesReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/properties_report", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties || []);
      } else {
        setError(data.message || "Failed to fetch properties report");
      }
    } catch (err) {
      console.error("Error fetching properties report:", err);
      setError("Network error while fetching report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div>Loading properties report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        <div>Error: {error}</div>
        <button onClick={fetchPropertiesReport} style={{ marginTop: 10, padding: "8px 16px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Properties Report
      </h2>

      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
          Total Properties: {properties.length}
        </div>
        <a
          href="/index"
          style={{
            backgroundColor: "gray",
            textDecoration: "none",
            color: "#333",
            fontWeight: "bold",
            padding: "8px 12px",
            borderRadius: 6,
          }}
        >
          ← Go Back Home
        </a>
      </div>

      {/* Charts Section */}
      {properties.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 30, marginBottom: 40 }}>

          {/* Properties by Status - Doughnut Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Properties by Status
            </h3>
            <div style={{ height: 300 }}>
              <Doughnut
                data={{
                  labels: ['Occupied', 'Vacant', 'Unknown'],
                  datasets: [{
                    data: [
                      properties.filter(p => p.status === 'occupied').length,
                      properties.filter(p => p.status === 'vacant').length,
                      properties.filter(p => !p.status || p.status === 'null').length
                    ],
                    backgroundColor: ['#27ae60', '#e74c3c', '#f39c12'],
                    borderColor: ['#229954', '#c0392b', '#e67e22'],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.label}: ${context.parsed} properties`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Properties by Type - Bar Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Properties by Type
            </h3>
            <div style={{ height: 300 }}>
              <Bar
                data={{
                  labels: [...new Set(properties.map(p => p.property_type || 'Unknown'))],
                  datasets: [{
                    label: 'Count',
                    data: [...new Set(properties.map(p => p.property_type || 'Unknown'))].map(type =>
                      properties.filter(p => (p.property_type || 'Unknown') === type).length
                    ),
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y} properties`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { precision: 0 }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Rent Amount Distribution - Bar Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Rent Amount Distribution (Top 10)
            </h3>
            <div style={{ height: 300 }}>
              <Bar
                data={{
                  labels: properties
                    .filter(p => p.rent_amount && parseFloat(p.rent_amount) > 0)
                    .sort((a, b) => parseFloat(b.rent_amount) - parseFloat(a.rent_amount))
                    .slice(0, 10)
                    .map(p => `Property ${p.property_code}`),
                  datasets: [{
                    label: 'Rent Amount (₹)',
                    data: properties
                      .filter(p => p.rent_amount && parseFloat(p.rent_amount) > 0)
                      .sort((a, b) => parseFloat(b.rent_amount) - parseFloat(a.rent_amount))
                      .slice(0, 10)
                      .map(p => parseFloat(p.rent_amount)),
                    backgroundColor: '#27ae60',
                    borderColor: '#229954',
                    borderWidth: 1,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `₹${context.parsed.y.toLocaleString()}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `₹${(value / 1000).toFixed(0)}K`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Properties by City - Pie Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Properties by City
            </h3>
            <div style={{ height: 300 }}>
              <Pie
                data={{
                  labels: [...new Set(properties.map(p => p.city || 'Unknown'))].slice(0, 8),
                  datasets: [{
                    data: [...new Set(properties.map(p => p.city || 'Unknown'))].slice(0, 8).map(city =>
                      properties.filter(p => (p.city || 'Unknown') === city).length
                    ),
                    backgroundColor: [
                      '#3498db', '#e74c3c', '#27ae60', '#f39c12',
                      '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
                    ],
                    borderColor: [
                      '#2980b9', '#c0392b', '#229954', '#e67e22',
                      '#8e44ad', '#16a085', '#2c3e50', '#d35400'
                    ],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.label}: ${context.parsed} properties`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          background: "white",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 0 12px rgba(0,0,0,0.12)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Property Code</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Building Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>City</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Rent Amount</th>
              <th style={thStyle}>Owner Name</th>
              <th style={thStyle}>Tenant Name</th>
              <th style={thStyle}>Contract Start</th>
              <th style={thStyle}>Contract End</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((prop, i) => (
              <tr key={prop.property_code || i} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                <td style={tdStyle}>{prop.property_code}</td>
                <td style={tdStyle}>{prop.name}</td>
                <td style={tdStyle}>{prop.building_name}</td>
                <td style={tdStyle}>{prop.property_type}</td>
                <td style={tdStyle}>{prop.city}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                    backgroundColor: prop.status === "occupied" ? "#27ae60" : "#e74c3c"
                  }}>
                    {prop.status || "N/A"}
                  </span>
                </td>
                <td style={tdStyle}>{prop.rent_amount ? `₹${parseFloat(prop.rent_amount).toLocaleString()}` : "N/A"}</td>
                <td style={tdStyle}>{prop.first_name ? `${prop.first_name} ${prop.last_name || ""}` : "N/A"}</td>
                <td style={tdStyle}>{prop.tenant_name || "Vacant"}</td>
                <td style={tdStyle}>{prop.contract_start_date || "N/A"}</td>
                <td style={tdStyle}>{prop.contract_end_date || "N/A"}</td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan="11" style={{ padding: 16, textAlign: "center" }}>
                  No properties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const thStyle = {
  padding: 12,
  border: "1px solid #ddd",
  background: "#273c75",
  color: "#fff",
  textAlign: "left",
};

const tdStyle = { padding: 10, border: "1px solid #eee" };

export default PropertiesReport;