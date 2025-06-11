// src/components/ShiprocketDebug.tsx
import React, { useState } from "react";
import { shiprocketApi } from "../api/shiprocketApi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const ShiprocketDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const { cart } = useCart();
  const { user } = useAuth();

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testConnection = async () => {
    setTesting(true);
    setLogs([]);

    try {
      addLog("Testing Shiprocket API connection...");
      const result = await shiprocketApi.testConnection();
      addLog(`Connection test result: ${result ? "SUCCESS" : "FAILED"}`);
    } catch (error: any) {
      addLog(`Connection test error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testOrderCreation = async () => {
    if (!cart || !user) {
      addLog("Error: No cart or user data available");
      return;
    }

    setTesting(true);

    try {
      addLog("Testing order creation...");

      const orderData = {
        order_id: `test_${Date.now()}`,
        order_date: new Date().toISOString(),
        pickup_location: "Primary",
        billing_customer_name: "Test Customer",
        billing_address: "Test Address",
        billing_city: "Delhi",
        billing_pincode: "110001",
        billing_state: "Delhi",
        billing_country: "India",
        billing_email: "test@example.com",
        billing_phone: "9999999999",
        shipping_is_billing: true,
        order_items: [
          {
            name: "Test Product",
            sku: "TEST001",
            units: 1,
            selling_price: 100,
          },
        ],
        payment_method: "prepaid",
        sub_total: 100,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      };

      addLog("Order data prepared, sending to Shiprocket...");
      console.log("Test order data:", orderData);

      const result = await shiprocketApi.createOrder(orderData);
      addLog(`Order creation result: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`Order creation error: ${error.message}`);
      console.error("Test order creation error:", error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        width: "400px",
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        zIndex: 9999,
        maxHeight: "500px",
        overflow: "auto",
      }}
    >
      <h4>Shiprocket Debug Panel</h4>

      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={testConnection}
          disabled={testing}
          style={{ marginRight: "5px" }}
        >
          Test Connection
        </button>
        <button
          onClick={testOrderCreation}
          disabled={testing || !cart || !user}
        >
          Test Order Creation
        </button>
      </div>

      <div
        style={{
          background: "#f5f5f5",
          padding: "10px",
          fontSize: "12px",
          fontFamily: "monospace",
          maxHeight: "300px",
          overflow: "auto",
        }}
      >
        <strong>Logs:</strong>
        {logs.length === 0 ? (
          <div>No logs yet...</div>
        ) : (
          logs.map((log, index) => <div key={index}>{log}</div>)
        )}
      </div>

      <div style={{ fontSize: "12px", marginTop: "10px" }}>
        <div>Environment: {process.env.NODE_ENV}</div>
        <div>User: {user ? "Authenticated" : "Not authenticated"}</div>
        <div>Cart items: {cart?.items.length || 0}</div>
        <div>
          Shiprocket Email:{" "}
          {import.meta.env.VITE_SHIPROCKET_EMAIL ? "Set" : "Not set"}
        </div>
      </div>
    </div>
  );
};

export default ShiprocketDebug;
