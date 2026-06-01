import { Router } from "express";
import {
  getOverviewStats,
  getAttendanceStats,
  getProjectProgressStats,
} from "../controllers/stats.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

// All authenticated users can see stats, but usually restricted to Admin/Manager for full overview
router.get("/overview", getOverviewStats);
router.get("/attendance", getAttendanceStats);
router.get("/projects", getProjectProgressStats);

export default router;
