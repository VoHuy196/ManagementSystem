import { Router } from "express";
import {
  getWorkShifts,
  createWorkShift,
  updateWorkShift,
  deleteWorkShift,
} from "../controllers/workShift.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getWorkShifts);
router.post("/", authorizeRoles("admin"), createWorkShift);
router.put("/:id", authorizeRoles("admin"), updateWorkShift);
router.delete("/:id", authorizeRoles("admin"), deleteWorkShift);

export default router;
