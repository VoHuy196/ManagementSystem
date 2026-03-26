import mongoose from "mongoose";

const worklogSchema = new mongoose.Schema(
  {
    entryDate: {
      type: Date,
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Worklog = mongoose.model("Worklog", worklogSchema);

