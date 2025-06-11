// src/components/CartSidebar.tsx
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiCheck, FiX } from "react-icons/fi";
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

  // When cart updates, set the current item to the most recently added item
  useEffect(() => {
    if (cart && cart.items.length > 0 && isCartOpen) {
      const lastItem = cart.items[cart.items.length - 1];
      setCurrentItem(lastItem);
    } else {
      setCurrentItem(null);
    }
  }, [cart, isCartOpen]);

  // Handle Buy Now button click
  const handleBuyNow = async () => {
    // Check if the user is authenticated
    if (!user) {
      // Dispatch custom event to open auth modal
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    // Show address modal to collect shipping details
    setShowAddressModal(true);
  };

  // Handle address form submission
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    const address = {
      fullName: formData.get("fullName") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
    };

    // Validate address
    if (!address.pincode || address.pincode.length !== 6) {
      alert("Please enter a valid 6-digit pincode");
      return;
    }

    if (!address.phone || address.phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    try {
      setShowAddressModal(false);
      // Call checkout with address data
      await proceedToShiprocketCheckout(address);
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert("Checkout failed: " + error.message);
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

      {/* View cart button */}
      <Link to="/cart" className={styles.viewCartButton}>
        View cart ({cartCount})
      </Link>

      {/* Buy now button */}
      <button onClick={handleBuyNow} className={styles.buyNowButton}>
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
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name *</label>
                <input name="fullName" required className={styles.formInput} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address *</label>
                <input name="address" required className={styles.formInput} />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>City *</label>
                  <input name="city" required className={styles.formInput} />
                </div>

                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>State *</label>
                  <input name="state" required className={styles.formInput} />
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
                  />
                </div>

                <div className={styles.formColumn}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone *</label>
                <input
                  name="phone"
                  required
                  className={styles.formInput}
                  defaultValue={user?.phone?.substring(3) || ""}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="10 digit phone number"
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSidebar;
