// src/pages/Checkout.tsx
import React, { useState, type ChangeEvent } from "react";
import { useCart } from "../context/CartContext";
import { shiprocketApi } from "../api/shiprocketApi";
import {
  FiTrash2,
  FiMinus,
  FiPlus,
  FiCheck,
  FiPackage,
  FiCreditCard,
  FiTruck,
  FiAlertCircle,
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

interface ShippingOption {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  estimated_delivery_days: string;
}

const Checkout: React.FC = () => {
  const { cart, updateCartItem, removeCartItem, checkoutCart } = useCart();
  const navigate = useNavigate();

  const [orderInstructions, setOrderInstructions] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showShippingOptions, setShowShippingOptions] = useState(false);
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

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Your pickup location pincode - should be from environment or config
  const PICKUP_PINCODE = import.meta.env.REACT_APP_PICKUP_PINCODE || "110001";

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

  // Calculate total weight of items (in kg)
  const calculateTotalWeight = () => {
    // Assuming each item weighs 0.2kg if weight not specified
    return cart.items.reduce((total, item) => {
      const itemWeight = item.weight ? parseFloat(item.weight) : 0.2;
      return total + itemWeight * item.quantity;
    }, 0);
  };

  // Check shipping serviceability and get rates
  const checkShippingRates = async () => {
    if (!address.postalCode || address.postalCode.length < 6) {
      setShippingError("Please enter a valid 6-digit postal code");
      return;
    }

    setIsLoadingShipping(true);
    setShippingError("");
    setShippingOptions([]);

    try {
      const totalWeight = calculateTotalWeight();
      const rates = await shiprocketApi.getShippingRates(
        PICKUP_PINCODE,
        address.postalCode,
        totalWeight,
        false, // COD
        cart.totalAmount
      );

      if (rates.length === 0) {
        setShippingError("No shipping services available for your location");
      } else {
        setShippingOptions(rates);
        setSelectedShipping(rates[0]); // Select cheapest option by default
        setShowShippingOptions(true);
      }
    } catch (error: any) {
      console.error("Shipping rate check failed:", error);
      setShippingError(
        error.message || "Unable to check shipping rates. Please try again."
      );
    } finally {
      setIsLoadingShipping(false);
    }
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

    // Check shipping rates
    await checkShippingRates();
  };

  const handlePlaceOrder = async () => {
    if (!selectedShipping) {
      alert("Please select a shipping option");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // First checkout the cart in the cart service
      const checkedOutCart = await checkoutCart();

      // Format order items for Shiprocket
      const shiprocketItems = checkedOutCart.items.map((item) => ({
        name: item.title,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: item.price * 0.18, // 18% GST
      }));

      // Create order in Shiprocket
      const shiprocketOrderData = {
        order_id: checkedOutCart.id,
        order_date: new Date().toISOString(),
        pickup_location: "Primary", // You should configure this
        billing_customer_name: address.fullName,
        billing_address: address.street,
        billing_city: address.city,
        billing_pincode: address.postalCode,
        billing_state: address.state,
        billing_country: address.country,
        billing_email: address.email,
        billing_phone: address.phone,
        shipping_is_billing: true,
        order_items: shiprocketItems,
        payment_method: "Prepaid",
        sub_total: checkedOutCart.subtotal,
        length: 10, // Default package dimensions
        breadth: 10,
        height: 10,
        weight: calculateTotalWeight(),
      };

      const shiprocketResponse = await shiprocketApi.createOrder(
        shiprocketOrderData
      );

      // Create order in your order service with Shiprocket details
      const orderPayload = {
        cartId: checkedOutCart.id,
        items: checkedOutCart.items,
        subtotal: checkedOutCart.subtotal,
        taxAmount: checkedOutCart.taxAmount,
        shippingCost: selectedShipping.rate,
        totalAmount: checkedOutCart.totalAmount + selectedShipping.rate,
        instructions: orderInstructions,
        address,
        shippingDetails: {
          courier: selectedShipping.courier_name,
          rate: selectedShipping.rate,
          estimatedDelivery: selectedShipping.etd,
          shiprocketOrderId: shiprocketResponse.shiprocketOrderId,
          shipmentId: shiprocketResponse.shipmentId,
          awbCode: shiprocketResponse.awbCode,
        },
        orderDate: new Date().toISOString(),
        deliveryDate: selectedShipping.etd,
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
          deliveryDate: selectedShipping.etd,
          trackingDetails: {
            awbCode: shiprocketResponse.awbCode,
            courier: selectedShipping.courier_name,
          },
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
  const formattedShipping = selectedShipping
    ? selectedShipping.rate.toFixed(2)
    : cart.shippingCost.toFixed(2);
  const formattedTax = cart.taxAmount.toFixed(2);
  const formattedTotal = selectedShipping
    ? (cart.totalAmount + selectedShipping.rate).toFixed(2)
    : cart.totalAmount.toFixed(2);

  return (
    <div className={styles.checkoutContainer}>
      <div className={styles.checkoutHeader}>
        <h1 className={styles.checkoutTitle}>
          {!showAddressForm
            ? "Shopping Cart"
            : showShippingOptions
            ? "Select Shipping"
            : "Shipping Details"}
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

          {/* Shipping Options */}
          {showShippingOptions && shippingOptions.length > 0 && (
            <div className={styles.shippingOptions}>
              <h3 className={styles.shippingTitle}>Select Shipping Option</h3>
              <div className={styles.shippingList}>
                {shippingOptions.map((option) => (
                  <label
                    key={option.courier_company_id}
                    className={`${styles.shippingOption} ${
                      selectedShipping?.courier_company_id ===
                      option.courier_company_id
                        ? styles.selectedShipping
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={
                        selectedShipping?.courier_company_id ===
                        option.courier_company_id
                      }
                      onChange={() => setSelectedShipping(option)}
                    />
                    <div className={styles.shippingDetails}>
                      <div>
                        <strong>{option.courier_name}</strong>
                        <p>
                          Estimated Delivery: {option.estimated_delivery_days}
                        </p>
                      </div>
                      <div className={styles.shippingRate}>
                        Rs. {option.rate.toFixed(2)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
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
            ) : !showShippingOptions ? (
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

                {shippingError && (
                  <div className={styles.errorMessage}>
                    <FiAlertCircle /> {shippingError}
                  </div>
                )}

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
                    className={styles.continueButton}
                    disabled={isLoadingShipping}
                  >
                    {isLoadingShipping ? (
                      <span className={styles.loadingSpinner}>
                        Checking Delivery Options...
                      </span>
                    ) : (
                      "Continue to Shipping"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.placeOrderSection}>
                <div className={styles.selectedAddress}>
                  <h4>Deliver to:</h4>
                  <p>{address.fullName}</p>
                  <p>{address.street}</p>
                  <p>
                    {address.city}, {address.state} - {address.postalCode}
                  </p>
                  <p>{address.phone}</p>
                </div>

                <div className={styles.actionButtons}>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => {
                      setShowShippingOptions(false);
                      setSelectedShipping(null);
                    }}
                  >
                    Change Address
                  </button>

                  <button
                    className={styles.placeOrderButton}
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || !selectedShipping}
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
              </div>
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
