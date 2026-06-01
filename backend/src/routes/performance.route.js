import { Router } from "express";
import {
  calculatePerformance,
  getRanking,
  getMyStats,
} from "../controllers/performance.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/my-stats", getMyStats);
router.get("/ranking", getRanking);

// Only Admin or Manager can trigger calculation
router.get("/calculate/:employeeId", authorizeRoles("Admin", "Manager"), calculatePerformance);

export default router;
