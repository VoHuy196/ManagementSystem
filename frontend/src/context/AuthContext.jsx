import { createContext, useContext, useState, useEffect } from "react";
import React from "react";
import cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Hàm hỗ trợ clear data để code gọn hơn
  const handleClearAuth = () => {
    localStorage.removeItem("user");
    cookies.remove("token", { path: "/" });
    setUser(null);
  };

  // Restore auth state on mount
  useEffect(() => {
    const stored = localStorage.getItem("user");
    const tokenFromCookie = cookies.get("token");

    if (stored && stored !== "undefined") {
      try {
        const userData = JSON.parse(stored);
        
        // Cố gắng tìm token từ Cookie, nếu không có thì tìm trong localStorage
        const token = tokenFromCookie || userData.token || userData.accessToken;

        // Nếu có userData, cho phép duy trì đăng nhập 
        // Rất quan trọng nếu backend dùng HttpOnly cookie vì tokenFromCookie sẽ undefined
        if (userData) {
          // Khôi phục token vào object nếu nó bị thiếu
          if (!userData.token && token) {
            userData.token = token;
          }
          setUser(userData);
        } else {
          handleClearAuth();
        }
      } catch (err) {
        console.error("Failed to restore user:", err);
        handleClearAuth();
      }
    } else {
      handleClearAuth();
    }
    
    // Đánh dấu đã load xong Auth
    setIsAuthLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Đảm bảo lấy đúng field token để set vào cookie
    const tokenToSet = userData.token || userData.accessToken;
    
    if (tokenToSet) {
      const isSecure = window.location.protocol === "https:";
      cookies.set("token", tokenToSet, { path: "/", secure: isSecure });
    }
    
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