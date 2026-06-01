import API from "./apiHandler.js";

export const performanceApi = {
  calculate: (employeeId, period) => API.get(`/performance/calculate/${employeeId}`, { params: { period } }),
  getRanking: (period) => API.get("/performance/ranking", { params: { period } }),
  getMyStats: () => API.get("/performance/my-stats"),
};
