import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
  // Try to get token from cookie or Authorization header
  const token = 
    req.cookies?.token || 
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Not authorized, no token");
  }

  if (token === "null") {
    throw new ApiError(401, "Not authorized, invalid token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      throw new ApiError(401, "Not authorized, token failed");
    }

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Not authorized, user not found");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, "Not authorized, token failed", error);
  }
});

export default authMiddleware;
