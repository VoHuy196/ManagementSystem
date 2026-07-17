import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTask,
  getTaskRecommendations,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment,
} from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/gettask",                                    authMiddleware, getTasks);
router.post("/createtask",                                authMiddleware, createTask);
router.patch("/updatetask/:id",                           authMiddleware, updateTask);
router.patch("/updatetaskstatus/:id",                     authMiddleware, updateTaskStatus);
router.delete("/deletetask/:id",                          authMiddleware, deleteTask);
router.post("/assigntask/:id",                            authMiddleware, assignTask);
router.get("/assigntask/:id/recommend",                   authMiddleware, getTaskRecommendations);

// Attachment routes
router.post("/:id/attachments",                           authMiddleware, uploadAttachment);
router.delete("/:id/attachments/:attachmentId",           authMiddleware, deleteAttachment);
router.get("/:id/attachments/:attachmentId/download",     authMiddleware, downloadAttachment);

export default router;

