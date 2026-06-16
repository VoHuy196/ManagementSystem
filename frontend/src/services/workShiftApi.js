import API from "./apiHandler.js";

const getWorkShifts = () => API.get("/work-shifts");
const createWorkShift = (data) => API.post("/work-shifts", data);
const updateWorkShift = (id, data) => API.put(`/work-shifts/${id}`, data);
const deleteWorkShift = (id) => API.delete(`/work-shifts/${id}`);

export { getWorkShifts, createWorkShift, updateWorkShift, deleteWorkShift };
