import { WorkSession } from "../models/workSession.model.js";
import { WorkShift } from "../models/workShift.model.js";
import { Task } from "../models/tasks.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

// Helper to auto-detect shift from a given time
const detectShift = async (date) => {
  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const shifts = await WorkShift.find({ isActive: true });
  for (const shift of shifts) {
    if (timeStr >= shift.startTime && timeStr < shift.endTime) {
      return shift._id;
    }
  }
  return null;
};

const startSession = asyncHandler(async (req, res) => {
  const { taskId, notes } = req.body;
  if (!taskId) throw new ApiError(400, "Task ID is required");

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  // Check if user already has an active session
  const activeSession = await WorkSession.findOne({
    user: req.user._id,
    status: "active",
  });
  if (activeSession) {
    throw new ApiError(
      400,
      "You already have an active session. Please stop it first."
    );
  }

  const now = new Date();
  const shiftId = await detectShift(now);

  const session = await WorkSession.create({
    user: req.user._id,
    task: taskId,
    project: task.project || null,
    startTime: now,
    shift: shiftId,
    status: "active",
    notes,
  });

  const populated = await WorkSession.findById(session._id)
    .populate("task", "title")
    .populate("shift", "name startTime endTime color")
    .populate("user", "fullName");

  res
    .status(201)
    .json(new ApiResponse(201, populated, "Session started successfully"));
});

const stopSession = asyncHandler(async (req, res) => {
  const session = await WorkSession.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.status === "completed")
    throw new ApiError(400, "Session already completed");

  const now = new Date();
  session.endTime = now;
  session.duration = Math.round((now - session.startTime) / 60000); // minutes
  session.status = "completed";
  await session.save();

  const populated = await WorkSession.findById(session._id)
    .populate("task", "title")
    .populate("shift", "name startTime endTime color")
    .populate("user", "fullName");

  res
    .status(200)
    .json(new ApiResponse(200, populated, "Session stopped successfully"));
});

const pauseSession = asyncHandler(async (req, res) => {
  const session = await WorkSession.findById(req.params.id);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.status !== "active")
    throw new ApiError(400, "Session is not active");

  const now = new Date();
  session.endTime = now;
  session.duration = Math.round((now - session.startTime) / 60000);
  session.status = "paused";
  await session.save();

  res
    .status(200)
    .json(new ApiResponse(200, session, "Session paused successfully"));
});

const getActiveSessions = asyncHandler(async (req, res) => {
  const sessions = await WorkSession.find({
    user: req.user._id,
    status: "active",
  })
    .populate("task", "title")
    .populate("shift", "name startTime endTime color")
    .populate("project", "name");

  res
    .status(200)
    .json(new ApiResponse(200, sessions, "Active sessions fetched"));
});

const getSessionHistory = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate, projectId } = req.query;
  const filter = {};

  if (userId) filter.user = userId;
  if (projectId) filter.project = projectId;
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  const sessions = await WorkSession.find(filter)
    .populate("task", "title status")
    .populate("shift", "name startTime endTime color")
    .populate("user", "fullName")
    .populate("project", "name")
    .sort({ startTime: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, sessions, "Session history fetched"));
});

export {
  startSession,
  stopSession,
  pauseSession,
  getActiveSessions,
  getSessionHistory,
};
