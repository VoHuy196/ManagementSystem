import { Router } from "express";
import {
  exportTasks,
  exportWorklogs,
  exportEmployees,
  exportProjects,
} from "../controllers/export.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/tasks",     exportTasks);
router.get("/worklogs",  exportWorklogs);
router.get("/employees", exportEmployees);
router.get("/projects",  exportProjects);

export default router;
