import { Comment } from "../models/comment.model.js";
import { Task } from "../models/tasks.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

// GET /api/comments/:taskId  – get all comments for a task
const getComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const comments = await Comment.find({ task: taskId })
    .populate("author", "fullName email")
    .sort({ createdAt: 1 });

  res.status(200).json(new ApiResponse(200, { comments }, "Comments fetched successfully"));
});

// POST /api/comments/:taskId  – add comment to a task
const createComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) throw new ApiError(400, "Comment content cannot be empty");

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const comment = await Comment.create({
    task: taskId,
    author: req.user._id,
    content: content.trim(),
  });

  const populated = await Comment.findById(comment._id).populate("author", "fullName email");

  // Realtime broadcast
  const io = req.app.get("io");
  if (io) io.to(`task_${taskId}`).emit("commentAdded", { comment: populated });

  res.status(201).json(new ApiResponse(201, { comment: populated }, "Comment added successfully"));
});

// PATCH /api/comments/:commentId  – edit own comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) throw new ApiError(400, "Content cannot be empty");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  comment.content = content.trim();
  comment.isEdited = true;
  await comment.save();

  const populated = await Comment.findById(comment._id).populate("author", "fullName email");
  res.status(200).json(new ApiResponse(200, { comment: populated }, "Comment updated"));
});

// DELETE /api/comments/:commentId  – delete own comment (or Admin)
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const isOwner = comment.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "Admin";
  if (!isOwner && !isAdmin) throw new ApiError(403, "Forbidden");

  const taskId = comment.task.toString();
  await comment.deleteOne();

  const io = req.app.get("io");
  if (io) io.to(`task_${taskId}`).emit("commentDeleted", { commentId });

  res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));
});

export { getComments, createComment, updateComment, deleteComment };
