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
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/dashboard_stats", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        setError(data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Network error while fetching dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "red" }}>
        <div>Error: {error}</div>
        <button onClick={fetchDashboardData} style={{ marginTop: 10, padding: "8px 16px" }}>
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div>No data available</div>
      </div>
    );
  }

  const { summary, charts } = dashboardData;

  // Properties by Status Pie Chart
  const statusData = {
    labels: charts.properties_by_status.map(item => item.status || 'Unknown'),
    datasets: [{
      data: charts.properties_by_status.map(item => item.count),
      backgroundColor: ['#27ae60', '#e74c3c', '#f39c12'],
      borderColor: ['#229954', '#c0392b', '#e67e22'],
      borderWidth: 2,
    }],
  };

  // Properties by Type Bar Chart
  const typeData = {
    labels: charts.properties_by_type.map(item => item.property_type || 'Unknown'),
    datasets: [{
      label: 'Number of Properties',
      data: charts.properties_by_type.map(item => item.count),
      backgroundColor: '#3498db',
      borderColor: '#2980b9',
      borderWidth: 1,
    }],
  };

  // Properties by City Horizontal Bar Chart
  const cityData = {
    labels: charts.properties_by_city.map(item => item.city || 'Unknown'),
    datasets: [{
      label: 'Properties',
      data: charts.properties_by_city.map(item => item.count),
      backgroundColor: '#9b59b6',
      borderColor: '#8e44ad',
      borderWidth: 1,
    }],
  };

  // Monthly Revenue Line Chart
  const revenueData = {
    labels: charts.monthly_revenue.map(item => item.month),
    datasets: [
      {
        label: 'Rent Revenue',
        data: charts.monthly_revenue.map(item => parseFloat(item.rent_revenue || 0)),
        borderColor: '#27ae60',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Deposit Revenue',
        data: charts.monthly_revenue.map(item => parseFloat(item.deposit_revenue || 0)),
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Summary Cards Data
  const summaryCards = [
    { title: "Total Properties", value: summary.total_properties, color: "#3498db", icon: "🏢" },
    { title: "Total Owners", value: summary.total_owners, color: "#e74c3c", icon: "👥" },
    { title: "Total Tenants", value: summary.total_tenants, color: "#27ae60", icon: "👤" },
    { title: "Total Contracts", value: summary.total_contracts, color: "#f39c12", icon: "📄" },
    { title: "Occupancy Rate", value: `${summary.occupancy_rate}%`, color: "#9b59b6", icon: "📊" },
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 20, background: "#f0f2f5", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 30 }}>
        📊 Property Management Dashboard
      </h1>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
        {summaryCards.map((card, index) => (
          <div
            key={index}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 10,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              textAlign: "center",
              borderLeft: `5px solid ${card.color}`,
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 10 }}>{card.icon}</div>
            <h3 style={{ margin: "10px 0", color: "#2c3e50" }}>{card.title}</h3>
            <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: card.color, margin: 0 }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 30 }}>

        {/* Properties by Status - Pie Chart */}
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
            <Pie
              data={statusData}
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
              data={typeData}
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

        {/* Properties by City - Horizontal Bar Chart */}
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
            <Bar
              data={cityData}
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

        {/* Monthly Revenue - Line Chart */}
        <div style={{
          background: "white",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ textAlign: "center", color: "#2c3e50", marginBottom: 20 }}>
            Monthly Revenue Trends
          </h3>
          <div style={{ height: 300 }}>
            <Line
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
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
                      callback: (value) => `₹${value.toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div style={{
        background: "white",
        padding: 20,
        borderRadius: 10,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginTop: 30
      }}>
        <h3 style={{ color: "#2c3e50", marginBottom: 20 }}>Recent Transactions</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Property</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Tenant</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Type</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Amount</th>
                <th style={{ padding: 12, textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recent_activity.transactions.slice(0, 5).map((transaction, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: 12 }}>{transaction.PropertyCode}</td>
                  <td style={{ padding: 12 }}>{transaction.TenantName || 'N/A'}</td>
                  <td style={{ padding: 12 }}>{transaction.ReceiptPaymentReason}</td>
                  <td style={{ padding: 12, fontWeight: "bold", color: "#27ae60" }}>
                    ₹{parseFloat(transaction.TrAmount).toLocaleString()}
                  </td>
                  <td style={{ padding: 12 }}>{transaction.TrDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <a
          href="/index"
          style={{
            backgroundColor: "gray",
            textDecoration: "none",
            color: "#333",
            fontWeight: "bold",
            padding: "12px 24px",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
};

export default Dashboard;