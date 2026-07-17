import API from "./apiHandler.js";

const commentApi = {
  getComments:   (taskId)            => API.get(`/comments/${taskId}`),
  createComment: (taskId, content)   => API.post(`/comments/${taskId}`, { content }),
  updateComment: (commentId, content) => API.patch(`/comments/${commentId}`, { content }),
  deleteComment: (commentId)         => API.delete(`/comments/${commentId}`),
};

export default commentApi;
