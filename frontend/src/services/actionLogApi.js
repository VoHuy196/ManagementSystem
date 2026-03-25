import API from "./apiHandler.js";

const getActionLogs = () => API.get("/actionlogs/getlogs");

export { getActionLogs };
