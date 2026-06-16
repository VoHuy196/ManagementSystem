import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import {
  Home,
  Register,
  Login,
  KanbanBoard,
  ActionLog,
  Logout,
  Projects,
  Employees,
  Worklogs,
  Attendance,
  LeaveRequest,
  Performance,
  Reports,
  WorkloadAnalytics,
  WorkShiftManagement,
} from "../pages";
import ThemeTest from "../pages/ThemeTest";
import Layout from "../layout";
import ProtectedRoutes from "./ProtectedRoutes";

const AppRoutes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/theme-test" element={<ThemeTest />} />

      <Route
        path="/logout"
        element={
          <ProtectedRoutes>
            <Logout />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/kanbanboard"
        element={
          <ProtectedRoutes>
            <KanbanBoard />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/actionlog"
        element={
          <ProtectedRoutes>
            <ActionLog />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoutes>
            <Projects />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoutes>
            <Employees />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/worklogs"
        element={
          <ProtectedRoutes>
            <Worklogs />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoutes>
            <Attendance />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/leaves"
        element={
          <ProtectedRoutes>
            <LeaveRequest />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoutes>
            <Performance />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoutes>
            <Reports />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/workload"
        element={
          <ProtectedRoutes>
            <WorkloadAnalytics />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/work-shifts"
        element={
          <ProtectedRoutes>
            <WorkShiftManagement />
          </ProtectedRoutes>
        }
      />
    </Route>
  )
);

export default AppRoutes;
