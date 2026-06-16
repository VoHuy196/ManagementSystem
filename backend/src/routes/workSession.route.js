import { Router } from "express";
import {
  startSession,
  stopSession,
  pauseSession,
  getActiveSessions,
  getSessionHistory,
} from "../controllers/workSession.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/start", startSession);
router.put("/:id/stop", stopSession);
router.put("/:id/pause", pauseSession);
router.get("/active", getActiveSessions);
router.get("/history", getSessionHistory);

export default router;
