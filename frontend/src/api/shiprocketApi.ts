// src/api/shiprocketApi.ts
import axios from "axios";

interface ShiprocketAuth {
  token: string;
  expiresAt: number;
}

interface CreateOrderRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

class ShiprocketApiClient {
  private baseUrl = "https://apiv2.shiprocket.in/v1/external";
  private auth: ShiprocketAuth | null = null;

  // Shiprocket credentials - should be in environment variables
  private credentials = {
    email: import.meta.env.VITE_SHIPROCKET_EMAIL || "demo@example.com",
    password: import.meta.env.VITE_SHIPROCKET_PASSWORD || "demo123",
  };

  constructor() {
    // Load auth from localStorage if available
    const savedAuth = localStorage.getItem("shiprocket_auth");
    if (savedAuth) {
      try {
        this.auth = JSON.parse(savedAuth);
      } catch (e) {
        localStorage.removeItem("shiprocket_auth");
      }
    }
  }

  // Authenticate with Shiprocket
  private async authenticate(): Promise<void> {
    try {
      // Check if we have valid auth
      if (this.auth && this.auth.expiresAt > Date.now()) {
        return;
      }

      console.log("Authenticating with Shiprocket...");

      // Clear old auth
      this.auth = null;
      localStorage.removeItem("shiprocket_auth");

      const response = await axios.post(
        `${this.baseUrl}/auth/login`,
        {
          email: this.credentials.email,
          password: this.credentials.password,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Auth response:", response.data);

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from Shiprocket auth API");
      }

      this.auth = {
        token: response.data.token,
        expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days
      };

      // Save auth to localStorage
      localStorage.setItem("shiprocket_auth", JSON.stringify(this.auth));
      console.log("Successfully authenticated with Shiprocket");
    } catch (error: any) {
      console.error("Shiprocket authentication failed:", error);
      this.auth = null;
      localStorage.removeItem("shiprocket_auth");

      if (error.response?.data) {
        console.error("Auth error details:", error.response.data);

        if (error.response.status === 401) {
          throw new Error("Invalid Shiprocket credentials");
        } else if (error.response.status === 429) {
          throw new Error(
            "Too many authentication attempts. Please try again later."
          );
        }
      }

      if (
        error.code === "ECONNREFUSED" ||
        error.message.includes("Network Error")
      ) {
        throw new Error(
          "Cannot connect to Shiprocket API. Please check your internet connection."
        );
      }

      throw new Error(
        `Failed to authenticate with Shiprocket: ${error.message}`
      );
    }
  }

  // Get headers with auth token
  private async getHeaders() {
    await this.authenticate();

    if (!this.auth) {
      throw new Error("Not authenticated with Shiprocket");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.auth.token}`,
    };
  }

  // Create order with proper validation
  async createOrder(orderData: CreateOrderRequest) {
    try {
      console.log("Creating Shiprocket order...");

      // Validate required fields
      if (
        !orderData.billing_customer_name ||
        !orderData.billing_address ||
        !orderData.billing_city ||
        !orderData.billing_pincode ||
        !orderData.billing_state ||
        !orderData.billing_email ||
        !orderData.billing_phone
      ) {
        throw new Error("Missing required billing information");
      }

      if (!orderData.order_items || orderData.order_items.length === 0) {
        throw new Error("Order must contain at least one item");
      }

      const headers = await this.getHeaders();

      // Ensure all required fields are set with proper values
      const completeOrderData = {
        ...orderData,
        // Ensure pickup location is set
        pickup_location: orderData.pickup_location || "Primary",
        // Ensure payment method is valid
        payment_method: orderData.payment_method || "Prepaid",
        // Set shipping same as billing if not explicitly set
        shipping_is_billing: orderData.shipping_is_billing !== false,
        // Ensure dimensions are set
        length: orderData.length || 10,
        breadth: orderData.breadth || 10,
        height: orderData.height || 10,
        weight: Math.max(orderData.weight || 0.5, 0.5), // Minimum 0.5kg
        // Ensure proper date format
        order_date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
      };

      console.log(
        "Sending order data to Shiprocket:",
        JSON.stringify(completeOrderData, null, 2)
      );

      const response = await axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        completeOrderData,
        {
          headers,
          timeout: 30000,
        }
      );

      console.log("Shiprocket order response:", response.data);

      if (!response.data) {
        throw new Error("Empty response from Shiprocket API");
      }

      // Check for API errors in response
      if (response.data.status_code && response.data.status_code !== 200) {
        const errorMessage =
          response.data.message || response.data.error || "Unknown API error";
        throw new Error(`Shiprocket API error: ${errorMessage}`);
      }

      // Handle different response formats
      let orderId = response.data.order_id;
      let shipmentId = response.data.shipment_id;

      // Sometimes the response might be nested
      if (!orderId && response.data.data) {
        orderId = response.data.data.order_id;
        shipmentId = response.data.data.shipment_id;
      }

      // Additional fallback for different response structures
      if (!orderId) {
        // Try to find order_id in any nested structure
        const searchForOrderId = (obj: any): string | null => {
          if (typeof obj !== "object" || obj === null) return null;

          for (const key in obj) {
            if (key === "order_id" && obj[key]) {
              return obj[key];
            }
            if (typeof obj[key] === "object") {
              const found = searchForOrderId(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };

        orderId = searchForOrderId(response.data);
      }

      if (!orderId) {
        console.error("No order ID in response:", response.data);
        throw new Error(
          "Order creation failed - no order ID received from Shiprocket"
        );
      }

      return {
        shiprocketOrderId: orderId,
        shipmentId: shipmentId,
        status: response.data.status || response.data.data?.status || "created",
        awbCode: response.data.awb_code || response.data.data?.awb_code,
        channelOrderId:
          response.data.channel_order_id ||
          response.data.data?.channel_order_id,
        rawResponse: response.data, // Keep full response for debugging
      };
    } catch (error: any) {
      console.error("Failed to create Shiprocket order:", error);

      if (error.response?.data) {
        console.error("Shiprocket API error details:", error.response.data);

        // Extract specific error messages
        if (error.response.data.errors) {
          const errorMessages = Object.values(
            error.response.data.errors
          ).flat();
          throw new Error(`Shiprocket API error: ${errorMessages.join(", ")}`);
        }

        if (error.response.data.message) {
          throw new Error(
            `Shiprocket API error: ${error.response.data.message}`
          );
        }

        if (error.response.status === 401) {
          // Clear auth and retry once
          this.auth = null;
          localStorage.removeItem("shiprocket_auth");
          throw new Error("Authentication failed. Please try again.");
        }
      }

      if (error.message.includes("timeout")) {
        throw new Error("Request timeout - please try again");
      }

      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Launch Shiprocket one-click checkout
  async launchShiprocketCheckout(orderData: CreateOrderRequest) {
    try {
      console.log("Launching Shiprocket one-click checkout...");

      // In development, use mock checkout
      if (
        process.env.NODE_ENV === "development" &&
        (!this.credentials.email ||
          this.credentials.email === "demo@example.com")
      ) {
        console.log("Using mock checkout in development mode");
        return this.launchMockCheckout(orderData);
      }

      // First create the order
      const orderResult = await this.createOrder(orderData);
      console.log("Order created successfully:", orderResult);

      if (!orderResult.shiprocketOrderId) {
        throw new Error("Order creation failed - no order ID received");
      }

      // Use different checkout approaches
      try {
        // Try method 1: Direct Shiprocket checkout URL
        const checkoutUrl = `https://ship.shiprocket.co/checkout/${orderResult.shiprocketOrderId}`;
        console.log("Opening Shiprocket checkout URL:", checkoutUrl);

        const checkoutWindow = window.open(
          checkoutUrl,
          "_blank",
          "width=1000,height=700,scrollbars=yes,resizable=yes,location=yes,status=yes"
        );

        if (!checkoutWindow) {
          throw new Error(
            "Failed to open checkout window. Please disable pop-up blockers and try again."
          );
        }

        // Optional: Listen for window close event
        const checkInterval = setInterval(() => {
          if (checkoutWindow.closed) {
            clearInterval(checkInterval);
            console.log("Checkout window closed");
            // You can add callback here to refresh order status
          }
        }, 1000);

        return {
          ...orderResult,
          checkoutUrl,
          checkoutWindow,
        };
      } catch (checkoutError) {
        console.warn(
          "Primary checkout method failed, trying alternative:",
          checkoutError
        );

        // Fallback: Use hosted form with order details
        return this.launchHostedCheckout(orderData);
      }
    } catch (error: any) {
      console.error("Failed to launch Shiprocket checkout:", error);

      // In development, fallback to mock
      if (process.env.NODE_ENV === "development") {
        console.log("Falling back to mock checkout");
        return this.launchMockCheckout(orderData);
      }

      throw new Error(`Checkout failed: ${error.message}`);
    }
  }

  // Mock checkout for development
  private async launchMockCheckout(orderData: CreateOrderRequest) {
    console.log("Launching mock checkout for development");

    // Create a mock order result
    const mockOrderId = `mock_${Date.now()}`;

    // Create a simple payment form
    const mockCheckoutHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mock Checkout - Development Mode</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .order-details { background: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
          .btn { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
          .btn:hover { background: #0056b3; }
          .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚀 Mock Checkout</h2>
            <p>Development Mode - No real payment processed</p>
          </div>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${mockOrderId}</p>
            <p><strong>Customer:</strong> ${orderData.billing_customer_name}</p>
            <p><strong>Total:</strong> ₹${orderData.sub_total}</p>
            <p><strong>Items:</strong> ${orderData.order_items.length} item(s)</p>
          </div>
          
          <button class="btn" onclick="processPayment()">Process Mock Payment</button>
          
          <div id="result" style="display: none;" class="success">
            <h4>✅ Payment Successful!</h4>
            <p>Order has been placed successfully.</p>
            <p>This is a mock transaction for development purposes.</p>
            <button class="btn" onclick="window.close()" style="margin-top: 10px;">Close Window</button>
          </div>
        </div>
        
        <script>
          function processPayment() {
            document.getElementById('result').style.display = 'block';
            // Simulate payment processing
            setTimeout(() => {
              if (window.opener) {
                window.opener.postMessage({ type: 'PAYMENT_SUCCESS', orderId: '${mockOrderId}' }, '*');
              }
            }, 1000);
          }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([mockCheckoutHtml], { type: "text/html" });
    const checkoutUrl = URL.createObjectURL(blob);

    const checkoutWindow = window.open(
      checkoutUrl,
      "_blank",
      "width=600,height=500,scrollbars=yes,resizable=yes"
    );

    if (!checkoutWindow) {
      throw new Error(
        "Failed to open checkout window. Please disable pop-up blockers and try again."
      );
    }

    return {
      shiprocketOrderId: mockOrderId,
      shipmentId: `mock_shipment_${Date.now()}`,
      status: "mock_created",
      checkoutUrl,
      checkoutWindow,
    };
  }

  // Simplified checkout that redirects to Shiprocket's hosted form
  async launchHostedCheckout(orderData: CreateOrderRequest) {
    try {
      console.log("Launching Shiprocket hosted checkout...");

      // Encode order data as URL parameters for hosted checkout
      const params = new URLSearchParams({
        // Customer details
        billing_customer_name: orderData.billing_customer_name,
        billing_address: orderData.billing_address,
        billing_city: orderData.billing_city,
        billing_pincode: orderData.billing_pincode,
        billing_state: orderData.billing_state,
        billing_country: orderData.billing_country,
        billing_email: orderData.billing_email,
        billing_phone: orderData.billing_phone,
        // Order details
        order_id: orderData.order_id,
        sub_total: orderData.sub_total.toString(),
        weight: orderData.weight.toString(),
        length: orderData.length.toString(),
        breadth: orderData.breadth.toString(),
        height: orderData.height.toString(),
        // Items (simplified - first item only for demo)
        item_name: orderData.order_items[0]?.name || "Product",
        item_quantity: orderData.order_items[0]?.units.toString() || "1",
        item_price: orderData.order_items[0]?.selling_price.toString() || "0",
      });

      // Use a generic payment form approach
      const checkoutUrl = `https://shiprocket.co/checkout?${params.toString()}`;

      console.log("Opening hosted checkout:", checkoutUrl);

      // Open checkout in new window
      const checkoutWindow = window.open(
        checkoutUrl,
        "_blank",
        "width=1000,height=700,scrollbars=yes,resizable=yes"
      );

      if (!checkoutWindow) {
        throw new Error(
          "Failed to open checkout window. Please disable pop-up blockers."
        );
      }

      return {
        checkoutUrl,
        checkoutWindow,
        orderId: orderData.order_id,
      };
    } catch (error: any) {
      console.error("Hosted checkout failed:", error);
      throw new Error(`Hosted checkout failed: ${error.message}`);
    }
  }

  // Debug method to test API connectivity
  async testConnection() {
    try {
      console.log("Testing Shiprocket API connection...");
      console.log("Using credentials:", {
        email: this.credentials.email,
        hasPassword: !!this.credentials.password,
      });

      // Test authentication first
      await this.authenticate();

      const headers = await this.getHeaders();

      // Test with a simple API call
      const response = await axios.get(
        `${this.baseUrl}/settings/company/pickup`,
        {
          headers,
          timeout: 10000,
        }
      );

      console.log("API connection test successful:", response.data);
      return true;
    } catch (error: any) {
      console.error("API connection test failed:", error);
      if (error.response?.data) {
        console.error("Error details:", error.response.data);
      }
      return false;
    }
  }
}

// Export singleton instance
export const shiprocketApi = new ShiprocketApiClient();

export default shiprocketApi;
