import API from "./apiHandler.js";

const startSession = (data) => API.post("/work-sessions/start", data);
const stopSession = (id) => API.put(`/work-sessions/${id}/stop`);
const pauseSession = (id) => API.put(`/work-sessions/${id}/pause`);
const getActiveSessions = () => API.get("/work-sessions/active");
const getSessionHistory = (params) => API.get("/work-sessions/history", { params });

export { startSession, stopSession, pauseSession, getActiveSessions, getSessionHistory };
