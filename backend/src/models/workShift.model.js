import mongoose from "mongoose";

const workShiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },  // Format: "HH:mm" e.g. "08:00"
    endTime: { type: String, required: true },      // Format: "HH:mm" e.g. "12:00"
    color: { type: String, default: "#1890ff" },
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

export const WorkShift = mongoose.model("WorkShift", workShiftSchema);
