import { Router } from "express";
import {
  getDocuments,
  getDocumentDetails,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/document.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.route("/")
  .get(getDocuments)
  .post(createDocument);

router.route("/:id")
  .get(getDocumentDetails)
  .put(updateDocument)
  .delete(deleteDocument);

export default router;
