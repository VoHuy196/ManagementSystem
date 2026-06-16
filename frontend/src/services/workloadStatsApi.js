import API from "./apiHandler.js";

export const workloadStatsApi = {
  getByShift: (params) => API.get("/workload-stats/by-shift", { params }),
  getHeatmap: (params) => API.get("/workload-stats/heatmap", { params }),
  getByUser: (params) => API.get("/workload-stats/by-user", { params }),
  getTeamOverview: (params) => API.get("/workload-stats/team-overview", { params }),
  getShiftComparison: (params) => API.get("/workload-stats/shift-comparison", { params }),
  getOvertime: (params) => API.get("/workload-stats/overtime", { params }),
};
