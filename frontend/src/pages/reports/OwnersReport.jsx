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
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const OwnersReport = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOwnersReport();
  }, []);

  const fetchOwnersReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/owners_report", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setOwners(data.owners || []);
      } else {
        setError(data.message || "Failed to fetch owners report");
      }
    } catch (err) {
      console.error("Error fetching owners report:", err);
      setError("Network error while fetching report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div>Loading owners report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        <div>Error: {error}</div>
        <button onClick={fetchOwnersReport} style={{ marginTop: 10, padding: "8px 16px" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5" }}>
      <h2 style={{ textAlign: "center", background: "#2f3640", color: "white", padding: 15, margin: 0 }}>
        Owners Report
      </h2>

      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px" }}>
          Total Owners: {owners.length}
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
      {owners.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 30, marginBottom: 40 }}>
          {/* Properties per Owner - Bar Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Properties per Owner
            </h3>
            <div style={{ height: 300 }}>
              <Bar
                data={{
                  labels: owners.slice(0, 10).map(owner => owner.full_name?.split(' ')[0] || 'Unknown'),
                  datasets: [{
                    label: 'Number of Properties',
                    data: owners.slice(0, 10).map(owner => owner.property_count || 0),
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

          {/* Owners by City - Pie Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Owners by City
            </h3>
            <div style={{ height: 300 }}>
              <Pie
                data={{
                  labels: [...new Set(owners.map(owner => owner.city || 'Unknown'))].slice(0, 8),
                  datasets: [{
                    data: [...new Set(owners.map(owner => owner.city || 'Unknown'))].slice(0, 8).map(city =>
                      owners.filter(owner => (owner.city || 'Unknown') === city).length
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
                        label: (context) => `${context.label}: ${context.parsed} owners`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Property Value Distribution - Bar Chart */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Property Value by Owner (Top 10)
            </h3>
            <div style={{ height: 300 }}>
              <Bar
                data={{
                  labels: owners
                    .filter(owner => owner.total_property_value && parseFloat(owner.total_property_value) > 0)
                    .sort((a, b) => parseFloat(b.total_property_value) - parseFloat(a.total_property_value))
                    .slice(0, 10)
                    .map(owner => owner.full_name?.split(' ')[0] || 'Unknown'),
                  datasets: [{
                    label: 'Total Property Value (₹)',
                    data: owners
                      .filter(owner => owner.total_property_value && parseFloat(owner.total_property_value) > 0)
                      .sort((a, b) => parseFloat(b.total_property_value) - parseFloat(a.total_property_value))
                      .slice(0, 10)
                      .map(owner => parseFloat(owner.total_property_value)),
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
                        callback: (value) => `₹${(value / 100000).toFixed(1)}L`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Owners with Most Properties - Horizontal Bar */}
          <div style={{
            background: "white",
            padding: 20,
            borderRadius: 10,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
              Top Property Owners
            </h3>
            <div style={{ height: 300 }}>
              <Bar
                data={{
                  labels: owners
                    .filter(owner => owner.property_count > 0)
                    .sort((a, b) => b.property_count - a.property_count)
                    .slice(0, 8)
                    .map(owner => owner.full_name?.split(' ')[0] || 'Unknown'),
                  datasets: [{
                    label: 'Properties Owned',
                    data: owners
                      .filter(owner => owner.property_count > 0)
                      .sort((a, b) => b.property_count - a.property_count)
                      .slice(0, 8)
                      .map(owner => owner.property_count),
                    backgroundColor: '#9b59b6',
                    borderColor: '#8e44ad',
                    borderWidth: 1,
                  }],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.x} properties`
                      }
                    }
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: { precision: 0 }
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
          maxWidth: 1200,
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
              <th style={thStyle}>Owner Code</th>
              <th style={thStyle}>Full Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Mobile</th>
              <th style={thStyle}>City</th>
              <th style={thStyle}>Country</th>
              <th style={thStyle}>Properties Count</th>
              <th style={thStyle}>Total Property Value</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((owner, i) => (
              <tr key={owner.owner_code || i} style={{ background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                <td style={tdStyle}>{`OW${owner.owner_code.toString().padStart(5, "0")}`}</td>
                <td style={tdStyle}>{owner.full_name}</td>
                <td style={tdStyle}>{owner.email}</td>
                <td style={tdStyle}>{owner.mobile_number}</td>
                <td style={tdStyle}>{owner.city}</td>
                <td style={tdStyle}>{owner.country}</td>
                <td style={tdStyle}>{owner.property_count || 0}</td>
                <td style={tdStyle}>{owner.total_property_value ? `₹${parseFloat(owner.total_property_value).toLocaleString()}` : "N/A"}</td>
              </tr>
            ))}
            {owners.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: 16, textAlign: "center" }}>
                  No owners found
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

export default OwnersReport;