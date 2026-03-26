import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employees.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getEmployees);
router.post("/", authMiddleware, createEmployee);
router.put("/:id", authMiddleware, updateEmployee);
router.delete("/:id", authMiddleware, deleteEmployee);

export default router;

