import API from "./apiHandler.js";

const getEmployees = () => API.get("/employees");
const createEmployee = (data) => API.post("/employees", data);
const updateEmployee = (id, data) => API.put(`/employees/${id}`, data);
const deleteEmployee = (id) => API.delete(`/employees/${id}`);

export {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

