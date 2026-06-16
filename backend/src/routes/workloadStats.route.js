import { Router } from "express";
import {
  getWorkloadByShift,
  getHourlyHeatmap,
  getProductivityByUser,
  getTeamOverview,
  getShiftComparison,
  getOvertimeReport,
} from "../controllers/workloadStats.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/by-shift", getWorkloadByShift);
router.get("/heatmap", getHourlyHeatmap);
router.get("/by-user", getProductivityByUser);
router.get("/team-overview", getTeamOverview);
router.get("/shift-comparison", getShiftComparison);
router.get("/overtime", getOvertimeReport);

export default router;
