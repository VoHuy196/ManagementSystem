import { httpServer } from "./app.js";
import connectDB from "./db/index.js";
import express from "express";

const PORT = process.env.PORT || 3000;

const app = express();

console.log("🚀 [STARTUP] Starting connectDB()...");

connectDB()
  .then(() => {
    console.log(
      "✅ [STARTUP] connectDB succeeded, starting HTTP server on PORT",
      PORT
    );
    httpServer.listen(PORT, () => {
      console.log(
        `🎉 [SERVER] Backend running successfully on http://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("💥 [STARTUP] connectDB FAILED:", err.message);
    process.exit(1);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
