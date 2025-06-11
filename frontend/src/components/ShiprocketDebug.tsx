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
        billing_address: "Test Address, Test Street",
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
        payment_method: "Prepaid",
        sub_total: 100,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      };

      addLog("Order data prepared, sending to Shiprocket...");

      const result = await shiprocketApi.createOrder(orderData);
      addLog(`Order creation SUCCESS: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`Order creation FAILED: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testCheckout = async () => {
    if (!cart || !user) {
      addLog("Error: No cart or user data available");
      return;
    }

    setTesting(true);

    try {
      addLog("Testing complete checkout flow...");

      const orderData = {
        order_id: `checkout_test_${Date.now()}`,
        order_date: new Date().toISOString(),
        pickup_location: "Primary",
        billing_customer_name: "Test Customer",
        billing_address: "Test Address, Test Street",
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
        payment_method: "Prepaid",
        sub_total: 100,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      };

      addLog("Processing test checkout...");

      const result = await shiprocketApi.launchShiprocketCheckout(orderData);
      addLog(`Checkout SUCCESS: ${JSON.stringify(result)}`);
    } catch (error: any) {
      addLog(`Checkout FAILED: ${error.message}`);
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
        width: "450px",
        background: "white",
        border: "1px solid #ccc",
        padding: "15px",
        zIndex: 9999,
        maxHeight: "600px",
        overflow: "auto",
        fontSize: "14px",
      }}
    >
      <h4>🚀 Shiprocket Debug Panel</h4>

      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={testConnection}
          disabled={testing}
          style={{
            marginRight: "8px",
            padding: "6px 12px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Connection
        </button>
        <button
          onClick={testOrderCreation}
          disabled={testing}
          style={{
            marginRight: "8px",
            padding: "6px 12px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Order
        </button>
        <button
          onClick={testCheckout}
          disabled={testing}
          style={{
            padding: "6px 12px",
            background: "#fd7e14",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Test Checkout
        </button>
      </div>

      <div
        style={{
          background: "#f8f9fa",
          padding: "12px",
          fontSize: "12px",
          fontFamily: "monospace",
          maxHeight: "350px",
          overflow: "auto",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
        }}
      >
        <strong>📝 Logs:</strong>
        {logs.length === 0 ? (
          <div style={{ color: "#6c757d", fontStyle: "italic" }}>
            No logs yet... Click a test button!
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ margin: "4px 0" }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ fontSize: "11px", marginTop: "12px", color: "#6c757d" }}>
        <div>
          <strong>Status:</strong>
        </div>
        <div>• Environment: {process.env.NODE_ENV}</div>
        <div>• User: {user ? "✅ Authenticated" : "❌ Not authenticated"}</div>
        <div>• Cart items: {cart?.items.length || 0}</div>
        <div>
          • Shiprocket Email:{" "}
          {import.meta.env.VITE_SHIPROCKET_EMAIL ? "✅ Set" : "❌ Not set"}
        </div>
        <div>
          • Shiprocket Password:{" "}
          {import.meta.env.VITE_SHIPROCKET_PASSWORD ? "✅ Set" : "❌ Not set"}
        </div>
      </div>

      {testing && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          🔄 Testing...
        </div>
      )}
    </div>
  );
};

export default ShiprocketDebug;
