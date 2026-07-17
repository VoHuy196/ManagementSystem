import { Task } from "../models/tasks.model.js";
import { Worklog } from "../models/worklog.model.js";
import { Employee } from "../models/employees.model.js";
import { Project } from "../models/projects.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";

// ── Helper: convert array of objects to CSV string ──────────────────────
const toCSV = (rows, columns) => {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const val = c.getter ? c.getter(row) : row[c.key] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header, ...body].join("\n");
};

// ── GET /api/export/tasks ────────────────────────────────────────────────
const exportTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName")
    .lean();

  const columns = [
    { label: "Title",       key: "title" },
    { label: "Status",      key: "status" },
    { label: "Priority",    key: "priority" },
    { label: "Task Type",   key: "taskType" },
    { label: "Assigned To", getter: (r) => r.assignedTo?.fullName || "Unassigned" },
    { label: "Created By",  getter: (r) => r.createdBy?.fullName || "" },
    { label: "Due Date",    getter: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString("vi-VN") : "" },
    { label: "Sprint",      key: "sprint" },
    { label: "Created At",  getter: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN") },
  ];

  const csv = toCSV(tasks, columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="tasks_${Date.now()}.csv"`);
  res.send("\uFEFF" + csv); // BOM for Excel UTF-8
});

// ── GET /api/export/worklogs ─────────────────────────────────────────────
const exportWorklogs = asyncHandler(async (req, res) => {
  const worklogs = await Worklog.find()
    .populate("task", "title")
    .populate("employee", "name employeeCode")
    .lean();

  const columns = [
    { label: "Date",        getter: (r) => new Date(r.entryDate).toLocaleDateString("vi-VN") },
    { label: "Employee",    getter: (r) => r.employee?.name || "" },
    { label: "Employee ID", getter: (r) => r.employee?.employeeCode || "" },
    { label: "Task",        getter: (r) => r.task?.title || "" },
    { label: "Hours",       key: "hours" },
    { label: "Description", key: "description" },
    { label: "Logged At",   getter: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN") },
  ];

  const csv = toCSV(worklogs, columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="worklogs_${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

// ── GET /api/export/employees ────────────────────────────────────────────
const exportEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find().lean();

  const columns = [
    { label: "Name",        key: "name" },
    { label: "Employee ID", key: "employeeCode" },
    { label: "Department",  key: "department" },
    { label: "Position",    key: "position" },
    { label: "Phone",       key: "phone" },
    { label: "Skills",      getter: (r) => (r.skills || []).join("; ") },
    { label: "Joined At",   getter: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN") },
  ];

  const csv = toCSV(employees, columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="employees_${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

// ── GET /api/export/projects ─────────────────────────────────────────────
const exportProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().lean();
  const taskCounts = await Task.aggregate([
    { $group: { _id: "$project", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] } } } },
  ]);
  const countMap = {};
  taskCounts.forEach((t) => { countMap[t._id?.toString()] = t; });

  const columns = [
    { label: "Project Name", key: "name" },
    { label: "Status",       key: "status" },
    { label: "Description",  key: "description" },
    { label: "Total Tasks",  getter: (r) => countMap[r._id?.toString()]?.total ?? 0 },
    { label: "Done Tasks",   getter: (r) => countMap[r._id?.toString()]?.done ?? 0 },
    { label: "Progress %",   getter: (r) => {
      const c = countMap[r._id?.toString()];
      if (!c || c.total === 0) return "0";
      return Math.round((c.done / c.total) * 100).toString();
    }},
    { label: "Created At",   getter: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN") },
  ];

  const csv = toCSV(projects, columns);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="projects_${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

export { exportTasks, exportWorklogs, exportEmployees, exportProjects };
