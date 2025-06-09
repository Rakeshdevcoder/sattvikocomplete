// src/pages/Account.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import styles from "../styles/account.module.css";

const Account: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className={styles.accountContainer}>
      <div className={styles.accountContent}>
        <h1 className={styles.pageTitle}>Account</h1>

        <button onClick={handleLogout} className={styles.logoutLink}>
          <FiUser className={styles.logoutIcon} />
          Log out
        </button>

        <div className={styles.contentGrid}>
          <section className={styles.orderSection}>
            <h2 className={styles.sectionTitle}>Order history</h2>
            <p className={styles.emptyText}>
              You haven't placed any orders yet.
            </p>
          </section>

          <section className={styles.detailsSection}>
            <h2 className={styles.sectionTitle}>Account details</h2>
            <a href="/account/addresses" className={styles.addressLink}>
              View addresses (0)
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Account;
