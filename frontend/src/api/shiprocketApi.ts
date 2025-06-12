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

  private credentials = {
    email: import.meta.env.VITE_SHIPROCKET_EMAIL,
    password: import.meta.env.VITE_SHIPROCKET_PASSWORD,
  };

  constructor() {
    const savedAuth = localStorage.getItem("shiprocket_auth");
    if (savedAuth) {
      try {
        this.auth = JSON.parse(savedAuth);
      } catch (e) {
        localStorage.removeItem("shiprocket_auth");
      }
    }
  }

  private async authenticate(): Promise<void> {
    try {
      if (this.auth && this.auth.expiresAt > Date.now()) {
        return;
      }

      console.log("Authenticating with Shiprocket...");

      this.auth = null;
      localStorage.removeItem("shiprocket_auth");

      const response = await axios.post(
        `${this.baseUrl}/auth/login`,
        {
          email: this.credentials.email,
          password: this.credentials.password,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from Shiprocket auth API");
      }

      this.auth = {
        token: response.data.token,
        expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days
      };

      localStorage.setItem("shiprocket_auth", JSON.stringify(this.auth));
      console.log("Successfully authenticated with Shiprocket");
    } catch (error: any) {
      console.error("Shiprocket authentication failed:", error);
      this.auth = null;
      localStorage.removeItem("shiprocket_auth");

      if (error.response?.data) {
        console.error("Auth error details:", error.response.data);
      }

      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

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

  async createOrder(orderData: CreateOrderRequest) {
    try {
      console.log("Creating Shiprocket order...");

      const headers = await this.getHeaders();

      const completeOrderData = {
        ...orderData,
        pickup_location: orderData.pickup_location || "Primary",
        payment_method: "Prepaid",
        shipping_is_billing: true,
        order_date: new Date().toISOString().split("T")[0],
        weight: Math.max(orderData.weight || 0.5, 0.5),
      };

      const response = await axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        completeOrderData,
        {
          headers,
          timeout: 30000,
        }
      );

      if (!response.data) {
        throw new Error("Empty response from Shiprocket API");
      }

      const orderId = response.data.order_id || response.data.data?.order_id;
      if (!orderId) {
        throw new Error("No order ID received from Shiprocket");
      }

      return {
        shiprocketOrderId: orderId,
        shipmentId:
          response.data.shipment_id || response.data.data?.shipment_id,
        status: response.data.status || "created",
        awbCode: response.data.awb_code || response.data.data?.awb_code,
        rawResponse: response.data,
      };
    } catch (error: any) {
      console.error("Failed to create Shiprocket order:", error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async launchShiprocketCheckout(orderData: CreateOrderRequest) {
    try {
      console.log("Launching Shiprocket checkout...");

      // Create the order first
      const orderResult = await this.createOrder(orderData);
      console.log("Order created successfully:", orderResult);

      // Create Shiprocket checkout URL
      const checkoutUrl = `https://ship.shiprocket.co/checkout/${orderResult.shiprocketOrderId}`;

      // Open Shiprocket's checkout page
      const checkoutWindow = window.open(
        checkoutUrl,
        "shiprocket_checkout",
        "width=450,height=700,scrollbars=yes,resizable=yes,location=no,status=no,menubar=no,toolbar=no"
      );

      if (!checkoutWindow) {
        throw new Error(
          "Failed to open checkout window. Please allow pop-ups and try again."
        );
      }

      // Listen for checkout completion
      const checkInterval = setInterval(() => {
        try {
          if (checkoutWindow.closed) {
            clearInterval(checkInterval);
            console.log("Checkout window closed");
            // You can add callback here to refresh order status
            window.location.href = "/order-success";
          }
        } catch (e) {
          // Window might be from different origin, ignore errors
        }
      }, 1000);

      return {
        ...orderResult,
        checkoutUrl,
        checkoutWindow,
      };
    } catch (error: any) {
      console.error("Failed to launch Shiprocket checkout:", error);
      throw new Error(`Checkout failed: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      console.log("Testing Shiprocket API connection...");

      await this.authenticate();
      const headers = await this.getHeaders();

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
      return false;
    }
  }
}

export const shiprocketApi = new ShiprocketApiClient();
export default shiprocketApi;
