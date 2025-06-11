// src/pages/Cart.tsx
import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { FiShoppingCart, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import styles from "../styles/cart.module.css";

const Cart = () => {
  const {
    cart,
    loading,
    error,
    updateCartItem,
    removeCartItem,
    proceedToShiprocketCheckout,
  } = useCart();

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Get image URL helper
  const getImageUrl = (image: any): string => {
    if (!image) return "https://via.placeholder.com/80x80?text=Product";
    if (typeof image === "string") return image;
    if (typeof image === "object" && image !== null && "main" in image) {
      return image.main as string;
    }
    return "https://via.placeholder.com/80x80?text=Product";
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingItemId(itemId);
    await updateCartItem(itemId, newQuantity);
    setUpdatingItemId(null);
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    await removeCartItem(itemId);
    setUpdatingItemId(null);
  };

  if (loading) {
    return <div className={styles.emptyCart}>Loading cart...</div>;
  }

  if (error) {
    return (
      <div className={styles.emptyCart} style={{ color: "red" }}>
        Error: {error}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <FiShoppingCart size={48} className={styles.emptyCartIcon} />
        <h2 className={styles.emptyCartTitle}>Your cart is empty</h2>
        <Link to="/" className={styles.shopButton}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Cart</h1>

      <div className={styles.cartGrid}>
        <div>
          {cart.items.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemImage}>
                <img src={getImageUrl(item.image)} alt={item.title} />
              </div>

              <div className={styles.itemDetails}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                {item.weight && (
                  <p className={styles.itemWeight}>{item.weight}</p>
                )}

                <div className={styles.itemControls}>
                  <div className={styles.quantityControls}>
                    <button
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                      disabled={
                        updatingItemId === item.id || item.quantity <= 1
                      }
                      className={styles.quantityButton}
                    >
                      <FiMinus size={14} />
                    </button>

                    <span className={styles.quantity}>{item.quantity}</span>

                    <button
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                      disabled={updatingItemId === item.id}
                      className={styles.quantityButton}
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>

                  <div className={styles.priceControls}>
                    <p className={styles.price}>
                      ₹
                      {typeof item.price === "number"
                        ? item.price.toFixed(2)
                        : item.price}
                    </p>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingItemId === item.id}
                      className={styles.removeButton}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.orderSummary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          <div className={styles.summaryDetails}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{cart.subtotal.toFixed(2)}</span>
            </div>

            {cart.taxAmount > 0 && (
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <span>₹{cart.taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>
                {cart.shippingCost > 0
                  ? `₹${cart.shippingCost.toFixed(2)}`
                  : "Free"}
              </span>
            </div>

            {cart.coupon && (
              <div className={styles.discountRow}>
                <span>Discount ({cart.coupon.code})</span>
                <span>-₹{cart.coupon.discountValue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{cart.totalAmount.toFixed(2)}</span>
          </div>

          <button
            onClick={() => proceedToShiprocketCheckout()}
            className={styles.checkoutButton}
          >
            PROCEED TO CHECKOUT
          </button>

          <Link to="/" className={styles.continueLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
