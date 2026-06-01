import { Attendance } from "../models/attendance.model.js";
import { Employee } from "../models/employees.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import mongoose from "mongoose";

const checkIn = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    throw new ApiError(404, "Employee profile not found for this user");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingAttendance = await Attendance.findOne({
    employee: employee._id,
    date: today,
  });

  if (existingAttendance) {
    throw new ApiError(400, "You have already checked in today");
  }

  const attendance = await Attendance.create({
    employee: employee._id,
    date: today,
    checkIn: new Date(),
    status: "Present",
  });

  res
    .status(201)
    .json(new ApiResponse(201, attendance, "Checked in successfully"));
});

const checkOut = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    throw new ApiError(404, "Employee profile not found for this user");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    employee: employee._id,
    date: today,
  });

  if (!attendance) {
    throw new ApiError(400, "You must check in first");
  }

  if (attendance.checkOut) {
    throw new ApiError(400, "You have already checked out today");
  }

  attendance.checkOut = new Date();
  await attendance.save();

  res
    .status(200)
    .json(new ApiResponse(200, attendance, "Checked out successfully"));
});

const getMyAttendance = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    throw new ApiError(404, "Employee profile not found");
  }

  const records = await Attendance.find({ employee: employee._id }).sort({
    date: -1,
  });

  res
    .status(200)
    .json(new ApiResponse(200, records, "Attendance records fetched successfully"));
});

const getAllAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find()
    .populate({
      path: "employee",
      select: "name employeeCode",
    })
    .sort({ date: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, records, "All attendance records fetched successfully"));
});

export { checkIn, checkOut, getMyAttendance, getAllAttendance };
