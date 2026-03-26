import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { CORS_OPTIONS } from "./constants.js";
import { Server } from "socket.io";
import { createServer } from "http";
import socketHandler from "./utils/socket.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: CORS_OPTIONS,
});

socketHandler(io);
app.set("io", io);

// common middlewares
app.use(cors(CORS_OPTIONS));
app.use(cookieParser());
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(express.urlencoded({ extended: true }));

// import routes
import authRoutes from "./routes/auth.route.js";
import actionLogRoutes from "./routes/actionLog.route.js";
import taskRoutes from "./routes/task.route.js";
import projectRoutes from "./routes/projects.route.js";
import employeeRoutes from "./routes/employees.route.js";
import worklogRoutes from "./routes/worklog.route.js";

// implement routing
app.use("/api/auth", authRoutes);
app.use("/api/actionlogs", actionLogRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/worklogs", worklogRoutes);

app.use(errorHandler);

export { app, httpServer };
