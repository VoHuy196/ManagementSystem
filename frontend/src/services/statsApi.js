import API from "./apiHandler.js";

export const statsApi = {
  getOverview:     ()       => API.get("/stats/overview"),
  getAttendance:   (period) => API.get("/stats/attendance", { params: { period } }),
  getProjects:     ()       => API.get("/stats/projects"),
  getWorklogs:     ()       => API.get("/stats/worklogs"),
  getTasks:        ()       => API.get("/stats/tasks"),
  getPerformance:  ()       => API.get("/stats/performance"),
};
