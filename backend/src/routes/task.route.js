import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTask,
  getTaskRecommendations,
} from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/gettask", authMiddleware, getTasks);
router.post("/createtask", authMiddleware, createTask);
router.patch("/updatetask/:id", authMiddleware, updateTask);
router.patch("/updatetaskstatus/:id", authMiddleware, updateTaskStatus);
router.delete("/deletetask/:id", authMiddleware, deleteTask);
router.post("/assigntask/:id", authMiddleware, assignTask);
router.get("/assigntask/:id/recommend", authMiddleware, getTaskRecommendations);

export default router;
