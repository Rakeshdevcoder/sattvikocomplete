// src/pages/Checkout.tsx
import React, { useState, type ChangeEvent } from "react";
import { useCart } from "../context/CartContext";
import {
  FiTrash2,
  FiMinus,
  FiPlus,
  FiCheck,
  FiPackage,
  FiCreditCard,
  FiTruck,
} from "react-icons/fi";
import styles from "../styles/checkout.module.css";
import { Link, useNavigate } from "react-router-dom";

interface Address {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

const Checkout: React.FC = () => {
  const { cart, updateCartItem, removeCartItem, checkoutCart } = useCart();
  const navigate = useNavigate();

  const [orderInstructions, setOrderInstructions] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [address, setAddress] = useState<Address>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    email: "",
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <div className={styles.emptyCartContent}>
          <FiPackage size={80} className={styles.emptyCartIcon} />
          <h1>Your cart is empty</h1>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <Link to="/" className={styles.continueShoppingButton}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity < 1) return;
    updateCartItem(id, quantity);
  };

  const handleRemove = (id: string) => {
    removeCartItem(id);
  };

  const handleBuyNow = () => {
    setShowAddressForm(true);
  };

  const onAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate address
    if (!address.phone || address.phone.length < 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!address.email || !address.email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    // Proceed to place order
    await handlePlaceOrder();
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);

    try {
      // First checkout the cart in the cart service
      const checkedOutCart = await checkoutCart();

      // Create order in your order service
      const orderPayload = {
        cartId: checkedOutCart.id,
        items: checkedOutCart.items,
        subtotal: checkedOutCart.subtotal,
        taxAmount: checkedOutCart.taxAmount,
        shippingCost: checkedOutCart.shippingCost,
        totalAmount: checkedOutCart.totalAmount,
        instructions: orderInstructions,
        address,
        orderDate: new Date().toISOString(),
        status: "pending",
      };

      const res = await fetch("http://localhost:8081/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }

      const orderData = await res.json();

      // Navigate to success page with order details
      navigate("/order-success", {
        state: {
          orderId: orderData.id,
          orderData: orderData,
        },
      });
    } catch (err: any) {
      console.error(err);
      alert(`Unable to place order: ${err.message}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const formattedSubtotal = cart.subtotal.toFixed(2);
  const formattedShipping = cart.shippingCost.toFixed(2);
  const formattedTax = cart.taxAmount.toFixed(2);
  const formattedTotal = cart.totalAmount.toFixed(2);

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.checkoutHeader}>
        <h1 className={styles.checkoutTitle}>
          {!showAddressForm ? "Shopping Cart" : "Shipping Details"}
        </h1>
        <div className={styles.checkoutSteps}>
          <div className={`${styles.step} ${styles.activeStep}`}>
            <div className={styles.stepIcon}>
              <FiPackage />
            </div>
            <span>Cart</span>
          </div>
          <div
            className={`${styles.step} ${
              showAddressForm ? styles.activeStep : ""
            }`}
          >
            <div className={styles.stepIcon}>
              <FiTruck />
            </div>
            <span>Shipping</span>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <FiCreditCard />
            </div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className={styles.checkoutContent}>
        {/* Cart Items */}
        <div className={styles.cartItemsContainer}>
          <div className={styles.sectionTitle}>
            {cart.items.length} {cart.items.length === 1 ? "Item" : "Items"} in
            Your Cart
          </div>
          <div className={styles.cartItemsList}>
            {cart.items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.productInfo}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className={styles.productImage}
                  />
                  <div className={styles.productDetails}>
                    <h3 className={styles.productTitle}>{item.title}</h3>
                    <p className={styles.productPrice}>
                      Rs. {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className={styles.quantitySection}>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.quantityButton}
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus />
                    </button>
                    <span className={styles.quantityDisplay}>
                      {item.quantity}
                    </span>
                    <button
                      className={styles.quantityButton}
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemove(item.id)}
                    aria-label="Remove item"
                  >
                    <FiTrash2 />
                  </button>
                </div>
                <div className={styles.itemTotal}>
                  Rs. {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {!showAddressForm && (
            <div className={styles.orderInstructions}>
              <h3 className={styles.instructionsTitle}>Special Instructions</h3>
              <textarea
                className={styles.instructionsTextarea}
                rows={3}
                value={orderInstructions}
                onChange={(e) => setOrderInstructions(e.target.value)}
                placeholder="Add any notes or special requests for your order here..."
              />
            </div>
          )}
        </div>

        {/* Summary & Address Form */}
        <div className={styles.orderSummary}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>Rs. {formattedSubtotal}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>Rs. {formattedTax}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Rs. {formattedShipping}</span>
            </div>

            {cart.coupon && (
              <div className={styles.summaryRow}>
                <span>Discount ({cart.coupon.code})</span>
                <span>-Rs. {cart.coupon.discountValue.toFixed(2)}</span>
              </div>
            )}

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>Rs. {formattedTotal}</span>
            </div>

            {!showAddressForm ? (
              <button className={styles.buyNowButton} onClick={handleBuyNow}>
                PROCEED TO CHECKOUT
              </button>
            ) : (
              <form
                className={styles.addressForm}
                onSubmit={handleAddressSubmit}
              >
                <h3 className={styles.formSectionTitle}>Shipping Address</h3>

                <div className={styles.formField}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={address.fullName}
                    onChange={onAddressChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={address.email}
                    onChange={onAddressChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={address.phone}
                    onChange={onAddressChange}
                    placeholder="10-digit phone number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="street">Street Address</label>
                  <input
                    id="street"
                    name="street"
                    type="text"
                    value={address.street}
                    onChange={onAddressChange}
                    placeholder="Enter your street address"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={address.city}
                      onChange={onAddressChange}
                      placeholder="City"
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="state">State</label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={address.state}
                      onChange={onAddressChange}
                      placeholder="State"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="postalCode">Postal Code</label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      value={address.postalCode}
                      onChange={onAddressChange}
                      placeholder="6-digit pincode"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="country">Country</label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={address.country}
                      onChange={onAddressChange}
                      placeholder="Country"
                      required
                    />
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => setShowAddressForm(false)}
                  >
                    Back to Cart
                  </button>

                  <button
                    type="submit"
                    className={styles.placeOrderButton}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? (
                      <span className={styles.loadingSpinner}>
                        Placing Order...
                      </span>
                    ) : (
                      <>
                        <FiCheck /> Place Order
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className={styles.secureCheckout}>
              <div className={styles.secureIcons}>
                <img
                  src="/secure-payment.png"
                  alt="Secure Payment"
                  className={styles.secureIcon}
                />
              </div>
              <p>Your payment information is processed securely.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
