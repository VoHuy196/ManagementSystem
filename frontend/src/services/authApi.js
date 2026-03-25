import API from "./apiHandler.js";

const registerUser = (data) => API.post("/auth/register", data);
const loginUser = (data) => API.post("/auth/login", data);
const logoutUser = () => API.post("/auth/logout");

export { registerUser, loginUser, logoutUser };
