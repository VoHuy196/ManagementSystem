import { Router } from "express";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.get("/:taskId",       getComments);
router.post("/:taskId",      createComment);
router.patch("/:commentId",  updateComment);
router.delete("/:commentId", deleteComment);

export default router;
