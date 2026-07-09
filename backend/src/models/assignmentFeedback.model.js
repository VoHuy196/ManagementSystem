import mongoose from "mongoose";

const assignmentFeedbackSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskType: { type: String, default: "" },
    taskTitle: { type: String, default: "" },
    department: { type: String, default: "" },
    // true if manager picked the AI's #1 suggestion
    aiSuggested: { type: Boolean, default: false },
    // AI confidence score that was shown (0-99)
    aiConfidenceShown: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for fast lookup by user
assignmentFeedbackSchema.index({ assignedUser: 1, createdAt: -1 });
assignmentFeedbackSchema.index({ task: 1 });

export const AssignmentFeedback = mongoose.model("AssignmentFeedback", assignmentFeedbackSchema);
