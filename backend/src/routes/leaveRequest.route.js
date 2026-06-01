import { Router } from "express";
import {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
} from "../controllers/leaveRequest.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createLeaveRequest);
router.get("/my-requests", getMyLeaveRequests);

// Admin or Manager can view all requests and update status
router.get("/all", authorizeRoles("Admin", "Manager"), getAllLeaveRequests);
router.patch("/:id/status", authorizeRoles("Admin", "Manager"), updateLeaveStatus);

export default router;
