import API from "./apiHandler.js";

const getDocuments = (params) => API.get("/documents", { params });
const getDocumentDetails = (id) => API.get(`/documents/${id}`);
const createDocument = (data) => API.post("/documents", data);
const updateDocument = (id, data) => API.put(`/documents/${id}`, data);
const deleteDocument = (id) => API.delete(`/documents/${id}`);

export {
  getDocuments,
  getDocumentDetails,
  createDocument,
  updateDocument,
  deleteDocument,
};
