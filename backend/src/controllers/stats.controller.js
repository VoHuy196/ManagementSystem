import { Attendance } from "../models/attendance.model.js";
import { LeaveRequest } from "../models/leaveRequest.model.js";
import { Project } from "../models/projects.model.js";
import { Task } from "../models/tasks.model.js";
import { Employee } from "../models/employees.model.js";
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

export { getOverviewStats, getAttendanceStats, getProjectProgressStats };
