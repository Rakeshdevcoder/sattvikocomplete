import React from "react";
import { useLocation, Link, Navigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import styles from "../styles/orderSuccess.module.css";

interface LocationState {
  orderId: string;
  deliveryDate: string;
}

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  if (!state) return <Navigate to="/" replace />;

  const { orderId, deliveryDate } = state;

  return (
    <div className={styles.successContainer}>
      <div className={styles.successAnimation}>
        <FiCheckCircle size={100} />
      </div>
      <h1>Thank You!</h1>
      <p>
        Your order <strong>#{orderId}</strong> has been placed.
      </p>
      <p>Estimated delivery: {new Date(deliveryDate).toDateString()}</p>
      <Link to="/" className={styles.continueButton}>
        Continue Shopping
      </Link>
    </div>
  );
};

export default OrderSuccessPage;
