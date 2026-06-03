import React, { useEffect, useState } from "react";
import { createTask, updateTask, smartAssign } from "../services/taskApi";
import API from "../services/apiHandler";
import socket from "../services/socketService";
import toast from "react-hot-toast";

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
    try {
      const res = await smartAssign(form._id);
      socket.emit("taskUpdated", res.data);
      toast.success("Task assigned successfully");
      onClose();
    } catch {
      toast.error("Failed to assign task");
    }
  };

  const isExistingTask = form._id || (task && task._id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
