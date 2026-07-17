import axios from "axios";
import { Task } from "../models/tasks.model.js";
import { ActionLog } from "../models/actionLog.model.js";
import { Employee } from "../models/employees.model.js";
import { Performance } from "../models/performance.model.js";
import { AssignmentFeedback } from "../models/assignmentFeedback.model.js";
import smartAssign from "../utils/smartAssign.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { sendTaskAssignedEmail } from "../utils/emailService.js";

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName");

  // Trả về array rỗng nếu không có task, không nên throw 404
  res
    .status(200)
    .json(new ApiResponse(200, { tasks }, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, taskType, startDate, dueDate, sprint, labels } = req.body;

  if (!title || !description || !priority) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const validPriorities = ["Low", "Medium", "High"];

  if (!validPriorities.includes(priority)) {
    throw new ApiError(400, "Invalid priority value");
  }
  const existingTask = await Task.findOne({ title });

  if (existingTask) {
    throw new ApiError(400, "Task with this title already exists");
  }

  const createdBy = req.user._id;

  if (!createdBy) {
    throw new ApiError(400, "User not authenticated");
  }

  const task = await Task.create({
    title,
    description,
    priority,
    taskType,
    startDate,
    dueDate,
    sprint,
    labels: labels || [],
    createdBy,
  });

  if (!task) {
    throw new ApiError(500, "Something went wrong while creating task");
  }

  const createdTask = await Task.findById(task._id).populate(
    "assignedTo",
    "fullName"
  );

  if (!createdTask) {
    throw new ApiError(500, "Something went wrong while fetching created task");
  }

  const actionLog = await ActionLog.create({
    action: "Task Created",
    user: createdBy,
    task: task._id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for task creation");
  }

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('taskCreated', { task: createdTask });
  }

  res
    .status(201)
    .json(new ApiResponse(201, { task }, "Task created successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task ID is required");
  }

  const { title, description, status, priority, taskType, startDate, dueDate, sprint, labels, lastModified, forceUpdate } =
    req.body;

  if (!title && !description && !status && !priority) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const task = await Task.findById(id)
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Conflict detection: Check if task was modified since client last saw it
  // Skip conflict detection if forceUpdate is true (user explicitly chose to override)
  if (
    !forceUpdate &&
    lastModified &&
    new Date(task.updatedAt) > new Date(lastModified)
  ) {
    // Task has been modified by another user - return conflict data
    const conflictData = {
      isConflict: true,
      clientTask: req.body, // What the client is trying to save
      serverTask: {
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        updatedAt: task.updatedAt,
        assignedTo: task.assignedTo,
        createdBy: task.createdBy,
      },
      message:
        "This task has been modified by another user. Please choose how to resolve the conflict.",
    };

    return res.status(409).json(conflictData);
  }

  if (title) {
    task.title = title;
  }

  if (description) {
    task.description = description;
  }

  if (status) {
    const validStatuses = ["Todo", "In Progress", "Done"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }
    task.status = status;
  }

  if (priority) {
    const validPriorities = ["Low", "Medium", "High"];
    if (!validPriorities.includes(priority)) {
      throw new ApiError(400, "Invalid priority value");
    }
    task.priority = priority;
  }

  if (taskType !== undefined) {
    const validTaskTypes = ["Story", "Bug", "Task", "Epic"];
    if (taskType && !validTaskTypes.includes(taskType)) {
      throw new ApiError(400, "Invalid task type");
    }
    task.taskType = taskType;
  }
  if (startDate !== undefined) {
    task.startDate = startDate;
  }
  if (dueDate !== undefined) {
    task.dueDate = dueDate;
  }
  if (sprint !== undefined) {
    task.sprint = sprint;
  }
  if (labels !== undefined) {
    task.labels = labels;
  }

  const updatedTask = await task.save();

  if (!updatedTask) {
    throw new ApiError(500, "Something went wrong while updating task");
  }

  const actionLog = await ActionLog.create({
    action: "Task Updated",
    user: req.user._id,
    task: id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for task update");
  }

  const populatedTask = await Task.findById(updatedTask._id)
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName");

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('taskUpdated', { task: populatedTask });
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { task: populatedTask }, "Task updated successfully")
    );
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const validStatuses = ["Todo", "In Progress", "Done"];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  task.status = status;

  const updatedTask = await task.save();

  if (!updatedTask) {
    throw new ApiError(500, "Something went wrong while updating task status");
  }

  const actionLog = await ActionLog.create({
    action: "Task Status Updated",
    user: req.user._id,
    task: id,
  });

  if (!actionLog) {
    throw new ApiError(
      500,
      "Failed to create action log for task status update"
    );
  }

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('taskUpdated', { task: updatedTask });
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { task: updatedTask },
        "Task status updated successfully"
      )
    );
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const deletedTask = await Task.findByIdAndDelete(id);

  if (!deletedTask) {
    throw new ApiError(500, "Something went wrong while deleting task");
  }

  const actionLog = await ActionLog.create({
    action: "Task Deleted",
    user: req.user._id,
    task: id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for task deletion");
  }

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('taskDeleted', { taskId: id });
  }

  res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Admin có thể truyền userId cụ thể qua body, nếu không thì dùng smart assign
  const { userId } = req.body;

  if (!id) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Bỏ kiểm tra "already assigned" — Admin/Manager có thể re-assign bất kỳ lúc nào
  let assignedUser;
  if (userId) {
    // Manual assignment: Admin chỉ định cụ thể
    const { User } = await import("../models/users.model.js");
    assignedUser = await User.findById(userId);
    if (!assignedUser) {
      throw new ApiError(404, "User not found");
    }
  } else {
    // Smart assign: chọn user có ít task nhất
    assignedUser = await smartAssign();
    if (!assignedUser) {
      throw new ApiError(500, "No users available for task assignment");
    }
  }

  task.assignedTo = assignedUser._id;

  const updatedTask = await task.save();

  if (!updatedTask) {
    throw new ApiError(500, "Something went wrong while assigning task");
  }

  const actionLog = await ActionLog.create({
    action: "Task Assigned",
    user: req.user._id,
    task: id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for task assignment");
  }

  // ── Save assignment feedback for AI learning ────────────────────────
  // aiSuggested = true when the caller explicitly says so (passed as body flag)
  try {
    const empProfile = await Employee.findOne({ user: assignedUser._id }).select("department");
    await AssignmentFeedback.create({
      task: id,
      assignedUser: assignedUser._id,
      assignedBy: req.user._id,
      taskType: task.taskType || "",
      taskTitle: task.title || "",
      department: empProfile?.department || "",
      aiSuggested: req.body?.aiSuggested === true,
      aiConfidenceShown: req.body?.aiConfidenceShown || 0,
    });
  } catch (fbErr) {
    // Non-critical – don't fail the whole request
    console.warn("[FEEDBACK] Could not save assignment feedback:", fbErr.message);
  }

  // Populate for response
  const populatedTask = await Task.findById(updatedTask._id)
    .populate("assignedTo", "fullName email")
    .populate("createdBy", "fullName");

  // ── Send email notification (non-blocking) ──────────────────────────
  try {
    if (assignedUser.email) {
      const assigner = await import("../models/users.model.js").then(m => m.User.findById(req.user._id).select("fullName"));
      sendTaskAssignedEmail({
        toEmail:        assignedUser.email,
        toName:         assignedUser.fullName,
        taskTitle:      task.title,
        taskType:       task.taskType || "Task",
        priority:       task.priority,
        dueDate:        task.dueDate,
        assignedByName: assigner?.fullName || "Manager",
      }).catch(() => {}); // fire & forget
    }
  } catch (_) {}

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('taskAssigned', { task: populatedTask });
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { task: populatedTask }, `Task assigned to ${assignedUser.fullName} successfully`)
    );
});

const getTaskRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // 1. Get all employees with user accounts
  const employees = await Employee.find().populate("user");
  
  // Filter out admins/managers: only assign to "Employee" role users
  const candidateEmployees = employees.filter(emp => emp.user && emp.user.role === "Employee");

  if (candidateEmployees.length === 0) {
    // If no candidate employees, allow all users with Employee role
    const { User } = await import("../models/users.model.js");
    const fallbackUsers = await User.find({ role: "Employee" });
    if (fallbackUsers.length === 0) {
      return res.status(200).json(new ApiResponse(200, { predictions: [] }, "No employees available"));
    }
    const predictions = fallbackUsers.map(u => ({
      employeeId: u._id,
      fullName: u.fullName,
      confidence: 50,
      reason: "Gợi ý mặc định (chưa liên kết hồ sơ nhân sự)"
    }));
    return res.status(200).json(new ApiResponse(200, { predictions }, "Fallback recommendations fetched"));
  }

  // 2. Fetch pending task counts + skills for each candidate
  const employeesData = await Promise.all(
    candidateEmployees.map(async (emp) => {
      const pendingTasksCount = await Task.countDocuments({
        assignedTo: emp.user._id,
        status: { $ne: "Done" }
      });
      return {
        id: emp.user._id.toString(),
        fullName: emp.name || emp.user.fullName,
        department: emp.department || "General",
        pendingTasksCount,
        skills: emp.skills || []
      };
    })
  );

  // 2b. Fetch recent assignment feedback (last 200 records) for AI learning
  const recentFeedback = await AssignmentFeedback.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .select("assignedUser taskType department aiSuggested");

  const feedbackHistory = recentFeedback.map(fb => ({
    assignedUserId: fb.assignedUser.toString(),
    taskType: fb.taskType || "",
    department: fb.department || "",
    aiSuggested: fb.aiSuggested
  }));

  // 3. Fetch historical completed tasks
  const historicalTasks = await Task.find({
    status: "Done",
    assignedTo: { $exists: true }
  }).select("title description assignedTo status priority taskType").limit(100);

  // We can attach average rating from Performance database if available
  const historicalTasksData = await Promise.all(
    historicalTasks.map(async (t) => {
      // Find employee profile for this user
      const emp = employees.find(e => e.user && e.user._id.toString() === t.assignedTo.toString());
      let rating = 3.0; // default medium rating
      if (emp) {
        // Fetch average performance score
        const perfs = await Performance.find({ employee: emp._id });
        if (perfs.length > 0) {
          const sum = perfs.reduce((acc, curr) => acc + curr.finalScore, 0);
          rating = (sum / perfs.length) / 2.0; // scale 10 to 5
        }
      }
      return {
        title: t.title,
        description: t.description || "",
        assignedTo: t.assignedTo.toString(),
        status: t.status,
        rating
      };
    })
  );

  // 4. Send request to Python FastAPI AI microservice
  try {
    const aiResponse = await axios.post("http://localhost:8000/ai/predict-assignee", {
      task: {
        title: task.title,
        description: task.description || "",
        taskType: task.taskType || "Task",
        priority: task.priority || "Medium"
      },
      employees: employeesData,
      historicalTasks: historicalTasksData,
      feedbackHistory          // ← new: manager choice history
    }, { timeout: 8000 });    // increased timeout: cached embeddings are fast now

    if (aiResponse.status === 200 && aiResponse.data?.predictions) {
      return res.status(200).json(
        new ApiResponse(200, { predictions: aiResponse.data.predictions }, "AI Recommendations fetched successfully")
      );
    }
  } catch (error) {
    console.error("AI Service Error:", error.message);
  }

  // Fallback: rule-based sorting if Python service is offline
  const sortedCandidates = employeesData.sort((a, b) => a.pendingTasksCount - b.pendingTasksCount);
  const predictions = sortedCandidates.slice(0, 3).map(emp => ({
    employeeId: emp.id,
    fullName: emp.fullName,
    confidence: Math.max(50 - emp.pendingTasksCount * 2, 10),
    reason: `Gợi ý theo tải lượng công việc hiện tại (${emp.pendingTasksCount} task đang xử lý - AI Offline).`
  }));

  res.status(200).json(
    new ApiResponse(200, { predictions }, "Rule-based recommendations fetched (AI Offline)")
  );
});

// POST /api/tasks/:id/attachments  – upload file (base64) to task
const uploadAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { originalName, mimeType, size, data } = req.body; // data = base64 string

  if (!originalName || !mimeType || !size || !data) {
    throw new ApiError(400, "originalName, mimeType, size, and data are required");
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (size > MAX_SIZE) throw new ApiError(400, "File size exceeds 5 MB limit");

  const ALLOWED_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv",
    "application/zip", "application/x-zip-compressed",
  ];
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new ApiError(400, `File type "${mimeType}" is not allowed`);
  }

  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, "Task not found");

  task.attachments.push({
    originalName,
    mimeType,
    size,
    data,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  });

  await task.save();

  // Return task without attachment data to keep response small
  const newAttachment = task.attachments[task.attachments.length - 1];
  const safeAttachment = {
    _id:          newAttachment._id,
    originalName: newAttachment.originalName,
    mimeType:     newAttachment.mimeType,
    size:         newAttachment.size,
    uploadedBy:   newAttachment.uploadedBy,
    uploadedAt:   newAttachment.uploadedAt,
  };

  res.status(201).json(new ApiResponse(201, { attachment: safeAttachment }, "File uploaded successfully"));
});

// DELETE /api/tasks/:id/attachments/:attachmentId
const deleteAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, "Task not found");

  const att = task.attachments.id(attachmentId);
  if (!att) throw new ApiError(404, "Attachment not found");

  // Only uploader or Admin can delete
  const isOwner = att.uploadedBy?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "Admin") throw new ApiError(403, "Forbidden");

  att.deleteOne();
  await task.save();

  res.status(200).json(new ApiResponse(200, {}, "Attachment deleted"));
});

// GET /api/tasks/:id/attachments/:attachmentId/download
const downloadAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  const task = await Task.findById(id).select("attachments");
  if (!task) throw new ApiError(404, "Task not found");

  const att = task.attachments.id(attachmentId);
  if (!att) throw new ApiError(404, "Attachment not found");

  const buffer = Buffer.from(att.data, "base64");
  res.setHeader("Content-Type", att.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${att.originalName}"`);
  res.setHeader("Content-Length", buffer.length);
  res.end(buffer);
});

export {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTask,
  getTaskRecommendations,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment,
};
