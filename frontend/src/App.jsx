import React from "react";
import { RouterProvider } from "react-router-dom";
import AppRoutes from "./routes/Routes.jsx";
import { Toaster } from "react-hot-toast";
import ThemeWrapper from "./components/ThemeWrapper";

const App = () => {
  return (
    <ThemeWrapper>
      <>
        <RouterProvider router={AppRoutes} />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              padding: "12px 16px",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
            },
            success: {
              style: {
                background: "#1f2937",
                color: "#f9fafb",
                border: "1px solid #10b981",
              },
              iconTheme: {
                primary: "#10b981",
                secondary: "#1f2937",
              },
            },
            error: {
              style: {
                background: "#1f2937",
                color: "#f9fafb",
                border: "1px solid #ef4444",
              },
              iconTheme: {
                primary: "#ef4444",
                secondary: "#1f2937",
              },
            },
            loading: {
              style: {
                background: "#1f2937",
                color: "#f9fafb",
                border: "1px solid #6b7280",
              },
              iconTheme: {
                primary: "#6b7280",
                secondary: "#1f2937",
              },
            },
            custom: {
              style: {
                background: "#1f2937",
                border: "1px solid #374151",
                padding: "16px",
                maxWidth: "400px",
                color: "inherit",
              },
            },
          }}
        />
      </>
    </ThemeWrapper>
  );
};

export default App;
