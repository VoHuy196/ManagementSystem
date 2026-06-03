import express from "express";
import {
  userLogin,
  userLogout,
  userRegister,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { User } from "../models/users.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", authMiddleware, userLogout);

router.get("/users", authMiddleware, asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.status(200).json(new ApiResponse(200, { users }, "Users fetched successfully"));
}));

export default router;
