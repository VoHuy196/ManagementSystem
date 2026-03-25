import API from "./apiHandler.js";

const createProject = (data) => API.post("/projects", data);
const getProjects = () => API.get("/projects");
const updateProject = (id, data) => API.put(`/projects/${id}`, data);
const getProjectTasks = (id) => API.get(`/projects/${id}/tasks`);
const assignTaskToProject = (data) => API.post("/projects/assign-task", data);
const addMemberToProject = (id, data) =>
  API.post(`/projects/${id}/add-member`, data);
const removeMemberFromProject = (id, data) =>
  API.post(`/projects/${id}/remove-member`, data);

export {
  createProject,
  getProjects,
  updateProject,
  getProjectTasks,
  assignTaskToProject,
  addMemberToProject,
  removeMemberFromProject,
};
