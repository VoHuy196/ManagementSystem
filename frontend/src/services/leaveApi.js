import API from "./apiHandler.js";

export const leaveApi = {
  createRequest: (data) => API.post("/leaves", data),
  getMyRequests: () => API.get("/leaves/my-requests"),
  getAllRequests: () => API.get("/leaves/all"),
  updateStatus: (id, status) => API.patch(`/leaves/${id}/status`, { status }),
};
