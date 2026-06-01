import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    period: {
      type: String, // Format: YYYY-MM
      required: true,
    },
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    taskCompletionRate: {
      type: Number,
      default: 0,
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi nhân viên chỉ có 1 bản ghi hiệu suất cho mỗi kỳ (tháng)
performanceSchema.index({ employee: 1, period: 1 }, { unique: true });

export const Performance = mongoose.model("Performance", performanceSchema);
