// src/components/Debug/AppwriteDebugger.tsx
// This component helps debug Appwrite issues - remove in production

import React, { useState, useEffect } from "react";
import { account } from "../../App";
import {
  appwriteConfig,
  testAppwriteConnection,
  validatePhoneNumber,
  debugAppwrite,
} from "../../config/appwrite.config";

interface DebugInfo {
  connectionStatus: "testing" | "connected" | "failed";
  projectId: string;
  endpoint: string;
  sessionInfo: any;
  userInfo: any;
  error: string | null;
}

const AppwriteDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    connectionStatus: "testing",
    projectId: appwriteConfig.projectId,
    endpoint: appwriteConfig.endpoint,
    sessionInfo: null,
    userInfo: null,
    error: null,
  });

  const [testPhone, setTestPhone] = useState("");
  const [phoneValidation, setPhoneValidation] = useState<any>(null);

  useEffect(() => {
    runConnectionTest();
    getDebugInfo();
  }, []);

  const runConnectionTest = async () => {
    try {
      const isConnected = await testAppwriteConnection();
      setDebugInfo((prev) => ({
        ...prev,
        connectionStatus: isConnected ? "connected" : "failed",
      }));
    } catch (error: any) {
      setDebugInfo((prev) => ({
        ...prev,
        connectionStatus: "failed",
        error: error.message,
      }));
    }
  };

  const getDebugInfo = async () => {
    try {
      const [sessionInfo, userInfo] = await Promise.all([
        debugAppwrite.getSession(),
        debugAppwrite.getProjectInfo(),
      ]);

      setDebugInfo((prev) => ({
        ...prev,
        sessionInfo,
        userInfo,
      }));
    } catch (error: any) {
      setDebugInfo((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  const testPhoneValidation = () => {
    const validation = validatePhoneNumber(testPhone);
    setPhoneValidation(validation);
  };

  const clearSession = async () => {
    try {
      await account.deleteSession("current");
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const testPhoneAuth = async () => {
    try {
      const validation = validatePhoneNumber(testPhone);
      if (!validation.isValid) {
        alert(`Invalid phone: ${validation.error}`);
        return;
      }

      console.log("Testing phone auth with:", validation.formatted);
      const response = await account.createPhoneToken(
        "unique()",
        validation.formatted
      );
      console.log("Phone token response:", response);
      alert("OTP sent successfully! Check console for details.");
    } catch (error: any) {
      console.error("Phone auth test error:", error);
      alert(`Phone auth failed: ${error.message}`);
    }
  };

  const listSessions = async () => {
    try {
      const sessions = await debugAppwrite.listSessions();
      console.log("All sessions:", sessions);
      alert("Sessions listed in console");
    } catch (error: any) {
      console.error("List sessions error:", error);
      alert(`List sessions failed: ${error.message}`);
    }
  };

  const debugStyles = {
    container: {
      position: "fixed" as const,
      top: "10px",
      right: "10px",
      background: "#f8f9fa",
      border: "1px solid #dee2e6",
      borderRadius: "8px",
      padding: "16px",
      maxWidth: "400px",
      fontSize: "12px",
      zIndex: 9999,
      maxHeight: "80vh",
      overflowY: "auto" as const,
    },
    header: {
      fontWeight: "bold",
      marginBottom: "12px",
      color: "#495057",
    },
    section: {
      marginBottom: "12px",
      padding: "8px",
      background: "#ffffff",
      borderRadius: "4px",
      border: "1px solid #e9ecef",
    },
    sectionTitle: {
      fontWeight: "bold",
      marginBottom: "4px",
      color: "#6c757d",
    },
    status: {
      padding: "4px 8px",
      borderRadius: "4px",
      color: "white",
      fontWeight: "bold",
    },
    connected: { backgroundColor: "#28a745" },
    failed: { backgroundColor: "#dc3545" },
    testing: { backgroundColor: "#ffc107", color: "#212529" },
    button: {
      background: "#007bff",
      color: "white",
      border: "none",
      padding: "4px 8px",
      borderRadius: "4px",
      cursor: "pointer",
      marginRight: "4px",
      marginBottom: "4px",
      fontSize: "11px",
    },
    input: {
      width: "100%",
      padding: "4px",
      marginBottom: "4px",
      border: "1px solid #ced4da",
      borderRadius: "4px",
    },
    error: {
      color: "#dc3545",
      fontWeight: "bold",
    },
    success: {
      color: "#28a745",
      fontWeight: "bold",
    },
    code: {
      background: "#f8f9fa",
      padding: "4px",
      borderRadius: "2px",
      fontFamily: "monospace",
      fontSize: "10px",
      wordBreak: "break-all" as const,
    },
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div style={debugStyles.container}>
      <div style={debugStyles.header}>🔧 Appwrite Debugger</div>

      {/* Connection Status */}
      <div style={debugStyles.section}>
        <div style={debugStyles.sectionTitle}>Connection Status</div>
        <div
          style={{
            ...debugStyles.status,
            ...(debugInfo.connectionStatus === "connected"
              ? debugStyles.connected
              : debugInfo.connectionStatus === "failed"
              ? debugStyles.failed
              : debugStyles.testing),
          }}
        >
          {debugInfo.connectionStatus.toUpperCase()}
        </div>
        <button style={debugStyles.button} onClick={runConnectionTest}>
          Test Connection
        </button>
      </div>

      {/* Configuration */}
      <div style={debugStyles.section}>
        <div style={debugStyles.sectionTitle}>Configuration</div>
        <div>
          Endpoint: <span style={debugStyles.code}>{debugInfo.endpoint}</span>
        </div>
        <div>
          Project: <span style={debugStyles.code}>{debugInfo.projectId}</span>
        </div>
      </div>

      {/* Session Info */}
      <div style={debugStyles.section}>
        <div style={debugStyles.sectionTitle}>Session Info</div>
        {debugInfo.sessionInfo ? (
          <div style={debugStyles.success}>Active Session Found</div>
        ) : (
          <div>No Active Session</div>
        )}
        <button style={debugStyles.button} onClick={getDebugInfo}>
          Refresh Info
        </button>
        <button style={debugStyles.button} onClick={clearSession}>
          Clear Session
        </button>
        <button style={debugStyles.button} onClick={listSessions}>
          List All Sessions
        </button>
      </div>

      {/* User Info */}
      <div style={debugStyles.section}>
        <div style={debugStyles.sectionTitle}>User Info</div>
        {debugInfo.userInfo ? (
          <div>
            <div style={debugStyles.success}>
              User:{" "}
              {debugInfo.userInfo.phone ||
                debugInfo.userInfo.email ||
                "Unknown"}
            </div>
            <div>
              ID: <span style={debugStyles.code}>{debugInfo.userInfo.$id}</span>
            </div>
          </div>
        ) : (
          <div>No User Data</div>
        )}
      </div>

      {/* Phone Validation Test */}
      <div style={debugStyles.section}>
        <div style={debugStyles.sectionTitle}>Phone Validation Test</div>
        <input
          style={debugStyles.input}
          type="text"
          placeholder="Enter phone number"
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
        />
        <button style={debugStyles.button} onClick={testPhoneValidation}>
          Validate
        </button>
        <button style={debugStyles.button} onClick={testPhoneAuth}>
          Test OTP Send
        </button>
        {phoneValidation && (
          <div>
            {phoneValidation.isValid ? (
              <div style={debugStyles.success}>
                Valid: {phoneValidation.formatted}
              </div>
            ) : (
              <div style={debugStyles.error}>
                Invalid: {phoneValidation.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Errors */}
      {debugInfo.error && (
        <div style={debugStyles.section}>
          <div style={debugStyles.sectionTitle}>Errors</div>
          <div style={debugStyles.error}>{debugInfo.error}</div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={debugStyles.section}>
        <div style={debugStyles.sectionTitle}>Quick Actions</div>
        <button
          style={debugStyles.button}
          onClick={() => console.log("Debug info:", debugInfo)}
        >
          Log Debug Info
        </button>
        <button
          style={debugStyles.button}
          onClick={() => debugAppwrite.logConfig()}
        >
          Log Config
        </button>
      </div>
    </div>
  );
};

export default AppwriteDebugger;
