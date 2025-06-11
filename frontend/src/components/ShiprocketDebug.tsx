// src/components/ShiprocketDebug.tsx
import React, { useState } from "react";
import { shiprocketApi } from "../api/shiprocketApi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

// Type for handling different checkout result types
type CheckoutResult = {
  checkoutUrl: string;
  checkoutWindow?: Window | null;
  shiprocketOrderId?: string;
  orderId?: string;
  shipmentId?: string;
  status?: string;
};

const ShiprocketDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { cart } = useCart();
  const { user } = useAuth();

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = async () => {
    setTesting(true);
    clearLogs();

    try {
      addLog("🔍 Testing Shiprocket API connection...");
      addLog(`📧 Email: ${import.meta.env.VITE_SHIPROCKET_EMAIL || "NOT SET"}`);
      addLog(
        `🔐 Password: ${
          import.meta.env.VITE_SHIPROCKET_PASSWORD ? "SET" : "NOT SET"
        }`
      );

      const result = await shiprocketApi.testConnection();
      addLog(`✅ Connection test result: ${result ? "SUCCESS" : "FAILED"}`);

      if (!result) {
        addLog("❌ Connection failed. Check your credentials in .env file:");
        addLog("   VITE_SHIPROCKET_EMAIL=your_email@example.com");
        addLog("   VITE_SHIPROCKET_PASSWORD=your_password");
      }
    } catch (error: any) {
      addLog(`❌ Connection test error: ${error.message}`);

      if (error.message.includes("credentials")) {
        addLog("💡 Tip: Set up Shiprocket credentials in your .env file");
      } else if (error.message.includes("Network")) {
        addLog("💡 Tip: Check your internet connection");
      }
    } finally {
      setTesting(false);
    }
  };

  const testOrderCreation = async () => {
    if (!cart || !user) {
      addLog("❌ Error: No cart or user data available");
      return;
    }

    setTesting(true);

    try {
      addLog("📦 Testing order creation...");

      const orderData = {
        order_id: `test_${Date.now()}`,
        order_date: new Date().toISOString().split("T")[0],
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

      addLog("📤 Order data prepared, sending to Shiprocket...");
      addLog(`📋 Order ID: ${orderData.order_id}`);

      const result = await shiprocketApi.createOrder(orderData);
      addLog(`✅ Order creation SUCCESS!`);
      addLog(`🆔 Shiprocket Order ID: ${result.shiprocketOrderId}`);
      addLog(`📦 Shipment ID: ${result.shipmentId || "N/A"}`);
      addLog(`📊 Status: ${result.status || "N/A"}`);

      if (result.rawResponse) {
        addLog(
          `📋 Full response: ${JSON.stringify(result.rawResponse, null, 2)}`
        );
      }
    } catch (error: any) {
      addLog(`❌ Order creation FAILED: ${error.message}`);

      if (error.message.includes("Authentication")) {
        addLog("💡 Tip: Check your Shiprocket credentials");
      } else if (error.message.includes("validation")) {
        addLog("💡 Tip: Check the order data format");
      }
    } finally {
      setTesting(false);
    }
  };

  const testCheckout = async () => {
    if (!cart || !user) {
      addLog("❌ Error: No cart or user data available");
      return;
    }

    setTesting(true);

    try {
      addLog("🛒 Testing complete checkout flow...");

      const orderData = {
        order_id: `checkout_test_${Date.now()}`,
        order_date: new Date().toISOString().split("T")[0],
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

      addLog("🚀 Processing test checkout...");

      const result: CheckoutResult =
        await shiprocketApi.launchShiprocketCheckout(orderData);
      addLog(`✅ Checkout SUCCESS!`);
      addLog(`🔗 Checkout URL: ${result.checkoutUrl}`);

      // Handle different return types safely
      const orderId = result.shiprocketOrderId || result.orderId;
      if (orderId) {
        addLog(`🆔 Order ID: ${orderId}`);
      }

      if (result.checkoutWindow) {
        addLog("🪟 Checkout window opened successfully");
      }
    } catch (error: any) {
      addLog(`❌ Checkout FAILED: ${error.message}`);

      if (error.message.includes("pop-up")) {
        addLog("💡 Tip: Allow pop-ups for this site");
      } else if (error.message.includes("credentials")) {
        addLog("💡 Tip: Verify your Shiprocket API credentials");
      }
    } finally {
      setTesting(false);
    }
  };

  const testWithRealCart = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      addLog("❌ No items in cart to test with");
      return;
    }

    if (!user) {
      addLog("❌ No user logged in");
      return;
    }

    setTesting(true);

    try {
      addLog("🛍️ Testing with real cart data...");
      addLog(`📦 Cart items: ${cart.items.length}`);
      addLog(`💰 Cart total: ₹${cart.subtotal}`);

      // Use actual cart data
      const orderItems = cart.items.map((item, index) => ({
        name: item.title || `Product ${index + 1}`,
        sku: item.productId || `PROD${index + 1}`,
        units: item.quantity,
        selling_price: item.price,
      }));

      const orderData = {
        order_id: `real_cart_test_${Date.now()}`,
        order_date: new Date().toISOString().split("T")[0],
        pickup_location: "Primary",
        billing_customer_name: "Test Customer",
        billing_address: "Test Address, Test Street",
        billing_city: "Mumbai",
        billing_pincode: "400001",
        billing_state: "Maharashtra",
        billing_country: "India",
        billing_email: "test@example.com",
        billing_phone: "9999999999",
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: "Prepaid",
        sub_total: cart.subtotal,
        length: 15,
        breadth: 15,
        height: 15,
        weight: Math.max(cart.items.length * 0.1, 0.5), // Estimate weight
      };

      addLog("🚀 Creating order with real cart data...");

      const result = await shiprocketApi.createOrder(orderData);
      addLog(`✅ Real cart order creation SUCCESS!`);
      addLog(`🆔 Shiprocket Order ID: ${result.shiprocketOrderId}`);
      addLog(`📦 Shipment ID: ${result.shipmentId || "N/A"}`);
    } catch (error: any) {
      addLog(`❌ Real cart test FAILED: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getEnvironmentStatus = () => {
    const hasEmail = !!import.meta.env.VITE_SHIPROCKET_EMAIL;
    const hasPassword = !!import.meta.env.VITE_SHIPROCKET_PASSWORD;
    const hasValidEmail =
      hasEmail && import.meta.env.VITE_SHIPROCKET_EMAIL !== "demo@example.com";

    return {
      hasEmail,
      hasPassword,
      hasValidEmail,
      isConfigured: hasEmail && hasPassword && hasValidEmail,
    };
  };

  const envStatus = getEnvironmentStatus();

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        width: isExpanded ? "500px" : "300px",
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 9999,
        maxHeight: isExpanded ? "80vh" : "400px",
        overflow: "hidden",
        fontSize: "14px",
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#f8f9fa",
          padding: "12px 15px",
          borderBottom: "1px solid #dee2e6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "16px" }}>🚀 Shiprocket Debug</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      <div style={{ padding: "15px" }}>
        {/* Environment Status */}
        <div style={{ marginBottom: "15px", fontSize: "12px" }}>
          <div
            style={{
              background: envStatus.isConfigured ? "#d4edda" : "#f8d7da",
              padding: "8px",
              borderRadius: "4px",
              color: envStatus.isConfigured ? "#155724" : "#721c24",
            }}
          >
            <strong>🔧 Configuration:</strong>
            <div>
              Environment: {process.env.NODE_ENV}
              {envStatus.isConfigured ? " ✅" : " ⚠️"}
            </div>
            <div>
              User: {user ? "✅ Authenticated" : "❌ Not authenticated"}
            </div>
            <div>Cart items: {cart?.items.length || 0}</div>
            <div>
              Credentials:{" "}
              {envStatus.isConfigured ? "✅ Set" : "❌ Not configured"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <button
            onClick={testConnection}
            disabled={testing}
            style={{
              padding: "8px 12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: "12px",
              opacity: testing ? 0.6 : 1,
            }}
          >
            🔌 Test API
          </button>
          <button
            onClick={testOrderCreation}
            disabled={testing}
            style={{
              padding: "8px 12px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: "12px",
              opacity: testing ? 0.6 : 1,
            }}
          >
            📦 Test Order
          </button>
          <button
            onClick={testCheckout}
            disabled={testing}
            style={{
              padding: "8px 12px",
              background: "#fd7e14",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: "12px",
              opacity: testing ? 0.6 : 1,
            }}
          >
            🛒 Test Checkout
          </button>
          {cart && cart.items.length > 0 && (
            <button
              onClick={testWithRealCart}
              disabled={testing}
              style={{
                padding: "8px 12px",
                background: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: testing ? "not-allowed" : "pointer",
                fontSize: "12px",
                opacity: testing ? 0.6 : 1,
              }}
            >
              🛍️ Real Cart
            </button>
          )}
          <button
            onClick={clearLogs}
            disabled={testing}
            style={{
              padding: "8px 12px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: testing ? "not-allowed" : "pointer",
              fontSize: "12px",
              opacity: testing ? 0.6 : 1,
            }}
          >
            🗑️ Clear
          </button>
        </div>

        {/* Logs */}
        <div
          style={{
            background: "#f8f9fa",
            padding: "12px",
            fontSize: "11px",
            fontFamily: "monospace",
            maxHeight: isExpanded ? "400px" : "200px",
            overflow: "auto",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            lineHeight: "1.4",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              paddingBottom: "4px",
              borderBottom: "1px solid #dee2e6",
            }}
          >
            <strong>📝 Debug Logs</strong>
            <span style={{ color: "#6c757d" }}>{logs.length} entries</span>
          </div>
          {logs.length === 0 ? (
            <div style={{ color: "#6c757d", fontStyle: "italic" }}>
              No logs yet... Click a test button to get started! 🚀
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                style={{
                  margin: "4px 0",
                  padding: "2px 0",
                  borderBottom:
                    index < logs.length - 1 ? "1px solid #e9ecef" : "none",
                }}
              >
                {log}
              </div>
            ))
          )}
        </div>

        {/* Configuration Help */}
        {!envStatus.isConfigured && isExpanded && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            <strong>⚙️ Setup Required:</strong>
            <div style={{ marginTop: "8px" }}>
              Add these to your <code>.env</code> file:
            </div>
            <pre
              style={{
                background: "#f8f9fa",
                padding: "8px",
                borderRadius: "4px",
                fontSize: "11px",
                margin: "8px 0 0 0",
              }}
            >
              VITE_SHIPROCKET_EMAIL=your_email@example.com{"\n"}
              VITE_SHIPROCKET_PASSWORD=your_password
            </pre>
          </div>
        )}

        {/* Loading Overlay */}
        {testing && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "8px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              🔄 Testing...
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "normal",
                  marginTop: "4px",
                }}
              >
                Please wait...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiprocketDebug;
