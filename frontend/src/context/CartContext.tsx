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
          if (guestCartId && guestCartId !== cart?.id) {
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
  }, [user, authLoading, cart?.id]);

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
        userCartInitialized, // Expose the new state
        toggleCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        checkoutCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
