import API from "./apiHandler.js";

const fetchTasks = () => API.get("/tasks/gettask");
const createTask = (data) => API.post("/tasks/createtask", data);
const updateTask = (id, data) => API.patch(`/tasks/updatetask/${id}`, data);
const updateTaskStatus = (id, status) =>
  API.patch(`/tasks/updatetaskstatus/${id}`, status);
const deleteTask = (id) => API.delete(`/tasks/deletetask/${id}`);
const smartAssign = (id, userId, extra = {}) =>
  API.post(`/tasks/assigntask/${id}`, userId ? { userId, ...extra } : { ...extra });
const getRecommendations = (id) => API.get(`/tasks/assigntask/${id}/recommend`);

// Attachments
const uploadAttachment   = (taskId, payload) => API.post(`/tasks/${taskId}/attachments`, payload);
const deleteAttachment   = (taskId, attId)   => API.delete(`/tasks/${taskId}/attachments/${attId}`);
const getDownloadUrl     = (taskId, attId)   =>
  `${API.defaults.baseURL}/tasks/${taskId}/attachments/${attId}/download`;

export {
  fetchTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  smartAssign,
  getRecommendations,
  uploadAttachment,
  deleteAttachment,
  getDownloadUrl,
};
