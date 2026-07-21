import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const SimpleAdmin = () => {
  const { user, userProfile } = useAuth();
  const { hasRole } = useRoleCheck();

  const isAdmin = hasRole("admin");
  const isCore = hasRole("core");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", backgroundColor: "white", color: "black", minHeight: "100vh" }}>
      <h1>🛡️ Simple Dashboard</h1>
      
      <div style={{ marginBottom: "20px", padding: "15px", border: "2px solid #007bff", borderRadius: "5px" }}>
        <h2>Access Status</h2>
        <p><strong>User:</strong> {user?.email || "Not logged in"}</p>
        <p><strong>Role:</strong> {userProfile?.role || "No role"}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? "✅ YES" : "❌ NO"}</p>
        <p><strong>Is Core:</strong> {isCore ? "✅ YES" : "❌ NO"}</p>
        <p><strong>Has Access:</strong> {(isAdmin || isCore) ? "✅ YES" : "❌ NO"}</p>
      </div>

      {(isAdmin || isCore) ? (
        <div style={{ padding: "15px", backgroundColor: "#d4edda", border: "1px solid #c3e6cb", borderRadius: "5px" }}>
          <h2>✅ Admin Features Available</h2>
          <p>You have access to the admin dashboard!</p>
          
          <div style={{ marginTop: "20px" }}>
            <h3>Admin Sections:</h3>
            <ul>
              <li>📊 Dashboard Overview</li>
              <li>👥 User Management</li>
              <li>📅 Event Management</li>
              <li>📢 Announcements</li>
              <li>📸 Photo Management</li>
              {isAdmin && <li>🏢 Core Team Management</li>}
              {isAdmin && <li>⚙️ Settings</li>}
            </ul>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button 
              onClick={() => window.location.href = '/admin'}
              style={{ 
                padding: "10px 20px", 
                backgroundColor: "#007bff", 
                color: "white", 
                border: "none", 
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              🚀 Try Full Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: "15px", backgroundColor: "#f8d7da", border: "1px solid #f5c6cb", borderRadius: "5px" }}>
          <h2>❌ Access Denied</h2>
          <p>You need admin or core team privileges to access this page.</p>
          <p>Current role: <strong>{userProfile?.role || "No role assigned"}</strong></p>
        </div>
      )}

      <div style={{ marginTop: "30px", padding: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "5px" }}>
        <h3>Debug Info</h3>
        <pre style={{ fontSize: "12px", overflow: "auto" }}>
          {JSON.stringify({ 
            userEmail: user?.email,
            userRole: userProfile?.role,
            isAdmin,
            isCore,
            hasAccess: isAdmin || isCore
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleAdmin;
