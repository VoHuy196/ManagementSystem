import API from "./apiHandler.js";

const fetchTasks = () => API.get("/tasks/gettask");
const createTask = (data) => API.post("/tasks/createtask", data);
const updateTask = (id, data) => API.patch(`/tasks/updatetask/${id}`, data);
const updateTaskStatus = (id, status) =>
  API.patch(`/tasks/updatetaskstatus/${id}`, status);
const deleteTask = (id) => API.delete(`/tasks/deletetask/${id}`);
const smartAssign = (id) => API.post(`/tasks/assigntask/${id}`);

export {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  smartAssign,
};
