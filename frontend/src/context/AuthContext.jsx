import { createContext, useContext, useState, useEffect } from "react";
import React from "react";
import cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Restore auth state on mount - synchronously read before rendering
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = cookies.get("token");

    if (stored && stored !== "undefined" && token) {
      try {
        const userData = JSON.parse(stored);
        // Restore token to userData if missing
        if (!userData.token) {
          userData.token = token;
        }
        setUser(userData);
      } catch (err) {
        console.error("Failed to restore user:", err);
        localStorage.removeItem("user");
        cookies.remove("token", { path: "/" });
      }
    } else {
      // Clear invalid data
      if (!token || !stored) {
        localStorage.removeItem("user");
        cookies.remove("token", { path: "/" });
      }
    }
    // Mark auth restoration as complete
    setIsAuthLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    // Use secure only on HTTPS, not on localhost HTTP
    const isSecure = window.location.protocol === "https:";
    cookies.set("token", userData.token, { path: "/", secure: isSecure });
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    cookies.remove("token", { path: "/" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
