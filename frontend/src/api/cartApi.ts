export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string | { main: string } | { main: string; hover: string };
  weight?: string;
  isBundleItem?: boolean;
  bundleId?: string; // For bundle items, reference to the bundle
  originalPrice?: number; // Original price for bundle items
  bundledProducts?: {
    id: string;
    title: string;
    weight?: string;
  }[];
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
}

// Class for managing cart locally using localStorage
export class CartApiClient {
  private CART_STORAGE_KEY = "local-shopping-cart";

  // Get cart from localStorage
  async getCart(): Promise<Cart> {
    try {
      // Check for an existing cart in localStorage
      const cartData = localStorage.getItem(this.CART_STORAGE_KEY);
      if (cartData) {
        return JSON.parse(cartData);
      } else {
        // Create a new cart if none exists
        const newCart = this.createEmptyCart();
        this.saveCart(newCart);
        return newCart;
      }
    } catch (error) {
      console.error("Error getting cart from localStorage:", error);
      const newCart = this.createEmptyCart();
      this.saveCart(newCart);
      return newCart;
    }
  }

  // Add item to cart with support for bundle products
  async addToCart(productObject: any, quantity: number = 1): Promise<Cart> {
    try {
      // Extract product details
      const productId = productObject.id || "";
      const title = productObject.title || "Unknown Product";
      const price = parseFloat(productObject.price) || 0;
      const isBundleItem = productObject.isBundleItem || false;
      const bundleId = productObject.bundleId || "";
      const originalPrice = productObject.originalPrice || price;

      // Get image from product format - improved handling of different image formats
      let image;
      if (productObject.image) {
        // Direct image string
        image = productObject.image;
      } else if (productObject.images) {
        // Handle both object with 'main' property and array formats
        if (
          typeof productObject.images === "object" &&
          productObject.images.main
        ) {
          image = productObject.images.main;
        } else if (
          Array.isArray(productObject.images) &&
          productObject.images.length > 0
        ) {
          image = productObject.images[0];
        }
      }

      // Fallback image if none found
      if (!image) {
        image = "https://via.placeholder.com/150";
      }

      // Get weight if available
      const weight = productObject.weight || "";

      // Get current cart
      const cart = await this.getCart();

      // For bundle items, add them as individual items with a bundle reference
      if (isBundleItem) {
        // Add as new item with bundle reference
        cart.items.push({
          id: `item_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          productId,
          title,
          price,
          quantity,
          image,
          weight,
          isBundleItem,
          bundleId,
          originalPrice,
        });
      } else {
        // Regular product handling
        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
          (item) => item.productId === productId && !item.isBundleItem
        );

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          cart.items[existingItemIndex].quantity = quantity;
        } else {
          // Add as new item
          cart.items.push({
            id: `item_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 9)}`,
            productId,
            title,
            price,
            quantity,
            image,
            weight,
          });
        }
      }

      // Update cart totals
      this.updateCartTotals(cart);

      // Save updated cart
      this.saveCart(cart);

      return cart;
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    try {
      // Get current cart
      const cart = await this.getCart();

      // Find the item
      const itemIndex = cart.items.findIndex((item) => item.id === itemId);
      if (itemIndex === -1) {
        throw new Error(`Item ${itemId} not found in cart`);
      }

      // Update quantity
      cart.items[itemIndex].quantity = quantity;

      // Update totals
      this.updateCartTotals(cart);

      // Save updated cart
      this.saveCart(cart);

      return cart;
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  // Remove item from cart
  async removeCartItem(itemId: string): Promise<Cart> {
    try {
      // Get current cart
      const cart = await this.getCart();

      // Remove the item
      cart.items = cart.items.filter((item) => item.id !== itemId);

      // Update totals
      this.updateCartTotals(cart);

      // Save updated cart
      this.saveCart(cart);

      return cart;
    } catch (error) {
      console.error("Error removing cart item:", error);
      throw error;
    }
  }

  // Clear cart
  async clearCart(): Promise<Cart> {
    try {
      const cart = this.createEmptyCart();
      this.saveCart(cart);
      return cart;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }

  // Private method to save cart to localStorage
  private saveCart(cart: Cart): void {
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cart));
  }

  // Private method to update cart totals
  private updateCartTotals(cart: Cart): void {
    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    cart.subtotal = subtotal;
    cart.totalAmount = subtotal; // In a real app, you might add tax, shipping, etc.
  }

  // Private method to create an empty cart
  private createEmptyCart(): Cart {
    return {
      id: `cart_${Date.now()}`,
      items: [],
      subtotal: 0,
      totalAmount: 0,
    };
  }
}

// Create and export a singleton instance
export const cartApi = new CartApiClient();

export default cartApi;
