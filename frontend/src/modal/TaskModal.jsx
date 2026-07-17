import React, { useEffect, useState } from "react";
import { createTask, updateTask, smartAssign, getRecommendations } from "../services/taskApi";
import API from "../services/apiHandler";
import socket from "../services/socketService";
import toast from "react-hot-toast";
import CommentSection from "../components/CommentSection.jsx";
import AttachmentPanel from "../components/AttachmentPanel.jsx";

const TaskModal = ({ task, onClose, setConflict }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    taskType: "Task",
    startDate: "",
    dueDate: "",
    sprint: "",
    labels: "",
    assignedTo: "",
  });
  const [originalTask, setOriginalTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showRecsModal, setShowRecsModal] = useState(false);

  // Fetch users list for manual assignment dropdown
  useEffect(() => {
    API.get("/auth/users")
      .then((res) => {
        setUsers(res.data?.data?.users || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (task && Object.keys(task).length > 0) {
      const taskData = {
        _id: task._id,
        title: task.title || "",
        description: task.description || "",
        status: task.status || "Todo",
        priority: task.priority || "Medium",
        taskType: task.taskType || "Task",
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        sprint: task.sprint || "",
        labels: task.labels ? task.labels.join(', ') : "",
        assignedTo: task.assignedTo?._id || task.assignedTo || "",
      };
      setForm(taskData);
      setOriginalTask({
        ...task,
        lastModified: task.updatedAt || new Date().toISOString(),
      });
    } else {
      setForm({
        title: "",
        description: "",
        status: "Todo",
        priority: "Medium",
        taskType: "Task",
        startDate: "",
        dueDate: "",
        sprint: "",
        labels: "",
        assignedTo: "",
      });
      setOriginalTask(null);
    }
  }, [task]);

  if (!task) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.title || !form.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      let res;
      if (form._id) {
        const updateData = {
          ...form,
          lastModified: originalTask?.lastModified,
          assignedTo: form.assignedTo || null,
        };
        res = await updateTask(form._id, updateData);
        socket.emit("taskUpdated", res.data);
        toast.success("Task updated successfully");
      } else {
        const taskData = {
          title: form.title.trim(),
          description: form.description || "",
          status: form.status,
          priority: form.priority,
          taskType: form.taskType,
          startDate: form.startDate || undefined,
          dueDate: form.dueDate || undefined,
          sprint: form.sprint || undefined,
          labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(l => l) : [],
          assignedTo: form.assignedTo || undefined,
        };
        res = await createTask(taskData);
        socket.emit("taskCreated", res.data);
        toast.success("Task created successfully");
      }
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(err.response.data);
      } else {
        toast.error(err.response?.data?.message || "Failed to save task");
      }
    }
  };

  const handleSmartAssign = async () => {
    setLoadingRecs(true);
    setShowRecsModal(true);
    try {
      const res = await getRecommendations(form._id);
      if (res.data?.success) {
        setRecs(res.data.data.predictions || []);
      } else {
        toast.error("Không thể lấy đề xuất phân công");
        setShowRecsModal(false);
      }
    } catch (error) {
      toast.error("Không thể kết nối đến AI Service");
      setShowRecsModal(false);
    } finally {
      setLoadingRecs(false);
    }
  };

  const confirmAssignment = async (userId, employeeName, recIndex, confidence) => {
    try {
      const res = await smartAssign(form._id, userId, {
        aiSuggested: recIndex === 0,        // true only if the manager picks AI's top suggestion
        aiConfidenceShown: confidence || 0,
      });
      socket.emit("taskUpdated", res.data);
      toast.success(`Đã phân công việc cho ${employeeName}`);
      setShowRecsModal(false);
      onClose();
    } catch (error) {
      toast.error("Phân công việc thất bại");
    }
  };

  const isExistingTask = form._id || (task && task._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              {isExistingTask ? "Edit Task" : "Create New Task"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-600 hover:text-blue-600 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                name="title"
                type="text"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                placeholder="Enter task title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all resize-none text-gray-900 dark:text-white"
                placeholder="Enter task description"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            {/* Assigned User Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignee (User)
              </label>
              <select
                name="assignedTo"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                value={form.assignedTo}
                onChange={handleChange}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                  value={form.status}
                  onChange={handleChange}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                  value={form.priority}
                  onChange={handleChange}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Type
                </label>
                <select
                  name="taskType"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer text-gray-900 dark:text-white"
                  value={form.taskType}
                  onChange={handleChange}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                >
                  <option value="Story">Story</option>
                  <option value="Bug">Bug</option>
                  <option value="Task">Task</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sprint
                </label>
                <input
                  name="sprint"
                  type="text"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                  placeholder="Sprint name"
                  value={form.sprint}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  name="startDate"
                  type="date"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  name="dueDate"
                  type="date"
                  className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                  value={form.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Labels (comma separated)
              </label>
              <textarea
                name="labels"
                rows="1"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:border-blue-600 transition-all resize-none text-gray-900 dark:text-white"
                placeholder="frontend, urgent, v1.0"
                value={form.labels}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400 transition-all text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>

            {isExistingTask && (
              <button
                onClick={handleSmartAssign}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400 transition-all text-gray-700 dark:text-gray-300"
              >
                Smart Assign
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white border border-transparent rounded-md hover:bg-blue-500 transition-all font-medium"
            >
              {isExistingTask ? "Update Task" : "Create Task"}
            </button>
          </div>

          {/* Attachments + Comments – only for existing tasks */}
          {isExistingTask && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-800 mt-6" />
              <AttachmentPanel
                taskId={form._id || task?._id}
                initialAttachments={task?.attachments || []}
              />
              <div className="border-t border-gray-200 dark:border-gray-800 mt-5" />
              <CommentSection taskId={form._id || task?._id} />
            </>
          )}
        </div>
      </div>

      {/* AI Recommendations Modal */}
      {showRecsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-65 flex justify-center items-center z-[60] p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform scale-100 transition-all duration-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-xl">✨</span> AI Smart Assign Recommendation
                </h3>
                <button
                  onClick={() => setShowRecsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingRecs ? (
                /* Pulsing AI Thinking state */
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-purple-500 border-b-transparent animate-spin-reverse opacity-75"></div>
                    <div className="absolute inset-0 bg-blue-500 rounded-full opacity-10 animate-ping"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
                      AI đang phân tích yêu cầu công việc...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Đang đánh giá năng lực phòng ban & tải lượng công việc hiện tại
                    </p>
                  </div>
                </div>
              ) : (
                /* Recommendations list */
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Dựa trên thông tin của task, AI đề xuất giao công việc này cho các ứng viên sau:
                  </p>

                  {recs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      Không tìm thấy ứng viên Employee nào phù hợp.
                    </div>
                  ) : (
                    recs.map((rec, recIndex) => {
                      const isHigh = rec.confidence >= 80;
                      const isMedium = rec.confidence >= 60 && rec.confidence < 80;
                      const confidenceColor = isHigh 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : isMedium
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
                      
                      return (
                        <div 
                          key={rec.employeeId} 
                          className="border border-gray-150 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-700 p-4 rounded-xl flex items-start justify-between gap-4 transition-all hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white">{rec.fullName}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confidenceColor}`}>
                                Phù hợp {rec.confidence}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                              💡 {rec.reason}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => confirmAssignment(rec.employeeId, rec.fullName, recIndex, rec.confidence)}
                            className="bg-blue-600 text-white text-xs px-3.5 py-2 rounded-lg hover:bg-blue-500 font-semibold transition-all shadow-sm flex-shrink-0"
                          >
                            Gán việc
                          </button>
                        </div>
                      );
                    })
                  )}

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setShowRecsModal(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      Quay lại chỉnh sửa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskModal;
