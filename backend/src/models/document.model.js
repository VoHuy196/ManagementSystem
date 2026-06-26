import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    }, // "Quyết định", "Hợp đồng", "Thông báo", "Tài liệu kỹ thuật", etc.
    department: {
      type: String,
      required: true,
      trim: true,
    }, // "HR", "Engineering", "Marketing", "Sales", "Finance", etc.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Archived"],
      default: "Published",
    },
  },
  { timestamps: true }
);

documentSchema.index({ department: 1, category: 1 });

export const Document = mongoose.model("Document", documentSchema);
