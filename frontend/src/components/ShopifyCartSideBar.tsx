// src/components/ShopifyCartSidebar.tsx
import React, { useState, useEffect } from "react";
import { useShopifyCart } from "../context/ShopifyCartContext";
import { Link } from "react-router-dom";
import {
  FiCheck,
  FiX,
  FiLoader,
  FiMinus,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import styles from "../styles/CartSidebar.module.css";

const ShopifyCartSidebar: React.FC = () => {
  const {
    cart,
    loading,
    error,
    isCartOpen,
    toggleCart,
    updateCartLine,
    removeCartLine,
    proceedToCheckout,
  } = useShopifyCart();

  const [currentItem, setCurrentItem] = useState<any>(null);
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);

  useEffect(() => {
    if (cart && cart.lines.edges.length > 0 && isCartOpen) {
      // Show the last added item
      const lastItem = cart.lines.edges[cart.lines.edges.length - 1].node;
      setCurrentItem(lastItem);
    } else {
      setCurrentItem(null);
    }
  }, [cart, isCartOpen]);

  const handleQuantityChange = async (lineId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingLineId(lineId);
    try {
      await updateCartLine(lineId, newQuantity);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleRemoveItem = async (lineId: string) => {
    setUpdatingLineId(lineId);
    try {
      await removeCartLine(lineId);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleCheckout = async () => {
    try {
      await proceedToCheckout();
    } catch (err) {
      console.error("Checkout failed:", err);
    }
  };

  if (!isCartOpen) {
    return null;
  }

  const getImageUrl = (line: any): string => {
    const image = line.merchandise?.product?.images?.edges?.[0]?.node?.url;
    return image || "https://via.placeholder.com/80x80?text=Product";
  };

  const formatPrice = (amount: string, currencyCode: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  const cartCount = cart?.totalQuantity || 0;
  const cartLines = cart?.lines.edges || [];

  return (
    <div className={styles.cartSidebar}>
      <button onClick={toggleCart} className={styles.closeButton}>
        <FiX />
      </button>

      {currentItem && (
        <>
          <div className={styles.successMessage}>
            <FiCheck className={styles.checkIcon} />
            <span className={styles.successText}>Item added to your cart</span>
          </div>

          <div className={styles.productContainer}>
            <div className={styles.productImage}>
              <img
                src={getImageUrl(currentItem)}
                alt={currentItem.merchandise?.title}
              />
            </div>
            <div>
              <h3 className={styles.productTitle}>
                {currentItem.merchandise?.title}
              </h3>
              <p className={styles.productPrice}>
                {formatPrice(currentItem.merchandise?.price?.amount)}
              </p>
            </div>
          </div>
        </>
      )}

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

      {cartLines.length > 0 && (
        <div className={styles.cartItems}>
          <h4 style={{ marginBottom: "15px", fontSize: "16px" }}>
            Cart Items ({cartCount})
          </h4>

          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {cartLines.map(({ node: line }) => (
              <div
                key={line.id}
                className={styles.cartItem}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #eee",
                  gap: "10px",
                }}
              >
                <img
                  src={getImageUrl(line)}
                  alt={line.merchandise?.title}
                  style={{
                    width: "40px",
                    height: "40px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      lineHeight: "1.2",
                    }}
                  >
                    {line.merchandise?.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {formatPrice(line.cost.totalAmount.amount)}
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <button
                    onClick={() =>
                      handleQuantityChange(line.id, line.quantity - 1)
                    }
                    disabled={updatingLineId === line.id || line.quantity <= 1}
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "1px solid #ddd",
                      background: "white",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <FiMinus size={12} />
                  </button>

                  <span
                    style={{
                      fontSize: "14px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}
                  >
                    {line.quantity}
                  </span>

                  <button
                    onClick={() =>
                      handleQuantityChange(line.id, line.quantity + 1)
                    }
                    disabled={updatingLineId === line.id}
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "1px solid #ddd",
                      background: "white",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <FiPlus size={12} />
                  </button>

                  <button
                    onClick={() => handleRemoveItem(line.id)}
                    disabled={updatingLineId === line.id}
                    style={{
                      width: "24px",
                      height: "24px",
                      border: "none",
                      background: "transparent",
                      color: "#dc3545",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {cart && (
            <div
              style={{
                padding: "15px 0",
                borderTop: "2px solid #eee",
                marginTop: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "16px", fontWeight: "600" }}>
                  Total:
                </span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>
                  {formatPrice(cart.cost.totalAmount.amount)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className={styles.buyNowButton}
                disabled={loading || cartLines.length === 0}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  marginBottom: "10px",
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
                    Processing...
                  </>
                ) : (
                  "CHECKOUT WITH RAZORPAY"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {cartLines.length === 0 && !currentItem && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#666", marginBottom: "15px" }}>
            Your cart is empty
          </p>
          <Link
            to="/"
            onClick={toggleCart}
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      )}

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

export default ShopifyCartSidebar;
