// src/components/CartSidebar.tsx
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiCheck, FiX, FiLoader } from "react-icons/fi";
import styles from "../styles/CartSidebar.module.css";

const CartSidebar: React.FC = () => {
  const {
    cart,
    loading,
    error,
    isCartOpen,
    toggleCart,
    proceedToShiprocketCheckout,
  } = useCart();

  const { user } = useAuth();
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // When cart updates, set the current item to the most recently added item
  useEffect(() => {
    if (cart && cart.items.length > 0 && isCartOpen) {
      const lastItem = cart.items[cart.items.length - 1];
      setCurrentItem(lastItem);
    } else {
      setCurrentItem(null);
    }
  }, [cart, isCartOpen]);

  // Clear checkout error when modal closes
  useEffect(() => {
    if (!showAddressModal) {
      setCheckoutError(null);
    }
  }, [showAddressModal]);

  // Handle Buy Now button click
  const handleBuyNow = async () => {
    // Check if the user is authenticated
    if (!user) {
      // Dispatch custom event to open auth modal
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    // Check if cart has items
    if (!cart || !cart.items || cart.items.length === 0) {
      setCheckoutError("Your cart is empty. Please add items before checkout.");
      return;
    }

    // Show address modal to collect shipping details
    setShowAddressModal(true);
    setCheckoutError(null);
  };

  // Handle address form submission
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const address = {
      fullName: (formData.get("fullName") as string)?.trim() || "",
      address: (formData.get("address") as string)?.trim() || "",
      city: (formData.get("city") as string)?.trim() || "",
      state: (formData.get("state") as string)?.trim() || "",
      pincode: (formData.get("pincode") as string)?.trim() || "",
      email: (formData.get("email") as string)?.trim() || "",
      phone: (formData.get("phone") as string)?.trim() || "",
    };

    // Frontend validation
    try {
      // Check required fields
      if (!address.fullName) throw new Error("Full name is required");
      if (!address.address) throw new Error("Address is required");
      if (!address.city) throw new Error("City is required");
      if (!address.state) throw new Error("State is required");
      if (!address.pincode) throw new Error("Pincode is required");
      if (!address.email) throw new Error("Email is required");
      if (!address.phone) throw new Error("Phone number is required");

      // Validate pincode
      if (!/^\d{6}$/.test(address.pincode)) {
        throw new Error("Please enter a valid 6-digit pincode");
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(address.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate phone
      const cleanPhone = address.phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      // Update phone with cleaned version
      address.phone = cleanPhone;

      // Call checkout with address data
      await proceedToShiprocketCheckout(address);

      // If successful, close modal
      setShowAddressModal(false);
      setCheckoutError(null);
    } catch (error: any) {
      console.error("Checkout error:", error);
      setCheckoutError(error.message || "Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Only show if cart is open and we have a current item
  if (!isCartOpen || !currentItem || loading) {
    return null;
  }

  // Get image URL from current item
  const getImageUrl = (image: any): string => {
    if (!image) return "https://via.placeholder.com/80x80?text=Product";
    if (typeof image === "string") return image;
    if (typeof image === "object" && image !== null && "main" in image) {
      return image.main as string;
    }
    return "https://via.placeholder.com/80x80?text=Product";
  };

  const cartCount = cart?.items.length || 0;

  return (
    <div className={styles.cartSidebar}>
      {/* Close button */}
      <button onClick={toggleCart} className={styles.closeButton}>
        <FiX />
      </button>

      {/* Success message */}
      <div className={styles.successMessage}>
        <FiCheck className={styles.checkIcon} />
        <span className={styles.successText}>Item added to your cart</span>
      </div>

      {/* Product info */}
      <div className={styles.productContainer}>
        <div className={styles.productImage}>
          <img src={getImageUrl(currentItem.image)} alt={currentItem.title} />
        </div>
        <div>
          <h3 className={styles.productTitle}>{currentItem.title}</h3>
        </div>
      </div>

      {/* Error message if any */}
      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px",
            border: "1px solid #f5c6cb",
          }}
        >
          {error}
        </div>
      )}

      {/* View cart button */}
      <Link to="/cart" className={styles.viewCartButton}>
        View cart ({cartCount})
      </Link>

      {/* Buy now button */}
      <button
        onClick={handleBuyNow}
        className={styles.buyNowButton}
        disabled={loading || !cart || cart.items.length === 0}
        style={{
          opacity: loading || !cart || cart.items.length === 0 ? 0.6 : 1,
          cursor:
            loading || !cart || cart.items.length === 0
              ? "not-allowed"
              : "pointer",
        }}
      >
        {loading ? (
          <>
            <FiLoader
              style={{
                animation: "spin 1s linear infinite",
                marginRight: "8px",
              }}
            />
            Loading...
          </>
        ) : (
          <>
            BUY NOW
            <div className={styles.paymentIcons}>
              <img
                src="https://fastrr-boost-ui.pickrr.com/assets/images/boost_button/upi_options.svg"
                alt="upioptions"
                style={{ width: "50px", height: "25px" }}
              />
            </div>
            <span className={styles.poweredBy}>
              <img
                src="https://fastrr-boost-ui.pickrr.com/assets/images/boost_button/powered_by.svg"
                alt="Shiprocket"
              />
            </span>
          </>
        )}
      </button>

      {/* Continue shopping link */}
      <button onClick={toggleCart} className={styles.continueShoppingButton}>
        Continue shopping
      </button>

      {/* Address modal */}
      {showAddressModal && (
        <div className={styles.addressModalOverlay}>
          <div className={styles.addressModalContent}>
            <div className={styles.addressModalHeader}>
              <h2 className={styles.addressModalTitle}>Shipping Address</h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className={styles.closeButton}
                disabled={checkoutLoading}
              >
                <FiX />
              </button>
            </div>

            {/* Error message in modal */}
            {checkoutError && (
              <div
                style={{
                  background: "#f8d7da",
                  color: "#721c24",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  fontSize: "14px",
                  border: "1px solid #f5c6cb",
                }}
              >
                <strong>Error:</strong> {checkoutError}
              </div>
            )}

            <form onSubmit={handleAddressSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name *</label>
                <input
                  name="fullName"
                  required
                  className={styles.formInput}
                  disabled={checkoutLoading}
                  placeholder="Enter your full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address *</label>
                <input
                  name="address"
                  required
                  className={styles.formInput}
                  disabled={checkoutLoading}
                  placeholder="Enter your complete address"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>City *</label>
                  <input
                    name="city"
                    required
                    className={styles.formInput}
                    disabled={checkoutLoading}
                    placeholder="Enter city"
                  />
                </div>

                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>State *</label>
                  <input
                    name="state"
                    required
                    className={styles.formInput}
                    disabled={checkoutLoading}
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>Pincode *</label>
                  <input
                    name="pincode"
                    required
                    className={styles.formInput}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="6 digit pincode"
                    disabled={checkoutLoading}
                    onInput={(e) => {
                      // Only allow digits
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/\D/g, "");
                    }}
                  />
                </div>

                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className={styles.formInput}
                    disabled={checkoutLoading}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone *</label>
                <input
                  name="phone"
                  required
                  className={styles.formInput}
                  defaultValue={user?.phone?.replace("+91", "") || ""}
                  maxLength={10}
                  placeholder="10 digit phone number"
                  disabled={checkoutLoading}
                  onInput={(e) => {
                    // Only allow digits
                    const target = e.target as HTMLInputElement;
                    target.value = target.value.replace(/\D/g, "");
                  }}
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={checkoutLoading}
                style={{
                  opacity: checkoutLoading ? 0.6 : 1,
                  cursor: checkoutLoading ? "not-allowed" : "pointer",
                }}
              >
                {checkoutLoading ? (
                  <>
                    <FiLoader
                      style={{
                        animation: "spin 1s linear infinite",
                        marginRight: "8px",
                      }}
                    />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add CSS for spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CartSidebar;
