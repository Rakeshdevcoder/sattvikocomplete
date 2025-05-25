// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type Cart, cartApi } from "../api/cartApi";

// Simple context type with essential cart functionality
interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  cartCount: number;
  isCartOpen: boolean;
  toggleCart: () => void;
  addToCart: (product: any) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
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

  // Calculate total number of items in cart
  const cartCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

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
        // Get cart from localStorage
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
  }, []);

  // Add item to cart
  // src/context/CartContext.tsx
  // Let's check the addToCart function in the CartProvider component

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
      // ⚠️ Make sure to pass the quantity from the product object if available
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

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        cartCount,
        isCartOpen,
        toggleCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
