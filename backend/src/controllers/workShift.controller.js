import { WorkShift } from "../models/workShift.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const getWorkShifts = asyncHandler(async (req, res) => {
  const shifts = await WorkShift.find({ isActive: true }).sort({ startTime: 1 });
  res.status(200).json(new ApiResponse(200, shifts, "Work shifts fetched successfully"));
});

const createWorkShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, color, description } = req.body;
  if (!name || !startTime || !endTime) {
    throw new ApiError(400, "Name, start time, and end time are required");
  }
  const shift = await WorkShift.create({ name, startTime, endTime, color, description });
  res.status(201).json(new ApiResponse(201, shift, "Work shift created successfully"));
});

const updateWorkShift = asyncHandler(async (req, res) => {
  const shift = await WorkShift.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!shift) throw new ApiError(404, "Work shift not found");
  res.status(200).json(new ApiResponse(200, shift, "Work shift updated successfully"));
});

const deleteWorkShift = asyncHandler(async (req, res) => {
  const shift = await WorkShift.findByIdAndDelete(req.params.id);
  if (!shift) throw new ApiError(404, "Work shift not found");
  res.status(200).json(new ApiResponse(200, {}, "Work shift deleted successfully"));
});

export { getWorkShifts, createWorkShift, updateWorkShift, deleteWorkShift };
