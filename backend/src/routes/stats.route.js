import { Router } from "express";
import {
  getOverviewStats,
  getAttendanceStats,
  getProjectProgressStats,
  getWorklogStats,
  getTaskCompletionStats,
  getPerformanceStats,
} from "../controllers/stats.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/overview", getOverviewStats);
router.get("/attendance", getAttendanceStats);
router.get("/projects", getProjectProgressStats);
router.get("/worklogs", getWorklogStats);
router.get("/tasks", getTaskCompletionStats);
router.get("/performance", getPerformanceStats);

export default router;

