import mongoose from "mongoose";
import { Attendance } from "../models/attendance.model.js";
import { LeaveRequest } from "../models/leaveRequest.model.js";
import { Project } from "../models/projects.model.js";
import { Task } from "../models/tasks.model.js";
import { Employee } from "../models/employees.model.js";
import { Worklog } from "../models/worklog.model.js";
import { Performance } from "../models/performance.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import dayjs from "dayjs";

const getOverviewStats = asyncHandler(async (req, res) => {
  const [totalEmployees, totalProjects, totalTasks, pendingLeaves] = await Promise.all([
    Employee.countDocuments(),
    Project.countDocuments({ status: "active" }),
    Task.countDocuments({ status: { $ne: "Done" } }),
    LeaveRequest.countDocuments({ status: "Pending" }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { totalEmployees, totalProjects, totalTasks, pendingLeaves },
      "Overview stats fetched successfully"
    )
  );
});

const getAttendanceStats = asyncHandler(async (req, res) => {
  const period = req.query.period || dayjs().format("YYYY-MM");
  
  const start = dayjs(period).startOf("month").toDate();
  const end = dayjs(period).endOf("month").toDate();

  const [present, absent, leaves] = await Promise.all([
    Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: "Present" }),
    Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: "Absent" }),
    LeaveRequest.countDocuments({ 
        startDate: { $lte: end }, 
        endDate: { $gte: start }, 
        status: "Approved" 
    }),
  ]);

  res.status(200).json(
    new ApiResponse(200, { present, absent, leaves }, "Attendance stats fetched successfully")
  );
});

const getProjectProgressStats = asyncHandler(async (req, res) => {
  const projects = await Project.find({ status: "active" }).select("name");
  
  const progressData = await Promise.all(projects.map(async (project) => {
    const total = await Task.countDocuments({ project: project._id });
    const done = await Task.countDocuments({ project: project._id, status: "Done" });
    const percentage = total > 0 ? (done / total) * 100 : 0;
    
    return {
      name: project.name,
      total,
      done,
      percentage: Math.round(percentage),
    };
  }));

  res.status(200).json(
    new ApiResponse(200, progressData, "Project progress stats fetched successfully")
  );
});

// GET /stats/worklogs – total hours grouped by department (last 6 months)
const getWorklogStats = asyncHandler(async (req, res) => {
  const since = dayjs().subtract(6, "month").startOf("month").toDate();

  // Group worklogs by month
  const byMonth = await Worklog.aggregate([
    { $match: { entryDate: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$entryDate" } },
        totalHours: { $sum: "$hours" },
        entries: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const result = byMonth.map((m) => ({
    month: m._id,
    hours: parseFloat(m.totalHours.toFixed(1)),
    entries: m.entries,
  }));

  res.status(200).json(new ApiResponse(200, result, "Worklog stats fetched"));
});

// GET /stats/tasks – done vs pending count per month (last 6 months)
const getTaskCompletionStats = asyncHandler(async (req, res) => {
  const since = dayjs().subtract(6, "month").startOf("month").toDate();

  const tasks = await Task.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  // Reshape into { month, done, inProgress, todo }
  const map = {};
  tasks.forEach(({ _id, count }) => {
    const m = _id.month;
    if (!map[m]) map[m] = { month: m, Done: 0, "In Progress": 0, Todo: 0 };
    map[m][_id.status] = (map[m][_id.status] || 0) + count;
  });

  res.status(200).json(new ApiResponse(200, Object.values(map), "Task completion stats fetched"));
});

// GET /stats/performance – average KPI score per month (last 6 months)
const getPerformanceStats = asyncHandler(async (req, res) => {
  // Performance.period is a "YYYY-MM" string, not a Date — use string comparison
  const since = dayjs().subtract(5, "month").startOf("month").format("YYYY-MM"); // inclusive

  const perf = await Performance.aggregate([
    { $match: { period: { $gte: since } } },
    {
      $group: {
        _id: "$period",
        avgScore: { $avg: "$finalScore" }, // ← correct field name
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const result = perf.map((p) => ({
    month: p._id,
    avgScore: parseFloat((p.avgScore || 0).toFixed(1)),
    count: p.count,
  }));

  res.status(200).json(new ApiResponse(200, result, "Performance stats fetched"));
});

export {
  getOverviewStats,
  getAttendanceStats,
  getProjectProgressStats,
  getWorklogStats,
  getTaskCompletionStats,
  getPerformanceStats,
};
