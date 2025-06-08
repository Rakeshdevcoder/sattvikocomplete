// src/api/cartApi.ts
import axios from "axios";

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  weight?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    appliedAt: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

// Class for managing cart through backend API
export class CartApiClient {
  private baseUrl: string;
  private cartId: string = "";
  private isAuthenticated: boolean = false;

  constructor() {
    this.baseUrl = "http://localhost:8083";
    console.log("Cart API initialized with baseUrl:", this.baseUrl);
  }

  // Set auth token for authenticated requests
  setAuthToken(token: string | null) {
    this.isAuthenticated = !!token;
  }

  // Get headers for requests
  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add user session header if authenticated
    if (this.isAuthenticated) {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        headers["X-User-Id"] = userData.id;
        headers["X-User-Phone"] = userData.phone;
      }
    }

    return headers;
  }

  // Create a new cart
  async createCart(): Promise<Cart> {
    try {
      console.log("Creating new cart...");
      const response = await axios.post(
        `${this.baseUrl}/carts`,
        {}, // Empty request body
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      console.log("Cart created successfully:", response.data);
      this.cartId = response.data.id;
      localStorage.setItem("cartId", this.cartId);

      return response.data;
    } catch (error: any) {
      console.error("Error creating cart:", error);

      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }

      // Create a fallback cart for development
      if (process.env.NODE_ENV === "development") {
        console.log("Creating fallback cart for development");
        const fallbackCart = this.createFallbackCart();
        return fallbackCart;
      }

      throw error;
    }
  }

  // Get cart - either user cart or cart by ID
  async getCart(): Promise<Cart> {
    try {
      console.log("Getting cart...");

      this.cartId = localStorage.getItem("cartId") || "";
      console.log("Cart ID from localStorage:", this.cartId);

      // If no cart ID in storage, create new cart
      if (!this.cartId) {
        console.log("No cart ID found, creating new cart");
        return this.createCart();
      }

      // Get existing cart
      console.log(`Fetching cart with ID: ${this.cartId}`);
      const response = await axios.get(`${this.baseUrl}/carts/${this.cartId}`, {
        headers: this.getHeaders(),
        timeout: 5000,
      });

      console.log("Cart fetched successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error getting cart:", error);

      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      // If cart not found or expired, create a new one
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 404 || error.response?.status === 410)
      ) {
        console.log("Cart not found or expired, creating new cart");
        return this.createCart();
      }

      // Create a fallback cart for development
      if (process.env.NODE_ENV === "development") {
        console.log("Creating fallback cart for development");
        const fallbackCart = this.createFallbackCart();
        return fallbackCart;
      }

      throw error;
    }
  }

  // Add item to cart
  async addToCart(product: any, quantity: number = 1): Promise<Cart> {
    try {
      console.log("Adding to cart:", product, "quantity:", quantity);

      // Ensure we have a cart ID
      if (!this.cartId) {
        console.log("No cart ID found, getting cart");
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      // Format the price as a number
      let price = 0;
      if (typeof product.price === "string") {
        const priceStr = product.price.replace(/[^0-9.]/g, "");
        price = parseFloat(priceStr) || 0;
      } else if (typeof product.price === "number") {
        price = product.price;
      }

      // Create a minimal payload for the cart service
      const payload = {
        productId: product.id,
        title: product.title || "Unknown Product",
        description: product.description || "",
        price: price,
        quantity: quantity,
        weight: product.weight || "",
        image: this.getImageUrl(product),
      };

      console.log("Payload for cart service:", payload);
      console.log(
        `Sending request to: ${this.baseUrl}/carts/${this.cartId}/items`
      );

      const response = await axios.post(
        `${this.baseUrl}/carts/${this.cartId}/items`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      console.log("Item added successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error adding item to cart:", error);

      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }

      // If using fallback cart in development, add item to it
      if (process.env.NODE_ENV === "development") {
        console.log("Using fallback cart in development");
        const fallbackCart = await this.getFallbackCart();

        // Add the item to the fallback cart
        const newItem: CartItem = {
          id: `item_${Date.now()}`,
          productId: product.id,
          title: product.title || "Unknown Product",
          price:
            typeof product.price === "string"
              ? parseFloat(product.price.replace(/[^0-9.]/g, ""))
              : product.price || 0,
          quantity: quantity,
          image: this.getImageUrl(product),
          weight: product.weight || "",
        };

        fallbackCart.items.push(newItem);

        // Update totals
        this.updateFallbackCartTotals(fallbackCart);

        // Save to localStorage
        localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));

        return fallbackCart;
      }

      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    try {
      if (!this.cartId) {
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      const response = await axios.put(
        `${this.baseUrl}/carts/${this.cartId}/items/${itemId}`,
        { quantity },
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error updating cart item:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        const fallbackCart = await this.getFallbackCart();
        const itemIndex = fallbackCart.items.findIndex(
          (item) => item.id === itemId
        );

        if (itemIndex !== -1) {
          fallbackCart.items[itemIndex].quantity = quantity;
          this.updateFallbackCartTotals(fallbackCart);
          localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));
        }

        return fallbackCart;
      }

      throw error;
    }
  }

  // Remove item from cart
  async removeCartItem(itemId: string): Promise<Cart> {
    try {
      if (!this.cartId) {
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      const response = await axios.delete(
        `${this.baseUrl}/carts/${this.cartId}/items/${itemId}`,
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error removing cart item:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        const fallbackCart = await this.getFallbackCart();
        fallbackCart.items = fallbackCart.items.filter(
          (item) => item.id !== itemId
        );
        this.updateFallbackCartTotals(fallbackCart);
        localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));
        return fallbackCart;
      }

      throw error;
    }
  }

  // Clear cart
  async clearCart(): Promise<Cart> {
    try {
      if (!this.cartId) {
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      const response = await axios.delete(
        `${this.baseUrl}/carts/${this.cartId}/items`,
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error clearing cart:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        const fallbackCart = this.createFallbackCart();
        localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));
        return fallbackCart;
      }

      throw error;
    }
  }

  // Apply coupon to cart
  async applyCoupon(code: string): Promise<Cart> {
    try {
      console.log(`Applying coupon ${code} to cart...`);

      if (!this.cartId) {
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      const response = await axios.post(
        `${this.baseUrl}/carts/${this.cartId}/coupon`,
        { code },
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      console.log("Coupon applied successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error applying coupon:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        const fallbackCart = await this.getFallbackCart();

        // Apply a mock discount
        fallbackCart.coupon = {
          code: code,
          discountType: "percentage",
          discountValue: 10, // 10% discount
          appliedAt: new Date().toISOString(),
        };

        // Recalculate totals with the coupon
        this.updateFallbackCartTotals(fallbackCart);
        localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));

        return fallbackCart;
      }

      throw error;
    }
  }

  // Remove coupon from cart
  async removeCoupon(): Promise<Cart> {
    try {
      console.log("Removing coupon from cart...");

      if (!this.cartId) {
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      const response = await axios.delete(
        `${this.baseUrl}/carts/${this.cartId}/coupon`,
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      console.log("Coupon removed successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error removing coupon:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        const fallbackCart = await this.getFallbackCart();

        // Remove the coupon
        fallbackCart.coupon = undefined;

        // Recalculate totals without the coupon
        this.updateFallbackCartTotals(fallbackCart);
        localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));

        return fallbackCart;
      }

      throw error;
    }
  }

  // Checkout cart
  async checkoutCart(): Promise<Cart> {
    try {
      console.log("Checking out cart...");

      if (!this.cartId) {
        const cart = await this.getCart();
        this.cartId = cart.id;
      }

      const response = await axios.post(
        `${this.baseUrl}/carts/${this.cartId}/checkout`,
        {},
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      console.log("Checkout successful:", response.data);

      // After successful checkout, remove cart ID from storage
      localStorage.removeItem("cartId");
      this.cartId = "";

      return response.data;
    } catch (error: any) {
      console.error("Error checking out cart:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        const fallbackCart = await this.getFallbackCart();

        // Update cart status to completed
        fallbackCart.status = "completed";
        fallbackCart.updatedAt = new Date().toISOString();

        // Save to localStorage (for reference)
        localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));

        // Remove cart ID from storage
        localStorage.removeItem("cartId");
        this.cartId = "";

        return fallbackCart;
      }

      throw error;
    }
  }

  // Merge guest cart into user cart after login
  async mergeGuestCart(guestCartId: string): Promise<Cart> {
    try {
      console.log(`Merging guest cart ${guestCartId} into user cart...`);

      if (!this.isAuthenticated) {
        throw new Error("User must be authenticated to merge carts");
      }

      // Get user cart first
      const userCart = await this.getCart();

      const response = await axios.post(
        `${this.baseUrl}/carts/${userCart.id}/merge`,
        { guestCartId },
        {
          headers: this.getHeaders(),
          timeout: 5000,
        }
      );

      console.log("Cart merge successful:", response.data);

      // Remove the guest cart ID from storage
      localStorage.removeItem("cartId");
      this.cartId = userCart.id;

      return response.data;
    } catch (error: any) {
      console.error("Error merging carts:", error);

      // If using fallback cart in development
      if (process.env.NODE_ENV === "development") {
        // For fallback, just return the current cart as if it's already merged
        const fallbackCart = await this.getFallbackCart();
        return fallbackCart;
      }

      throw error;
    }
  }

  // Helper function to extract the correct image URL
  private getImageUrl(product: any): string {
    if (!product.image && !product.images) {
      return "https://via.placeholder.com/150";
    }

    if (typeof product.image === "string") {
      return product.image;
    }

    if (product.images) {
      // Check for object with main property
      if (typeof product.images === "object" && product.images.main) {
        return product.images.main;
      }
      // Check for array of images
      if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images[0];
      }
      // Handle case where images is a string
      if (typeof product.images === "string") {
        return product.images;
      }
    }

    return "https://via.placeholder.com/150";
  }

  // Create a fallback cart for development use when backend is unavailable
  private createFallbackCart(): Cart {
    const fallbackCart: Cart = {
      id: `fallback_${Date.now()}`,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      shippingCost: 0,
      totalAmount: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    localStorage.setItem("fallbackCart", JSON.stringify(fallbackCart));
    return fallbackCart;
  }

  // Get fallback cart from localStorage or create new one
  private async getFallbackCart(): Promise<Cart> {
    const fallbackCartStr = localStorage.getItem("fallbackCart");
    if (fallbackCartStr) {
      return JSON.parse(fallbackCartStr);
    }
    return this.createFallbackCart();
  }

  // Update totals for fallback cart
  private updateFallbackCartTotals(cart: Cart): void {
    // Calculate subtotal
    cart.subtotal = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Apply coupon if present
    let discountedSubtotal = cart.subtotal;
    if (cart.coupon) {
      if (cart.coupon.discountType === "percentage") {
        const discountAmount =
          (cart.coupon.discountValue / 100) * cart.subtotal;
        discountedSubtotal = cart.subtotal - discountAmount;
      } else if (cart.coupon.discountType === "fixed") {
        discountedSubtotal = Math.max(
          0,
          cart.subtotal - cart.coupon.discountValue
        );
      }
    }

    // Calculate tax (18%)
    cart.taxAmount = discountedSubtotal * 0.18;

    // Free shipping for orders over 299
    cart.shippingCost = discountedSubtotal > 299 ? 0 : 40;

    // Calculate total
    cart.totalAmount = discountedSubtotal + cart.taxAmount + cart.shippingCost;

    // Update timestamp
    cart.updatedAt = new Date().toISOString();
  }
}

// Create and export a singleton instance
export const cartApi = new CartApiClient();

export default cartApi;
