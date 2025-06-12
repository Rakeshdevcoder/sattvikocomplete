// src/components/CartSidebar.tsx
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiCheck, FiX, FiLoader } from "react-icons/fi";
import styles from "../styles/CartSidebar.module.css";

const CartSidebar: React.FC = () => {
  const { cart, loading, error, isCartOpen, toggleCart } = useCart();

  const { user } = useAuth();
  const [currentItem, setCurrentItem] = useState<any>(null);

  useEffect(() => {
    if (cart && cart.items.length > 0 && isCartOpen) {
      const lastItem = cart.items[cart.items.length - 1];
      setCurrentItem(lastItem);
    } else {
      setCurrentItem(null);
    }
  }, [cart, isCartOpen]);

  const handleBuyNow = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return;
    }

    // Navigate to checkout page
    window.location.href = "/checkout";
  };

  if (!isCartOpen || !currentItem || loading) {
    return null;
  }

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
      <button onClick={toggleCart} className={styles.closeButton}>
        <FiX />
      </button>

      <div className={styles.successMessage}>
        <FiCheck className={styles.checkIcon} />
        <span className={styles.successText}>Item added to your cart</span>
      </div>

      <div className={styles.productContainer}>
        <div className={styles.productImage}>
          <img src={getImageUrl(currentItem.image)} alt={currentItem.title} />
        </div>
        <div>
          <h3 className={styles.productTitle}>{currentItem.title}</h3>
        </div>
      </div>

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

      <Link to="/cart" className={styles.viewCartButton}>
        View cart ({cartCount})
      </Link>

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
                src="https://badges.razorpay.com/badge-light.png"
                alt="Razorpay"
                style={{
                  width: "20px",
                  height: "20px",
                  background: "transparent",
                }}
              />
            </span>
          </>
        )}
      </button>

      <button onClick={toggleCart} className={styles.continueShoppingButton}>
        Continue shopping
      </button>

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
