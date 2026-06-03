import API from "./apiHandler.js";

const getEmployees = () => API.get("/employees");
const getMyEmployee = () => API.get("/employees/me");
const createEmployee = (data) => API.post("/employees", data);
const updateEmployee = (id, data) => API.put(`/employees/${id}`, data);
const deleteEmployee = (id) => API.delete(`/employees/${id}`);

export {
  getEmployees,
  getMyEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

