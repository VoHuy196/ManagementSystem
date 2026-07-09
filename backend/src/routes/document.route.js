import { Router } from "express";
import multer from "multer";
import {
  getDocuments,
  getDocumentDetails,
  createDocument,
  uploadDocumentFile,
  updateDocument,
  deleteDocument,
} from "../controllers/document.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

// Store file in memory (buffer) — worker will decode and send to AI
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // max 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
      "application/json",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const router = Router();

router.use(authMiddleware);

router.route("/")
  .get(getDocuments)
  .post(createDocument);

// File upload endpoint — must come before /:id routes
router.post("/upload", upload.single("file"), uploadDocumentFile);

router.route("/:id")
  .get(getDocumentDetails)
  .put(updateDocument)
  .delete(deleteDocument);

export default router;
