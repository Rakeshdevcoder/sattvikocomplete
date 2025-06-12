// src/context/ShopifyCartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { shopifyApi, type ShopifyCart, type CartLine } from "../api/shopifyApi";

interface ShopifyCartContextType {
  cart: ShopifyCart | null;
  loading: boolean;
  error: string | null;
  cartCount: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateCartLine: (lineId: string, quantity: number) => Promise<void>;
  removeCartLine: (lineId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  proceedToCheckout: () => Promise<void>;
}

const ShopifyCartContext = createContext<ShopifyCartContextType | undefined>(
  undefined
);

export const useShopifyCart = () => {
  const context = useContext(ShopifyCartContext);
  if (context === undefined) {
    throw new Error("useShopifyCart must be used within a ShopifyCartProvider");
  }
  return context;
};

interface ShopifyCartProviderProps {
  children: ReactNode;
}

export const ShopifyCartProvider: React.FC<ShopifyCartProviderProps> = ({
  children,
}) => {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Calculate total number of items in cart
  const cartCount = cart?.totalQuantity || 0;

  // Toggle cart visibility
  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  // Initialize cart on component mount
  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentCart = await shopifyApi.getCart();
        setCart(currentCart);
      } catch (err: any) {
        console.error("Failed to initialize cart:", err);
        setError("Failed to load cart. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, []);

  // Add item to cart
  const addToCart = async (variantId: string, quantity: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCart = await shopifyApi.addToCart(variantId, quantity);
      setCart(updatedCart);

      // Open the cart for visual feedback
      setIsCartOpen(true);
    } catch (err: any) {
      console.error("Failed to add item to cart:", err);
      setError("Failed to add item to cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update cart line quantity
  const updateCartLine = async (lineId: string, quantity: number) => {
    if (quantity < 1) {
      await removeCartLine(lineId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedCart = await shopifyApi.updateCartLine(lineId, quantity);
      setCart(updatedCart);
    } catch (err: any) {
      console.error("Failed to update cart line:", err);
      setError("Failed to update item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remove line from cart
  const removeCartLine = async (lineId: string) => {
    setLoading(true);
    setError(null);

    try {
      const updatedCart = await shopifyApi.removeCartLine(lineId);
      setCart(updatedCart);
    } catch (err: any) {
      console.error("Failed to remove cart line:", err);
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
      const emptyCart = await shopifyApi.clearCart();
      setCart(emptyCart);
    } catch (err: any) {
      console.error("Failed to clear cart:", err);
      setError("Failed to clear cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Proceed to checkout - redirects to Shopify's checkout with Razorpay
  const proceedToCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!cart || cart.lines.edges.length === 0) {
        throw new Error("Cart is empty");
      }

      const checkoutUrl = await shopifyApi.getCheckoutUrl();

      // Redirect to Shopify's checkout page (with Razorpay Magic Checkout)
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Failed to proceed to checkout:", err);
      setError("Failed to proceed to checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopifyCartContext.Provider
      value={{
        cart,
        loading,
        error,
        cartCount,
        isCartOpen,
        toggleCart,
        addToCart,
        updateCartLine,
        removeCartLine,
        clearCart,
        proceedToCheckout,
      }}
    >
      {children}
    </ShopifyCartContext.Provider>
  );
};

export default ShopifyCartContext;
