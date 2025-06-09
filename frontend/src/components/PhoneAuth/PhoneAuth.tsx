// src/components/PhoneAuth/PhoneAuth.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiX, FiClock } from "react-icons/fi";
import styles from "../../styles/phoneauth.module.css";

interface PhoneAuthProps {
  onClose: () => void;
}

const PhoneAuth: React.FC<PhoneAuthProps> = ({ onClose }) => {
  const { login, verifyOTP, loading, error, clearError } = useAuth();

  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [notifyOffers, setNotifyOffers] = useState(false);

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

  // Auto close after success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

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
      setCountdown(30); // 30 seconds countdown
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
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
      setStep("success");
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
      setCountdown(30);
      setOtp(""); // Clear previous OTP
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.match(/^[0-9]$/)) {
      const newOtp = otp.split("");
      newOtp[index] = value;
      setOtp(newOtp.join(""));

      // Auto-focus next input
      if (index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleEditPhone = () => {
    setStep("phone");
    setOtp("");
    setCountdown(0);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Left side - Black section */}
        <div className={styles.leftSection}>
          <div className={styles.logoRow}>
            <img
              src="https://sattviko.com/cdn/shop/files/logo_foodyoga.png?v=1685712767"
              alt="Sattviko"
              className={styles.logo}
            />
            <div className={styles.poweredBy}>
              <img
                src="/kwikpass.png"
                alt="KwikPass"
                className={styles.kwikPassLogo}
              />
            </div>
          </div>
          <h2 className={styles.tagline}>Login now to avail best offers!</h2>
        </div>

        {/* Right side - White card */}
        <div className={styles.rightSection}>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className={styles.form}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Mobile Number"
                className={styles.phoneInput}
                disabled={loading}
                required
              />

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={notifyOffers}
                  onChange={(e) => setNotifyOffers(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Notify me with offers & updates</span>
              </label>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || !phone.trim()}
              >
                {loading ? "Sending..." : "Submit"}
              </button>

              <p className={styles.termsText}>
                I accept that I have read & understood your
                <br />
                <a href="/privacy-policy" className={styles.link}>
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="/terms" className={styles.link}>
                  T&Cs
                </a>
                .
              </p>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOTPSubmit} className={styles.form}>
              <h3 className={styles.otpTitle}>OTP Verification</h3>
              <p className={styles.otpSubtitle}>
                Verification code sent to
                <br />
                <strong>{phone}</strong>
                <button
                  type="button"
                  onClick={handleEditPhone}
                  className={styles.editButton}
                >
                  Edit
                </button>
              </p>

              <div className={styles.otpInputContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className={styles.otpInput}
                    maxLength={1}
                    disabled={loading}
                  />
                ))}
              </div>

              {countdown > 0 && (
                <div className={styles.resendContainer}>
                  <div className={styles.resendText}>
                    <FiClock className={styles.clockIcon} />
                    <span>Resend OTP in {countdown} Sec</span>
                  </div>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              {countdown === 0 && (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className={styles.resendButton}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </form>
          )}

          {step === "success" && (
            <div className={styles.successContainer}>
              <h2 className={styles.successTitle}>Congratulations!</h2>
              <h3 className={styles.successSubtitle}>Login successful</h3>
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.signingText}>Signing you in</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;
