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
} from "../pages";
import Layout from "../layout";
import ProtectedRoutes from "./ProtectedRoutes";

const AppRoutes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
    </Route>
  )
);

export default AppRoutes;
