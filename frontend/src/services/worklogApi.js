import API from "./apiHandler.js";

const getWorklogs = () => API.get("/worklogs");
const createWorklog = (data) => API.post("/worklogs", data);
const getWorklogsByTask = (taskId) => API.get(`/worklogs/task/${taskId}`);

export {
  getWorklogs,
  createWorklog,
  getWorklogsByTask,
};

