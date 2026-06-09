import { LeaveRequest } from "../models/leaveRequest.model.js";
import { Employee } from "../models/employees.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    throw new ApiError(400, "All fields are required");
  }

  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    throw new ApiError(404, "Employee profile not found");
  }

  const leaveRequest = await LeaveRequest.create({
    employee: employee._id,
    leaveType,
    startDate,
    endDate,
    reason,
  });

  const io = req.app.get("io");
  if (io) {
    io.emit("leaveRequestCreated", { leaveRequest });
  }

  res
    .status(201)
    .json(new ApiResponse(201, leaveRequest, "Leave request submitted successfully"));
});

const getMyLeaveRequests = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });

  if (!employee) {
    throw new ApiError(404, "Employee profile not found");
  }

  const requests = await LeaveRequest.find({ employee: employee._id }).sort({
    createdAt: -1,
  });

  res
    .status(200)
    .json(new ApiResponse(200, requests, "Your leave requests fetched successfully"));
});

const getAllLeaveRequests = asyncHandler(async (req, res) => {
  const requests = await LeaveRequest.find()
    .populate({
      path: "employee",
      select: "name employeeCode",
    })
    .populate("approvedBy", "fullName")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, requests, "All leave requests fetched successfully"));
});

const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be Approved or Rejected");
  }

  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    throw new ApiError(404, "Leave request not found");
  }

  leaveRequest.status = status;
  leaveRequest.approvedBy = req.user._id;

  await leaveRequest.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("leaveRequestUpdated", { leaveRequest });
  }

  res
    .status(200)
    .json(new ApiResponse(200, leaveRequest, `Leave request ${status.toLowerCase()} successfully`));
});

export {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
};
