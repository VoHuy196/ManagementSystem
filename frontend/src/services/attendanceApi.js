import API from "./apiHandler.js";

export const attendanceApi = {
  checkIn: () => API.post("/attendance/check-in"),
  checkOut: () => API.post("/attendance/check-out"),
  getMyRecords: () => API.get("/attendance/my-records"),
  getAllRecords: () => API.get("/attendance/all"),
};
