// src/components/PhoneAuth/PhoneAuth.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiX, FiPhone, FiLock } from "react-icons/fi";
import styles from "../../styles/phoneauth.module.css";

interface PhoneAuthProps {
  onClose: () => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onClose }) => {
  const { login, verifyOTP, loading, error, clearError } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Clear error when component mounts or step changes
  useEffect(() => {
    clearError();
  }, [step, clearError]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      return;
    }

    // Format phone number (add +91 if not present)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("91")) {
        formattedPhone = "+" + formattedPhone;
      } else {
        formattedPhone = "+91" + formattedPhone;
      }
    }

    try {
      await login(formattedPhone);
      setStep("otp");
      setCountdown(60); // 60 seconds countdown
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      return;
    }

    // Format phone number again
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("91")) {
        formattedPhone = "+" + formattedPhone;
      } else {
        formattedPhone = "+91" + formattedPhone;
      }
    }

    try {
      await verifyOTP(formattedPhone, otp.trim());
      onClose(); // Close modal on successful login
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    // Format phone number again
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("91")) {
        formattedPhone = "+" + formattedPhone;
      } else {
        formattedPhone = "+91" + formattedPhone;
      }
    }

    try {
      await login(formattedPhone);
      setCountdown(60);
      setOtp(""); // Clear previous OTP
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtp("");
    clearError();
    // Clear stored auth phone
    localStorage.removeItem("authPhone");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {step === "phone" ? "Sign In" : "Verify OTP"}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <div className={styles.inputWrapper}>
                  <FiPhone className={styles.inputIcon} />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
                <p className={styles.helpText}>
                  We'll send you a verification code
                </p>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !phone.trim()}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="otp" className={styles.label}>
                  Enter OTP
                </label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className={styles.input}
                    disabled={loading}
                    maxLength={6}
                    required
                  />
                </div>
                <p className={styles.helpText}>Code sent to {phone}</p>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !otp.trim()}
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className={styles.linkButton}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>

                <button
                  type="button"
                  onClick={handleBackToPhone}
                  className={styles.linkButton}
                  disabled={loading}
                >
                  Change Phone Number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;
