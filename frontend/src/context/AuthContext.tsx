// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { twilioClient, validatePhoneNumber } from "../config/twillio.config";

interface User {
  id: string;
  phone: string;
  verified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Clear error
  const clearError = () => setError(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        setLoading(true);
        setError(null);

        // Check if there's a stored user session
        const storedUser = localStorage.getItem("user");
        const sessionExpiry = localStorage.getItem("sessionExpiry");

        if (storedUser && sessionExpiry) {
          const expiry = new Date(sessionExpiry);
          if (expiry > new Date()) {
            // Session is still valid
            setUser(JSON.parse(storedUser));
          } else {
            // Session expired, clear storage
            localStorage.removeItem("user");
            localStorage.removeItem("sessionExpiry");
            localStorage.removeItem("authPhone");
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error: any) {
        console.error("Auth check error:", error);
        setError("Failed to check authentication status");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login with phone number
  const login = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate phone number
      const validation = validatePhoneNumber(phone);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid phone number");
      }

      // Send verification via Twilio
      await twilioClient.sendVerification(validation.formatted);

      // Store phone for OTP verification
      localStorage.setItem("authPhone", validation.formatted);

      console.log("OTP sent successfully to:", validation.formatted);
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle specific errors
      if (error.message.includes("429")) {
        setError("Too many attempts. Please try again later.");
      } else if (error.message.includes("400")) {
        setError("Invalid phone number format.");
      } else {
        setError(error.message || "Failed to send OTP. Please try again.");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const verifyOTP = async (phone: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate phone number
      const validation = validatePhoneNumber(phone);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid phone number");
      }

      // Verify OTP with Twilio
      const result = await twilioClient.verifyCode(validation.formatted, otp);

      if (result.status === "approved") {
        // Create user object
        const userData: User = {
          id: `user_${Date.now()}`,
          phone: validation.formatted,
          verified: true,
          createdAt: new Date().toISOString(),
        };

        // Set session expiry (24 hours from now)
        const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Store user and session
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("sessionExpiry", sessionExpiry.toISOString());
        localStorage.removeItem("authPhone");

        setUser(userData);
        console.log("Login successful:", userData);
      } else {
        throw new Error("OTP verification failed");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);

      // Handle specific errors
      if (error.message.includes("404")) {
        setError("Invalid OTP. Please try again.");
      } else if (error.message.includes("429")) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(error.message || "Failed to verify OTP. Please try again.");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear all stored auth data
      localStorage.removeItem("user");
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("authPhone");
      localStorage.removeItem("cartId"); // Clear cart on logout

      setUser(null);
      console.log("Logout successful");
    } catch (error: any) {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("authPhone");
      localStorage.removeItem("cartId");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        login,
        verifyOTP,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
