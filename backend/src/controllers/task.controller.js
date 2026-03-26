import { Task } from "../models/tasks.model.js";
import { ActionLog } from "../models/actionLog.model.js";
import smartAssign from "../utils/smartAssign.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName");

  if (!tasks || tasks.length === 0) {
    throw new ApiError(404, "No tasks found");
  }

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

  res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (task.assignedTo) {
    throw new ApiError(400, "Task is already assigned to a user");
  }

  const user = await smartAssign();

  if (!user) {
    throw new ApiError(500, "No users available for task assignment");
  }

  task.assignedTo = user._id;

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

  res
    .status(200)
    .json(
      new ApiResponse(200, { task: updatedTask }, "Task assigned successfully")
    );
});

export {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTask,
};
