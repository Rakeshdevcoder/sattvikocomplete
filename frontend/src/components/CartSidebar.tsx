// src/components/CartSidebar.tsx
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import styles from "../styles/headercomponent.module.css";
import {
  FiX,
  FiShoppingCart,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiPackage,
  FiTag,
} from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

// Define a type for the possible image formats
type ImageType = string | { main: string } | { main: string; hover: string };

// Define type for bundled products
interface BundledProduct {
  id: string;
  title: string;
  weight?: string;
}

// Extended CartItem to include both bundle types
interface ExtendedCartItem {
  id: string;
  productId: string;
  title: string;
  price: number | string;
  quantity: number;
  image?: ImageType;
  weight?: string;
  // Bundle as single item properties
  isBundle?: boolean;
  bundledProducts?: BundledProduct[];
  // Bundle as separate items properties
  isBundleItem?: boolean;
  bundleId?: string;
  originalPrice?: number | string;
}

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

  // State for bundle groups
  const [bundleGroups, setBundleGroups] = useState<
    Record<string, ExtendedCartItem[]>
  >({});

  // Helper function to safely convert price to number
  const toNumber = (value: string | number | undefined): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    return 0;
  };

  // Organize bundle items for display
  useEffect(() => {
    if (cart && cart.items) {
      const groups: Record<string, ExtendedCartItem[]> = {};

      // Group items by bundleId
      cart.items.forEach((item) => {
        const extendedItem = item as ExtendedCartItem;
        if (extendedItem.isBundleItem && extendedItem.bundleId) {
          if (!groups[extendedItem.bundleId]) {
            groups[extendedItem.bundleId] = [];
          }
          groups[extendedItem.bundleId].push(extendedItem);
        }
      });

      setBundleGroups(groups);
    }
  }, [cart]);

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

  // Function to check if an item is part of a bundle (separate items)
  const isBundleItem = (item: ExtendedCartItem): boolean => {
    return !!item.isBundleItem && !!item.bundleId;
  };

  // Function to check if an item is a bundle (single item)
  const isBundle = (item: ExtendedCartItem): boolean => {
    return !!item.isBundle;
  };

  // Function to get original total of a bundle
  const getBundleOriginalTotal = (bundleId: string): number => {
    const bundleItems = bundleGroups[bundleId] || [];
    return bundleItems.reduce(
      (total, item) =>
        total + toNumber(item.originalPrice || item.price) * item.quantity,
      0
    );
  };

  // Function to get actual total of a bundle
  const getBundleActualTotal = (bundleId: string): number => {
    const bundleItems = bundleGroups[bundleId] || [];
    return bundleItems.reduce(
      (total, item) => total + toNumber(item.price) * item.quantity,
      0
    );
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
              {/* Display Bundle Groups first (separate items) */}
              {Object.keys(bundleGroups).map((bundleId) => {
                const bundleItems = bundleGroups[bundleId];
                const originalTotal = getBundleOriginalTotal(bundleId);
                const actualTotal = getBundleActualTotal(bundleId);
                const discount = originalTotal - actualTotal;

                return (
                  <div key={bundleId} className={styles.bundleGroup}>
                    <div className={styles.bundleGroupHeader}>
                      <div className={styles.bundleGroupTitle}>
                        <FiPackage size={16} style={{ marginRight: "8px" }} />
                        Bundle Discount
                      </div>
                      <div className={styles.bundleGroupSavings}>
                        <FiTag size={14} style={{ marginRight: "4px" }} />
                        You save ₹{discount.toFixed(2)}
                      </div>
                    </div>

                    {bundleItems.map((item) => (
                      <div
                        key={item.id}
                        className={`${styles.cartItem} ${styles.bundleCartItem}`}
                      >
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
                          <div className={styles.bundleItemBadge}>
                            <span>Bundle</span>
                          </div>
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

                          <div className={styles.bundleItemPricing}>
                            <span className={styles.bundleItemOriginalPrice}>
                              ₹
                              {toNumber(
                                item.originalPrice || item.price
                              ).toFixed(2)}
                            </span>
                            <span className={styles.bundleItemDiscountedPrice}>
                              ₹{toNumber(item.price).toFixed(2)}
                            </span>
                          </div>

                          {/* Quantity controls */}
                          <div className={styles.cartItemControls}>
                            <div className={styles.quantityControl}>
                              <button
                                className={styles.quantityButton}
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity - 1
                                  )
                                }
                                disabled={
                                  updatingItemId === item.id ||
                                  item.quantity <= 1
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
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity + 1
                                  )
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
                  </div>
                );
              })}

              {/* Regular items and single bundle items */}
              {cart.items
                .filter((item) => {
                  const extendedItem = item as ExtendedCartItem;
                  return !isBundleItem(extendedItem);
                })
                .map((item) => {
                  const extendedItem = item as ExtendedCartItem;
                  const isSingleBundle = isBundle(extendedItem);

                  return (
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
                          {isSingleBundle ? (
                            <span className={styles.bundleTitle}>
                              <FiPackage
                                size={14}
                                style={{ marginRight: "6px" }}
                              />
                              7-Product Bundle
                            </span>
                          ) : (
                            item.title
                          )}
                          {item.weight && !isSingleBundle && (
                            <span className={styles.cartItemWeight}>
                              {" "}
                              {item.weight}
                            </span>
                          )}
                        </h4>

                        {/* Bundle items list for single bundles */}
                        {isSingleBundle && extendedItem.bundledProducts && (
                          <div className={styles.bundleItems}>
                            <p className={styles.bundleItemsTitle}>
                              Bundle includes:
                            </p>
                            <ul className={styles.bundleItemsList}>
                              {extendedItem.bundledProducts.map(
                                (bundledProduct, index) => (
                                  <li
                                    key={`${bundledProduct.id}-${index}`}
                                    className={styles.bundleItem}
                                  >
                                    {bundledProduct.title}
                                    {bundledProduct.weight &&
                                      ` (${bundledProduct.weight})`}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

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
                  );
                })}
            </>
          )}
        </div>

        {/* Cart footer */}
        {cart && cart.items.length > 0 && (
          <div className={styles.cartFooter}>
            {/* Subtotal */}
            <div className={styles.subtotal}>
              <span>Subtotal</span>
              <span>₹{toNumber(cart.subtotal).toFixed(2)}</span>
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
