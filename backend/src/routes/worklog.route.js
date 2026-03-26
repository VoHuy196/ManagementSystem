import express from "express";
import {
  getWorklogs,
  createWorklog,
  getWorklogsByTask,
} from "../controllers/worklog.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWorklogs);
router.post("/", authMiddleware, createWorklog);
router.get("/task/:taskId", authMiddleware, getWorklogsByTask);

export default router;

