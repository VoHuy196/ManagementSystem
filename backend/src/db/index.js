import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ [DB] MongoDB connected successfully");
  } catch (err) {
    console.error("❌ [DB] MongoDB connection FAILED:", err.message);
    process.exit(1);
  }
};

export default connectDB;
