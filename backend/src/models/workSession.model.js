import mongoose from "mongoose";

const workSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number },  // in minutes, auto-calculated
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkShift",
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused"],
      default: "active",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const WorkSession = mongoose.model("WorkSession", workSessionSchema);
