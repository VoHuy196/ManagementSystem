import { User } from "../models/users.model.js";
import { Employee } from "../models/employees.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { cookieOptions } from "../constants.js";

const userRegister = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // Tự động tạo Employee profile tương ứng với User mới
  // Các tính năng Attendance, Leave, Performance đều yêu cầu có Employee profile
  const employeeCode = "EMP" + Date.now().toString().slice(-6);
  const employee = await Employee.create({
    employeeCode,
    name: fullName,
    joinDate: new Date(),
    user: user._id,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: createdUser,
        employee,
      },
      "User registered successfully"
    )
  );
});

const userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = user.generateJWTToken();

  if (!token) {
    throw new ApiError(500, "Failed to generate authentication token");
  }

  const loggedInUser = await User.findById(user._id).select("-password");

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging in user");
  }

  // Nếu user chưa có Employee profile (user cũ tạo trước khi có tính năng này), tự động tạo
  let employee = await Employee.findOne({ user: user._id });
  if (!employee) {
    const employeeCode = "EMP" + Date.now().toString().slice(-6);
    employee = await Employee.create({
      employeeCode,
      name: loggedInUser.fullName,
      joinDate: new Date(),
      user: user._id,
    });
  }

  res
    .status(200)
    .cookie("token", token, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          token,
        },
        "User logged in successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("token", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { userRegister, userLogin, userLogout };
