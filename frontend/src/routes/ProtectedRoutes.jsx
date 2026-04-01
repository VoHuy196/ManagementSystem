import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ProtectedRoute = ({ children }) => {
  const { user, isAuthLoading } = useAuth();
  const [showError, setShowError] = React.useState(false);

  // Only show error after auth loading is complete
  useEffect(() => {
    if (!isAuthLoading && !user) {
      setShowError(true);
    }
  }, [isAuthLoading, user]);

  // Show toast error only when showError changes (not during render)
  useEffect(() => {
    if (showError) {
      toast.error("You need to log in to access this page.");
    }
  }, [showError]);

  // Show loading spinner while restoring auth
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // Redirect to login only after auth is confirmed as empty
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
