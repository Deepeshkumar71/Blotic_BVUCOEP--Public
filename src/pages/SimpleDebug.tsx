import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const SimpleDebug = () => {
  const { user, userProfile, loading } = useAuth();

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", backgroundColor: "white", color: "black", minHeight: "100vh" }}>
      <h1>🔍 Simple Auth Debug</h1>
      
      <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <h2>Auth Status</h2>
        <p><strong>Loading:</strong> {loading ? "YES" : "NO"}</p>
        <p><strong>User Exists:</strong> {user ? "YES" : "NO"}</p>
        <p><strong>Email:</strong> {user?.email || "N/A"}</p>
        <p><strong>User ID:</strong> {user?.id || "N/A"}</p>
      </div>

      <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <h2>Profile Status</h2>
        <p><strong>Profile Exists:</strong> {userProfile ? "YES" : "NO"}</p>
        <p><strong>Full Name:</strong> {userProfile?.full_name || "N/A"}</p>
        <p><strong>Role:</strong> {userProfile?.role || "N/A"}</p>
      </div>

      <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <h2>Test Links</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link to="/login" style={{ padding: "10px", backgroundColor: "#007bff", color: "white", textDecoration: "none" }}>
            Login Page
          </Link>
          <Link to="/test-profile" style={{ padding: "10px", backgroundColor: "#28a745", color: "white", textDecoration: "none" }}>
            Test Profile (No Auth)
          </Link>
          <Link to="/test-admin" style={{ padding: "10px", backgroundColor: "#dc3545", color: "white", textDecoration: "none" }}>
            Test Admin (No Auth)
          </Link>
          <Link to="/profile" style={{ padding: "10px", backgroundColor: "#ffc107", color: "black", textDecoration: "none" }}>
            Protected Profile
          </Link>
          <Link to="/admin" style={{ padding: "10px", backgroundColor: "#6f42c1", color: "white", textDecoration: "none" }}>
            Protected Admin
          </Link>
        </div>
      </div>

      <div style={{ padding: "10px", border: "1px solid #ccc", backgroundColor: "#f8f9fa" }}>
        <h2>Raw Data</h2>
        <pre style={{ fontSize: "12px", overflow: "auto" }}>
          {JSON.stringify({ 
            user: user ? { id: user.id, email: user.email } : null, 
            userProfile, 
            loading 
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleDebug;
