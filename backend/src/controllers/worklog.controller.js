import mongoose from "mongoose";
import { Worklog } from "../models/worklog.model.js";
import { Task } from "../models/tasks.model.js";
import { Employee } from "../models/employees.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const getWorklogs = asyncHandler(async (req, res) => {
  const worklogs = await Worklog.find()
    .populate("task", "title project")
    .populate("employee", "name employeeCode");

  res
    .status(200)
    .json(new ApiResponse(200, { worklogs }, "Worklogs fetched successfully"));
});

const createWorklog = asyncHandler(async (req, res) => {
  const { entryDate, task, hours, description, employee } = req.body;

  if (!entryDate || !task || !hours || !employee) {
    throw new ApiError(400, "Entry date, task, hours, and employee are required");
  }

  if (hours <= 0) {
    throw new ApiError(400, "Hours must be positive");
  }

  const taskExists = await Task.findById(task);
  if (!taskExists) {
    throw new ApiError(400, "Task not found");
  }

  const employeeExists = await Employee.findById(employee);
  if (!employeeExists) {
    throw new ApiError(400, "Employee not found");
  }

  const worklog = await Worklog.create({
    entryDate,
    task,
    hours,
    description,
    employee,
  });

  const createdWorklog = await Worklog.findById(worklog._id)
    .populate("task", "title")
    .populate("employee", "name employeeCode");

  res
    .status(201)
    .json(new ApiResponse(201, { worklog: createdWorklog }, "Worklog created successfully"));
});

const getWorklogsByTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const worklogs = await Worklog.find({ task: taskId })
    .populate("employee", "name employeeCode");

  const totalHours = await Worklog.aggregate([
    { $match: { task: new mongoose.Types.ObjectId(taskId) } },
    { $group: { _id: null, totalHours: { $sum: "$hours" } } }
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, { worklogs, totalHours: totalHours[0]?.totalHours || 0 }, "Task worklogs fetched successfully"));
});

export {
  getWorklogs,
  createWorklog,
  getWorklogsByTask,
};

