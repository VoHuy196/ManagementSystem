import mongoose from "mongoose";
import { WorkSession } from "../models/workSession.model.js";
import { WorkShift } from "../models/workShift.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import dayjs from "dayjs";

// Build a date range filter from query params
const buildDateFilter = (req) => {
  const { startDate, endDate, period } = req.query;
  const filter = {};

  if (startDate && endDate) {
    filter.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (period) {
    const now = dayjs();
    switch (period) {
      case "week":
        filter.startTime = {
          $gte: now.startOf("week").toDate(),
          $lte: now.endOf("week").toDate(),
        };
        break;
      case "month":
        filter.startTime = {
          $gte: now.startOf("month").toDate(),
          $lte: now.endOf("month").toDate(),
        };
        break;
      case "quarter":
        filter.startTime = {
          $gte: now.subtract(3, "month").startOf("month").toDate(),
          $lte: now.endOf("month").toDate(),
        };
        break;
      default:
        filter.startTime = {
          $gte: now.startOf("week").toDate(),
          $lte: now.endOf("week").toDate(),
        };
    }
  } else {
    // Default: this month
    const now = dayjs();
    filter.startTime = {
      $gte: now.startOf("month").toDate(),
      $lte: now.endOf("month").toDate(),
    };
  }

  if (req.query.userId)
    filter.user = new mongoose.Types.ObjectId(req.query.userId);
  if (req.query.projectId)
    filter.project = new mongoose.Types.ObjectId(req.query.projectId);

  return filter;
};

// GET /workload-stats/by-shift
const getWorkloadByShift = asyncHandler(async (req, res) => {
  const filter = buildDateFilter(req);
  filter.status = "completed";

  const shifts = await WorkShift.find({ isActive: true }).sort({
    startTime: 1,
  });

  const stats = await WorkSession.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$shift",
        totalSessions: { $sum: 1 },
        totalMinutes: { $sum: "$duration" },
        uniqueTasks: { $addToSet: "$task" },
        uniqueUsers: { $addToSet: "$user" },
      },
    },
  ]);

  const result = shifts.map((shift) => {
    const stat = stats.find(
      (s) => s._id && s._id.toString() === shift._id.toString()
    );
    return {
      shift: {
        _id: shift._id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        color: shift.color,
      },
      totalSessions: stat?.totalSessions || 0,
      totalHours: stat ? (stat.totalMinutes / 60).toFixed(1) : "0",
      totalTasks: stat?.uniqueTasks?.length || 0,
      totalUsers: stat?.uniqueUsers?.length || 0,
    };
  });

  // Add sessions outside any shift
  const unassigned = stats.find((s) => !s._id);
  if (unassigned) {
    result.push({
      shift: {
        _id: null,
        name: "Ngoài ca",
        startTime: "-",
        endTime: "-",
        color: "#999",
      },
      totalSessions: unassigned.totalSessions,
      totalHours: (unassigned.totalMinutes / 60).toFixed(1),
      totalTasks: unassigned.uniqueTasks?.length || 0,
      totalUsers: unassigned.uniqueUsers?.length || 0,
    });
  }

  res
    .status(200)
    .json(new ApiResponse(200, result, "Workload by shift fetched"));
});

// GET /workload-stats/heatmap
const getHourlyHeatmap = asyncHandler(async (req, res) => {
  const filter = buildDateFilter(req);
  filter.status = "completed";

  const heatmapData = await WorkSession.aggregate([
    { $match: filter },
    {
      $project: {
        dayOfWeek: { $dayOfWeek: "$startTime" }, // 1=Sunday, 7=Saturday
        hour: { $hour: "$startTime" },
        duration: 1,
      },
    },
    {
      $group: {
        _id: { day: "$dayOfWeek", hour: "$hour" },
        sessionCount: { $sum: 1 },
        totalMinutes: { $sum: "$duration" },
      },
    },
    { $sort: { "_id.day": 1, "_id.hour": 1 } },
  ]);

  // Transform to grid format
  const grid = [];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  for (let day = 1; day <= 7; day++) {
    const dayData = { day: day, dayName: dayNames[day - 1], hours: [] };
    for (let hour = 0; hour < 24; hour++) {
      const cell = heatmapData.find(
        (d) => d._id.day === day && d._id.hour === hour
      );
      dayData.hours.push({
        hour,
        sessions: cell?.sessionCount || 0,
        minutes: cell?.totalMinutes || 0,
      });
    }
    grid.push(dayData);
  }

  res.status(200).json(new ApiResponse(200, grid, "Heatmap data fetched"));
});

// GET /workload-stats/by-user
const getProductivityByUser = asyncHandler(async (req, res) => {
  const filter = buildDateFilter(req);
  filter.status = "completed";

  const stats = await WorkSession.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { user: "$user", shift: "$shift" },
        totalSessions: { $sum: 1 },
        totalMinutes: { $sum: "$duration" },
        uniqueTasks: { $addToSet: "$task" },
      },
    },
    {
      $group: {
        _id: "$_id.user",
        shifts: {
          $push: {
            shift: "$_id.shift",
            totalSessions: "$totalSessions",
            totalMinutes: "$totalMinutes",
            totalTasks: { $size: "$uniqueTasks" },
          },
        },
        overallSessions: { $sum: "$totalSessions" },
        overallMinutes: { $sum: "$totalMinutes" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        fullName: "$userInfo.fullName",
        shifts: 1,
        overallSessions: 1,
        overallHours: {
          $round: [{ $divide: ["$overallMinutes", 60] }, 1],
        },
      },
    },
    { $sort: { overallHours: -1 } },
  ]);

  // Populate shift names
  const shifts = await WorkShift.find({ isActive: true });
  const shiftMap = {};
  shifts.forEach((s) => {
    shiftMap[s._id.toString()] = s;
  });

  const result = stats.map((user) => ({
    ...user,
    shifts: user.shifts.map((s) => ({
      ...s,
      shiftInfo: s.shift
        ? shiftMap[s.shift.toString()] || { name: "Ngoài ca" }
        : { name: "Ngoài ca" },
      totalHours: (s.totalMinutes / 60).toFixed(1),
    })),
  }));

  res
    .status(200)
    .json(new ApiResponse(200, result, "Productivity by user fetched"));
});

// GET /workload-stats/team-overview
const getTeamOverview = asyncHandler(async (req, res) => {
  const filter = buildDateFilter(req);
  filter.status = "completed";

  const [totalSessions, totalMinutesResult, totalTasksResult, totalUsersResult] =
    await Promise.all([
      WorkSession.countDocuments(filter),
      WorkSession.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$duration" } } },
      ]),
      WorkSession.aggregate([
        { $match: filter },
        { $group: { _id: null, tasks: { $addToSet: "$task" } } },
      ]),
      WorkSession.aggregate([
        { $match: filter },
        { $group: { _id: null, users: { $addToSet: "$user" } } },
      ]),
    ]);

  const totalMinutes = totalMinutesResult[0]?.total || 0;
  const totalTasks = totalTasksResult[0]?.tasks?.length || 0;
  const totalUsers = totalUsersResult[0]?.users?.length || 0;
  const avgMinutesPerTask =
    totalTasks > 0 ? Math.round(totalMinutes / totalTasks) : 0;

  // Overtime: sessions that have no shift assigned
  const overtimeFilter = { ...filter, shift: null };
  const overtimeResult = await WorkSession.aggregate([
    { $match: overtimeFilter },
    { $group: { _id: null, total: { $sum: "$duration" } } },
  ]);
  const overtimeMinutes = overtimeResult[0]?.total || 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSessions,
        totalHours: (totalMinutes / 60).toFixed(1),
        totalTasks,
        totalUsers,
        avgHoursPerTask: (avgMinutesPerTask / 60).toFixed(1),
        overtimeHours: (overtimeMinutes / 60).toFixed(1),
      },
      "Team overview fetched"
    )
  );
});

// GET /workload-stats/shift-comparison
const getShiftComparison = asyncHandler(async (req, res) => {
  const filter = buildDateFilter(req);
  filter.status = "completed";

  const shifts = await WorkShift.find({ isActive: true }).sort({
    startTime: 1,
  });

  const comparison = await WorkSession.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$shift",
        sessions: { $sum: 1 },
        totalMinutes: { $sum: "$duration" },
        tasks: { $addToSet: "$task" },
      },
    },
  ]);

  const result = shifts.map((shift) => {
    const data = comparison.find(
      (c) => c._id && c._id.toString() === shift._id.toString()
    );
    return {
      name: shift.name,
      color: shift.color,
      sessions: data?.sessions || 0,
      hours: data ? parseFloat((data.totalMinutes / 60).toFixed(1)) : 0,
      tasks: data?.tasks?.length || 0,
    };
  });

  // Add "Ngoài ca"
  const outside = comparison.find((c) => !c._id);
  if (outside) {
    result.push({
      name: "Ngoài ca",
      color: "#999",
      sessions: outside.sessions,
      hours: parseFloat((outside.totalMinutes / 60).toFixed(1)),
      tasks: outside.tasks?.length || 0,
    });
  }

  res
    .status(200)
    .json(new ApiResponse(200, result, "Shift comparison fetched"));
});

// GET /workload-stats/overtime
const getOvertimeReport = asyncHandler(async (req, res) => {
  const filter = buildDateFilter(req);
  filter.status = "completed";
  filter.shift = null;

  const overtime = await WorkSession.find(filter)
    .populate("user", "fullName")
    .populate("task", "title")
    .populate("project", "name")
    .sort({ startTime: -1 });

  // Group by user
  const grouped = {};
  overtime.forEach((session) => {
    const key = session.user?._id?.toString() || "unknown";
    if (!grouped[key]) {
      grouped[key] = {
        user: session.user,
        sessions: [],
        totalMinutes: 0,
      };
    }
    grouped[key].sessions.push(session);
    grouped[key].totalMinutes += session.duration || 0;
  });

  const result = Object.values(grouped).map((g) => ({
    ...g,
    totalHours: (g.totalMinutes / 60).toFixed(1),
  }));

  res
    .status(200)
    .json(new ApiResponse(200, result, "Overtime report fetched"));
});

export {
  getWorkloadByShift,
  getHourlyHeatmap,
  getProductivityByUser,
  getTeamOverview,
  getShiftComparison,
  getOvertimeReport,
};
