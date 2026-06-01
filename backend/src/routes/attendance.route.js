import { Router } from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} from "../controllers/attendance.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/my-records", getMyAttendance);

// Only Admin or Manager can view all records
router.get("/all", authorizeRoles("Admin", "Manager"), getAllAttendance);

export default router;
