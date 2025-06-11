// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext"; // Use centralized auth
import { type Cart, cartApi } from "../api/cartApi";
import { shiprocketApi } from "../api/shiprocketApi"; // Import Shiprocket API

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  phone: string;
}

// Add userCartInitialized to the context type
interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  cartCount: number;
  isCartOpen: boolean;
  userCartInitialized: boolean; // New property
  toggleCart: () => void;
  addToCart: (product: any) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  checkoutCart: () => Promise<Cart>;
  proceedToShiprocketCheckout: (address: ShippingAddress) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userCartInitialized, setUserCartInitialized] = useState(false); // New state

  // Use centralized auth context
  const { user, loading: authLoading } = useAuth();

  // Calculate total number of items in cart
  const cartCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  // Toggle cart visibility
  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  // Update auth token when authentication state changes
  useEffect(() => {
    const updateAuthToken = async () => {
      setUserCartInitialized(false); // Reset when user changes

      if (user) {
        try {
          // For Appwrite, we don't need to set a separate JWT token
          // The account instance will handle authentication automatically
          // Just mark that we have an authenticated user
          cartApi.setAuthToken("authenticated");

          // If there was a guest cart, try to merge it
          const guestCartId = localStorage.getItem("cartId");
          if (guestCartId) {
            try {
              await cartApi.mergeGuestCart(guestCartId);
              // Refresh cart after merge
              const userCart = await cartApi.getCart();
              setCart(userCart);
            } catch (err) {
              console.error("Failed to merge carts:", err);
              // Continue without merging if it fails
            }
          }
        } catch (err) {
          console.error("Failed to handle user authentication:", err);
        } finally {
          setUserCartInitialized(true); // Mark as initialized even on error
        }
      } else {
        cartApi.setAuthToken(null);
        setUserCartInitialized(true); // Mark as initialized for unauthenticated state
      }
    };

    // Only run if auth loading is complete
    if (!authLoading) {
      updateAuthToken();
    }
  }, [user, authLoading]); // Removed cart?.id from dependencies

  // Initialize cart on component mount
  useEffect(() => {
    const initializeCart = async () => {
      // Don't initialize until auth state is determined
      if (authLoading) return;

      setLoading(true);
      setError(null);

      try {
        // Get cart from API
        const currentCart = await cartApi.getCart();
        setCart(currentCart);
      } catch (err) {
        console.error("Failed to initialize cart:", err);
        setError("Failed to load cart. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, [authLoading]);

  // Updated proceedToShiprocketCheckout function with address parameter
  const proceedToShiprocketCheckout = async (address: ShippingAddress) => {
    setLoading(true);
    setError(null);

    try {
      if (!cart) {
        throw new Error("Cart is empty");
      }

      if (!user || !user.phone) {
        throw new Error("User information is missing");
      }

      console.log("Starting checkout process for user:", user.phone);
      console.log("Shipping address:", address);

      // Calculate total weight from cart items
      let totalWeight = 0;
      const orderItems = cart.items.map((item) => {
        // Extract weight from item title if available (e.g., "Product Name 70 GM")
        const weightMatch = item.title.match(/(\d+)\s*(GM|KG|g|gm|kg)/i);
        let itemWeight = 0.1; // Default 100g per item

        if (weightMatch) {
          const value = parseFloat(weightMatch[1]);
          const unit = weightMatch[2].toLowerCase();
          itemWeight = unit === "kg" || unit === "KG" ? value : value / 1000; // Convert to kg
          console.log(
            `Item ${item.title} weight: ${itemWeight}kg (from ${value}${unit})`
          );
        } else {
          console.log(`Item ${item.title} weight defaulted to 0.1kg`);
        }

        totalWeight += itemWeight * item.quantity;

        return {
          name: item.title,
          sku: item.productId || `product_${Date.now()}`,
          units: item.quantity,
          selling_price: item.price,
        };
      });

      // Ensure minimum weight
      totalWeight = Math.max(totalWeight, 0.5);
      console.log(`Total order weight: ${totalWeight}kg`);

      // Format the order data for Shiprocket with complete address
      const orderData = {
        order_id: `order_${Date.now()}`,
        order_date: new Date().toISOString(),
        pickup_location: "Primary",
        billing_customer_name: address.fullName,
        billing_last_name: "", // Optional
        billing_address: address.address,
        billing_city: address.city,
        billing_pincode: address.pincode,
        billing_state: address.state,
        billing_country: "India",
        billing_email: address.email,
        billing_phone: address.phone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: "prepaid",
        sub_total: cart.subtotal,
        length: 10,
        breadth: 10,
        height: 10,
        weight: totalWeight,
      };

      console.log("Prepared order data:", orderData);

      // Process checkout with simplified method
      await shiprocketApi.launchShiprocketCheckout(orderData);
      console.log("Checkout completed successfully");

      // Close the cart sidebar
      toggleCart();
    } catch (err: any) {
      console.error("Failed to proceed to Shiprocket checkout:", err);
      setError(
        `Failed to proceed to checkout: ${err.message || "Please try again."}`
      );
      throw err; // Re-throw to handle in UI
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product: any) => {
    if (!product || !product.id) {
      console.error("Cannot add to cart: invalid product");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pass the quantity parameter to the cartApi.addToCart method
      const quantity = product.quantity || 1;

      // Call the API to add the item with the specified quantity
      const updatedCart = await cartApi.addToCart(product, quantity);

      // Update local state
      setCart(updatedCart);

      // Open the cart for visual feedback
      setIsCartOpen(true);
    } catch (err) {
      console.error("Failed to add item to cart:", err);
      setError("Failed to add item to cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setLoading(true);
    setError(null);

    try {
      // Call the API to update the item
      const updatedCart = await cartApi.updateCartItem(itemId, quantity);

      // Update local state
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to update cart item:", err);
      setError("Failed to update item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeCartItem = async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Call the API to remove the item
      const updatedCart = await cartApi.removeCartItem(itemId);

      // Update local state
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to remove cart item:", err);
      setError("Failed to remove item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the API to clear the cart
      const emptyCart = await cartApi.clearCart();

      // Update local state
      setCart(emptyCart);
    } catch (err) {
      console.error("Failed to clear cart:", err);
      setError("Failed to clear cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply coupon to cart
  const applyCoupon = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCart = await cartApi.applyCoupon(code);
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to apply coupon:", err);
      setError("Failed to apply coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remove coupon from cart
  const removeCoupon = async () => {
    setLoading(true);
    setError(null);

    try {
      const updatedCart = await cartApi.removeCoupon();
      setCart(updatedCart);
    } catch (err) {
      console.error("Failed to remove coupon:", err);
      setError("Failed to remove coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Checkout cart
  const checkoutCart = async () => {
    setLoading(true);
    setError(null);

    try {
      const checkedOutCart = await cartApi.checkoutCart();
      setCart(null);
      return checkedOutCart;
    } catch (err) {
      console.error("Failed to checkout cart:", err);
      setError("Failed to complete checkout. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        cartCount,
        isCartOpen,
        userCartInitialized,
        toggleCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        checkoutCart,
        proceedToShiprocketCheckout, // Updated function signature
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
