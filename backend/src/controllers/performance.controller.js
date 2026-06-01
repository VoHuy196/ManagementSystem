import { Performance } from "../models/performance.model.js";
import { Employee } from "../models/employees.model.js";
import { Task } from "../models/tasks.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import dayjs from "dayjs";

const calculatePerformance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const period = req.query.period || dayjs().format("YYYY-MM");

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  // Lấy tất cả task được giao cho nhân viên này (dựa trên userId của họ)
  const totalTasks = await Task.countDocuments({
    assignedTo: employee.user,
    createdAt: {
      $gte: dayjs(period).startOf("month").toDate(),
      $lte: dayjs(period).endOf("month").toDate(),
    },
  });

  const completedTasks = await Task.countDocuments({
    assignedTo: employee.user,
    status: "Done",
    updatedAt: {
      $gte: dayjs(period).startOf("month").toDate(),
      $lte: dayjs(period).endOf("month").toDate(),
    },
  });

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const score = (completionRate / 10).toFixed(2);

  const performance = await Performance.findOneAndUpdate(
    { employee: employeeId, period },
    {
      totalTasks,
      completedTasks,
      taskCompletionRate: completionRate,
      finalScore: score,
    },
    { upsert: true, new: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, performance, "Performance calculated successfully"));
});

const getRanking = asyncHandler(async (req, res) => {
  const period = req.query.period || dayjs().format("YYYY-MM");

  const rankings = await Performance.find({ period })
    .populate({
      path: "employee",
      select: "name employeeCode",
    })
    .sort({ finalScore: -1 })
    .limit(10);

  res
    .status(200)
    .json(new ApiResponse(200, rankings, "Ranking fetched successfully"));
});

const getMyStats = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) {
    throw new ApiError(404, "Employee profile not found");
  }

  const stats = await Performance.find({ employee: employee._id })
    .sort({ period: 1 })
    .limit(12);

  res
    .status(200)
    .json(new ApiResponse(200, stats, "Your performance stats fetched successfully"));
});

export { calculatePerformance, getRanking, getMyStats };
