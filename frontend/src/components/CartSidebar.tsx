// src/components/CartSidebar.tsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import styles from "../styles/headercomponent.module.css";
import { FiX, FiShoppingCart, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

// Define a type for the possible image formats
type ImageType = string | { main: string } | { main: string; hover: string };

const CartSidebar: React.FC = () => {
  const {
    cart,
    loading,
    error,
    isCartOpen,
    toggleCart,
    updateCartItem,
    removeCartItem,
  } = useCart();
  const { isSignedIn } = useAuth();

  // State for quantity updates
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Handle quantity changes
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItemId(itemId);
    await updateCartItem(itemId, newQuantity);
    setUpdatingItemId(null);
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    await removeCartItem(itemId);
    setUpdatingItemId(null);
  };

  // Helper function to extract the correct image URL
  const getImageUrl = (image: any): string => {
    if (!image) return "https://via.placeholder.com/80x80?text=Product";

    if (typeof image === "string") {
      return image;
    }

    // Check if it's an object with a 'main' property
    if (typeof image === "object" && image !== null) {
      if ("main" in image) {
        return image.main as string;
      }
    }

    // Fallback to placeholder
    return "https://via.placeholder.com/80x80?text=Product";
  };

  return (
    <>
      {/* Cart overlay */}
      <div
        className={`${styles.cartOverlay} ${
          isCartOpen ? styles.cartOverlayVisible : ""
        }`}
        onClick={toggleCart}
      />

      {/* Cart sidebar */}
      <div
        className={`${styles.cartSidebar} ${
          isCartOpen ? styles.cartSidebarOpen : ""
        }`}
      >
        {/* Cart header */}
        <div className={styles.cartHeader}>
          <h2 className={styles.cartTitle}>Your Cart</h2>
          <button
            className={styles.closeCartButton}
            onClick={toggleCart}
            aria-label="Close cart"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Cart content */}
        <div className={styles.cartContent}>
          {loading ? (
            <div className={styles.emptyCart}>
              <p>Loading your cart...</p>
            </div>
          ) : error ? (
            <div className={styles.emptyCart}>
              <p>Error: {error}</p>
              <button
                className={styles.continueShoppingButton}
                onClick={toggleCart}
              >
                Continue Shopping
              </button>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyCartIcon}>
                <FiShoppingCart size={48} />
              </div>
              <p>Your cart is empty</p>
              <button
                className={styles.continueShoppingButton}
                onClick={toggleCart}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Cart items */}
              {cart.items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  {/* Item image */}
                  <div className={styles.cartItemImage}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      onError={(e) => {
                        // Fallback image if the main one fails to load
                        e.currentTarget.src =
                          "https://via.placeholder.com/80x80?text=Product";
                      }}
                    />
                  </div>

                  {/* Item details */}
                  <div className={styles.cartItemDetails}>
                    <h4 className={styles.cartItemTitle}>
                      {item.title}
                      {item.weight && (
                        <span className={styles.cartItemWeight}>
                          {" "}
                          {item.weight}
                        </span>
                      )}
                    </h4>
                    <p className={styles.cartItemPrice}>Rs. {item.price}</p>

                    {/* Quantity controls */}
                    <div className={styles.cartItemControls}>
                      <div className={styles.quantityControl}>
                        <button
                          className={styles.quantityButton}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={
                            updatingItemId === item.id || item.quantity <= 1
                          }
                          aria-label="Decrease quantity"
                        >
                          <FiMinus size={14} />
                        </button>
                        <input
                          type="text"
                          className={styles.quantityInput}
                          value={item.quantity}
                          readOnly
                        />
                        <button
                          className={styles.quantityButton}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          disabled={updatingItemId === item.id}
                          aria-label="Increase quantity"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingItemId === item.id}
                      >
                        <FiTrash2 size={14} className={styles.icon} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Cart footer */}
        {cart && cart.items.length > 0 && (
          <div className={styles.cartFooter}>
            {/* Subtotal */}
            <div className={styles.subtotal}>
              <span>Subtotal</span>
              <span>Rs. {cart.subtotal}</span>
            </div>

            {/* Checkout button - only show login prompt if not signed in */}
            {isSignedIn ? (
              <Link to="/checkout" className={styles.checkoutButton}>
                Proceed to Checkout
              </Link>
            ) : (
              <a
                href="/signin?redirect=checkout"
                className={styles.checkoutButton}
              >
                Sign in to Checkout
              </a>
            )}

            {/* Continue shopping button */}
            <button
              className={styles.continueShoppingButton}
              onClick={toggleCart}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
