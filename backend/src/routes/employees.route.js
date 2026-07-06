import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getMyEmployee,
} from "../controllers/employees.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// /me phải đặt TRƯỚC /:id để Express không match "me" như một ObjectId
router.get("/me", getMyEmployee);

router.get("/", getEmployees);
router.post("/", authorizeRoles("Admin"), createEmployee);
router.put("/:id", authorizeRoles("Admin"), updateEmployee);
router.delete("/:id", authorizeRoles("Admin"), deleteEmployee);

export default router;
