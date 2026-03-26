import { Employee } from "../models/employees.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find()
    .populate("user", "fullName email");

  res
    .status(200)
    .json(new ApiResponse(200, { employees }, "Employees fetched successfully"));
});

const createEmployee = asyncHandler(async (req, res) => {
  const { employeeCode, name, birthday, joinDate, user } = req.body;

  if (!employeeCode || !name || !joinDate) {
    throw new ApiError(400, "Employee code, name, and join date are required");
  }

  const existingEmployee = await Employee.findOne({ employeeCode });

  if (existingEmployee) {
    throw new ApiError(400, "Employee with this code already exists");
  }

  const employee = await Employee.create({
    employeeCode,
    name,
    birthday,
    joinDate,
    user,
  });

  const createdEmployee = await Employee.findById(employee._id)
    .populate("user", "fullName email");

  res
    .status(201)
    .json(new ApiResponse(201, { employee: createdEmployee }, "Employee created successfully"));
});

const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeCode, name, birthday, joinDate, user } = req.body;

  if (!id) {
    throw new ApiError(400, "Employee ID is required");
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  if (employeeCode) {
    const existing = await Employee.findOne({ employeeCode, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(400, "Employee code already exists");
    }
    employee.employeeCode = employeeCode;
  }

  if (name !== undefined) employee.name = name;
  if (birthday !== undefined) employee.birthday = birthday;
  if (joinDate !== undefined) employee.joinDate = joinDate;
  if (user !== undefined) employee.user = user;

  const updatedEmployee = await employee.save();

  const populatedEmployee = await Employee.findById(id)
    .populate("user", "fullName email");

  res
    .status(200)
    .json(new ApiResponse(200, { employee: populatedEmployee }, "Employee updated successfully"));
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Employee ID is required");
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  await Employee.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, {}, "Employee deleted successfully"));
});

export {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

