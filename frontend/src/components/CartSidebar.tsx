// src/components/CartSidebar.tsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext"; // Use centralized auth
import styles from "../styles/headercomponent.module.css";

import {
  FiX,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiTag,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const CartSidebar: React.FC = () => {
  const {
    cart,
    loading,
    error,
    isCartOpen,
    toggleCart,
    updateCartItem,
    removeCartItem,
    applyCoupon,
    removeCoupon,
    proceedToShiprocketCheckout,
  } = useCart();

  // Use centralized auth context
  const { user, loading: authLoading } = useAuth();
  const isSignedIn = !!user;

  // State for quantity updates
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  // State for coupon code
  const [couponCode, setCouponCode] = useState<string>("");
  const [applyingCoupon, setApplyingCoupon] = useState<boolean>(false);

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

  // Handle coupon application
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode("");
    } catch (err) {
      console.error("Failed to apply coupon:", err);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (err) {
      console.error("Failed to remove coupon:", err);
    }
  };

  // Handle opening auth modal
  const handleOpenAuthModal = () => {
    toggleCart(); // Close the cart
    // Dispatch custom event to open auth modal in HeaderComponent
    window.dispatchEvent(new CustomEvent("openAuthModal"));
  };

  // Helper function to safely convert price to number
  const toNumber = (value: string | number | undefined): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    return 0;
  };

  // Helper function to get image URL
  const getImageUrl = (image: any): string => {
    if (!image) return "https://via.placeholder.com/80x80?text=Product";
    if (typeof image === "string") return image;
    if (typeof image === "object" && image !== null && "main" in image) {
      return image.main as string;
    }
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
              {/* Regular cart items */}
              {cart.items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  {/* Item image */}
                  <div className={styles.cartItemImage}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      onError={(e) => {
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

                    <p className={styles.cartItemPrice}>
                      ₹{toNumber(item.price).toFixed(2)}
                    </p>

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

              {/* Coupon section */}
              <div className={styles.couponSection}>
                {cart.coupon ? (
                  <div className={styles.appliedCoupon}>
                    <div className={styles.couponInfo}>
                      <FiTag size={16} className={styles.couponIcon} />
                      <span>
                        Applied: <strong>{cart.coupon.code}</strong>
                        {cart.coupon.discountType === "percentage"
                          ? ` (${cart.coupon.discountValue}% off)`
                          : ` (₹${cart.coupon.discountValue.toFixed(2)} off)`}
                      </span>
                    </div>
                    <button
                      className={styles.removeCouponButton}
                      onClick={handleRemoveCoupon}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleApplyCoupon}
                    className={styles.couponForm}
                  >
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className={styles.couponInput}
                      disabled={applyingCoupon}
                    />
                    <button
                      type="submit"
                      className={styles.applyCouponButton}
                      disabled={!couponCode.trim() || applyingCoupon}
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cart footer */}
        {cart && cart.items.length > 0 && (
          <div className={styles.cartFooter}>
            {/* Price details */}
            <div className={styles.priceDetails}>
              <div className={styles.priceRow}>
                <span>Subtotal</span>
                <span>₹{toNumber(cart.subtotal).toFixed(2)}</span>
              </div>
              {cart.taxAmount > 0 && (
                <div className={styles.priceRow}>
                  <span>Tax</span>
                  <span>₹{toNumber(cart.taxAmount).toFixed(2)}</span>
                </div>
              )}
              {cart.shippingCost > 0 && (
                <div className={styles.priceRow}>
                  <span>Shipping</span>
                  <span>₹{toNumber(cart.shippingCost).toFixed(2)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>Total</span>
                <span>₹{toNumber(cart.totalAmount).toFixed(2)}</span>
              </div>
            </div>
            {/* Checkout button - only show login prompt if not signed in */}
            {!authLoading && isSignedIn ? (
              <button
                className={styles.checkoutButton}
                onClick={proceedToShiprocketCheckout}
              >
                Proceed to Checkout
              </button>
            ) : (
              <button
                className={styles.checkoutButton}
                onClick={handleOpenAuthModal}
              >
                Sign in to Checkout
              </button>
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
