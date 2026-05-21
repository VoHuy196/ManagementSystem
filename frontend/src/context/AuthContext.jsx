import { createContext, useContext, useState, useEffect } from "react";
import React from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Hàm hỗ trợ clear data
  const handleClearAuth = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // Restore auth state on mount (from localStorage)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch (err) {
        console.error("Failed to restore user:", err);
        handleClearAuth();
      }
    }
    setIsAuthLoading(false);
  }, []);

  const login = (userData) => {
    // Lưu user data vào localStorage
    // Token được backend set thành httpOnly cookie (browser sẽ tự gửi)
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    handleClearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);