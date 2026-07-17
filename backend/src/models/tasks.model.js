import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Done"],
      default: "Todo",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true,
    },
    taskType: {
      type: String,
      enum: ["Story", "Bug", "Task", "Epic"],
      default: "Task",
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    sprint: {
      type: String,
      trim: true,
    },
    labels: [{
      type: String,
      trim: true,
    }],
    createdBy: {

      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    attachments: [
      {
        originalName: { type: String, required: true },
        mimeType:     { type: String, required: true },
        size:         { type: Number, required: true }, // bytes
        data:         { type: String, required: true }, // base64
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model("Task", taskSchema);
