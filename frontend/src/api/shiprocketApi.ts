// src/api/shiprocketApi.ts
import axios from "axios";

interface ShiprocketAuth {
  token: string;
  expiresAt: number;
}

interface ShippingRate {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  estimated_delivery_days: string;
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
    email: import.meta.env.VITE_SHIPROCKET_EMAIL || "",
    password: import.meta.env.VITE_SHIPROCKET_PASSWORD || "",
  };

  constructor() {
    // Load auth from localStorage if available
    const savedAuth = localStorage.getItem("shiprocket_auth");
    if (savedAuth) {
      this.auth = JSON.parse(savedAuth);
    }
  }

  // Authenticate with Shiprocket
  private async authenticate(): Promise<void> {
    try {
      // Check if we have valid auth
      if (this.auth && this.auth.expiresAt > Date.now()) {
        return;
      }

      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: this.credentials.email,
        password: this.credentials.password,
      });

      this.auth = {
        token: response.data.token,
        expiresAt: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days
      };

      // Save auth to localStorage
      localStorage.setItem("shiprocket_auth", JSON.stringify(this.auth));
    } catch (error) {
      console.error("Shiprocket authentication failed:", error);
      throw new Error("Failed to authenticate with Shiprocket");
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

  // Check serviceability for a pincode
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    cod: boolean = false,
    weight: number = 0.5
  ) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.baseUrl}/courier/serviceability`,
        {
          headers,
          params: {
            pickup_postcode: pickupPincode,
            delivery_postcode: deliveryPincode,
            cod: cod ? 1 : 0,
            weight: weight,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Serviceability check failed:", error);
      throw error;
    }
  }

  private calculateOrderWeight(
    items: Array<{ name: string; sku: string; units: number }>
  ): number {
    let totalWeight = 0;

    // Extract weight from product name if it contains weight information
    for (const item of items) {
      // Extract weight from product name (assuming format like "Product Name XX GM/KG")
      const weightMatch = item.name.match(/(\d+)\s*(GM|KG|g|kg)/i);

      if (weightMatch) {
        const value = parseFloat(weightMatch[1]);
        const unit = weightMatch[2].toLowerCase();

        // Convert to kg
        const weightInKg =
          unit === "kg" || unit === "KG" ? value : value / 1000; // Convert grams to kg

        // Multiply by quantity
        totalWeight += weightInKg * item.units;
      } else {
        // Default weight per item if not specified (100g)
        totalWeight += 0.1 * item.units;
      }
    }

    // Ensure minimum weight of 0.5kg for shipping calculation
    return Math.max(totalWeight, 0.5);
  }

  // Get shipping rates
  // Update the getShippingRates method to use more accurate weight calculation
  async getShippingRates(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    cod: boolean = false,
    declaredValue: number
  ): Promise<ShippingRate[]> {
    try {
      // Safety check for weight - cap at 10kg
      if (weight > 10) {
        console.warn(
          `Weight exceeds 10kg (${weight}kg). Capping at 10kg to prevent overcharging.`
        );
        weight = 10;
      }

      // Ensure minimum weight
      weight = Math.max(weight, 0.5);

      const serviceability = await this.checkServiceability(
        pickupPincode,
        deliveryPincode,
        cod,
        weight
      );

      if (
        !serviceability.data ||
        !serviceability.data.available_courier_companies
      ) {
        throw new Error("No courier services available for this route");
      }

      // Filter and format available couriers
      const shippingRates: ShippingRate[] =
        serviceability.data.available_courier_companies
          .map((courier: any) => ({
            courier_company_id: courier.courier_company_id,
            courier_name: courier.courier_name,
            rate: courier.rate,
            etd: courier.etd,
            estimated_delivery_days: courier.estimated_delivery_days,
          }))
          .sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate);

      return shippingRates;
    } catch (error) {
      console.error("Failed to get shipping rates:", error);
      throw error;
    }
  }

  // Then modify the createOrder method to use this calculated weight
  async createOrder(orderData: CreateOrderRequest) {
    try {
      const headers = await this.getHeaders();

      // Calculate actual weight from items if not explicitly set
      if (!orderData.weight || orderData.weight > 10) {
        orderData.weight = this.calculateOrderWeight(orderData.order_items);
      }

      // Cap weight at 10kg as a safety measure to prevent overcharging
      orderData.weight = Math.min(orderData.weight, 10);

      const response = await axios.post(
        `${this.baseUrl}/orders/create/adhoc`,
        orderData,
        { headers }
      );

      if (!response.data || !response.data.order_id) {
        throw new Error("Failed to create order in Shiprocket");
      }

      return {
        shiprocketOrderId: response.data.order_id,
        shipmentId: response.data.shipment_id,
        status: response.data.status,
        awbCode: response.data.awb_code,
      };
    } catch (error: any) {
      console.error("Failed to create Shiprocket order:", error);

      if (error.response && error.response.data) {
        const errorMessage =
          error.response.data.message ||
          JSON.stringify(error.response.data.errors) ||
          "Unknown error occurred";
        throw new Error(`Shiprocket error: ${errorMessage}`);
      }

      throw error;
    }
  }

  // Add this to shiprocketApi.ts to improve error handling:

  async launchShiprocketCheckout(orderData: CreateOrderRequest) {
    try {
      console.log(
        "Launching Shiprocket checkout with order data:",
        JSON.stringify(orderData)
      );

      // First authenticate explicitly to ensure we have a valid token
      await this.authenticate();
      console.log("Successfully authenticated with Shiprocket");

      // Create the order
      const orderResult = await this.createOrder(orderData);
      console.log("Shiprocket order created successfully:", orderResult);

      // Then launch the Shiprocket checkout window
      const checkoutUrl = `https://shiprocket.co/checkout/${orderResult.shiprocketOrderId}`;
      console.log("Opening Shiprocket checkout URL:", checkoutUrl);

      // Open in a new window
      const newWindow = window.open(checkoutUrl, "_blank");

      // Check if window was successfully opened
      if (!newWindow) {
        throw new Error(
          "Failed to open checkout window. Please check if pop-up blockers are disabled."
        );
      }

      return orderResult;
    } catch (error: any) {
      console.error("Detailed error launching Shiprocket checkout:", error);

      // Extract more specific error message if available
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      throw new Error(`Shiprocket checkout failed: ${errorMessage}`);
    }
  }

  // Generate AWB (Airway Bill) for shipment
  async generateAWB(shipmentId: number, courierCompanyId: number) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseUrl}/courier/assign/awb`,
        {
          shipment_id: shipmentId,
          courier_id: courierCompanyId,
        },
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error("Failed to generate AWB:", error);
      throw error;
    }
  }

  // Schedule pickup
  async schedulePickup(shipmentId: number, pickupDate: string) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseUrl}/courier/generate/pickup`,
        {
          shipment_id: [shipmentId],
          pickup_date: pickupDate,
        },
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error("Failed to schedule pickup:", error);
      throw error;
    }
  }

  // Track shipment
  async trackShipment(awbCode: string) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.baseUrl}/courier/track/awb/${awbCode}`,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error("Failed to track shipment:", error);
      throw error;
    }
  }

  // Cancel shipment
  async cancelShipment(awbCode: string) {
    try {
      const headers = await this.getHeaders();

      const response = await axios.post(
        `${this.baseUrl}/orders/cancel`,
        { ids: [awbCode] },
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error("Failed to cancel shipment:", error);
      throw error;
    }
  }

  // Get pickup locations
  async getPickupLocations() {
    try {
      const headers = await this.getHeaders();

      const response = await axios.get(
        `${this.baseUrl}/settings/company/pickup`,
        { headers }
      );

      return response.data.data || [];
    } catch (error) {
      console.error("Failed to get pickup locations:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const shiprocketApi = new ShiprocketApiClient();

export default shiprocketApi;
