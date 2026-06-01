import API from "./apiHandler.js";

export const statsApi = {
  getOverview: () => API.get("/stats/overview"),
  getAttendance: (period) => API.get("/stats/attendance", { params: { period } }),
  getProjects: () => API.get("/stats/projects"),
};
