import React, { useEffect, useState } from "react";
import { fetchTasks, updateTaskStatus, deleteTask } from "../services/taskApi";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import TaskModal from "../modal/TaskModal";
import { ConflictResolver, TaskCard, TaskAssignment } from "../components";
import toast from "react-hot-toast";

const KanbanBoard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);

  const { socket } = useSocket(setTasks, user);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await fetchTasks();
        setTasks(Array.isArray(res.data.data.tasks) ? res.data.data.tasks : []);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch tasks. Please try again.";
        toast.error(errorMessage);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const statuses = ["Todo", "In Progress", "Done"];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const getTasksForStatus = (status) => {
    return safeTasks.filter((task) => task.status === status);
  };

  // const getTaskCount = (status) => {
  //   return getTasksForStatus(status).length;
  // };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));

      socket.emit("taskDeleted", { _id: taskId });

      toast.success("Task deleted successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete task. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(task));

    setTimeout(() => {
      if (e.target) {
        e.target.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.style.opacity = "1";
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(status);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverColumn(null);

    if (!draggedTask) {
      return;
    }

    if (draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    const originalStatus = draggedTask.status;

    try {
      const updatedTask = { ...draggedTask, status: newStatus };
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === draggedTask._id ? updatedTask : task
        )
      );

      const response = await updateTaskStatus(draggedTask._id, {
        status: newStatus,
      });

      socket.emit("taskMoved", {
        data: {
          task: response.data.data.task || updatedTask,
          fromStatus: originalStatus,
          toStatus: newStatus,
          movedAt: new Date().toISOString(),
        },
      });

      socket.emit("taskUpdated", {
        data: {
          task: response.data.data.task || updatedTask,
        },
      });

      toast.success(
        `Task moved to ${newStatus === "In Progress" ? "In Progress" : newStatus}`
      );
    } catch (error) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === draggedTask._id
            ? { ...task, status: originalStatus }
            : task
        )
      );

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update task status. Please try again.";
      toast.error(errorMessage);
    }

    setDraggedTask(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="text-lg text-white">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Task Board</h2>
          <p className="text-sm text-gray-400 mt-1">
            Total: {safeTasks.length} tasks • Drag to move between columns
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTaskAssignment(true)}
            className="border border-gray-600 text-gray-300 px-4 py-2 rounded hover:text-blue-400 hover:border-blue-400 transition-all"
          >
            📋 Assign to Project
          </button>
          <button
            onClick={() => setSelectedTask({})}
            className="border border-gray-600 text-gray-300 px-4 py-2 rounded hover:text-blue-400 hover:border-blue-400 transition-all"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statuses.map((status) => {
          const statusTasks = getTasksForStatus(status);
          const taskCount = statusTasks.length;
          const isDragOver = dragOverColumn === status;

          return (
            <div
              key={status}
              className={`border rounded-lg p-4 shadow-md transition-all ${
                isDragOver
                  ? "border-blue-400 bg-gray-800 ring-2 ring-blue-400 ring-opacity-50"
                  : "bg-black border-gray-700"
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">
                  {status === "In Progress"
                    ? "In Progress"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium border bg-white text-black">
                  {taskCount}
                </span>
              </div>

              <div className="space-y-3 custom-scrollbar max-h-96 overflow-y-auto">
                {taskCount > 0 ? (
                  statusTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                      style={{ userSelect: "none" }} // Prevent text selection
                    >
                      <TaskCard
                        task={task}
                        onClick={setSelectedTask}
                        onDelete={handleDeleteTask}
                        isDragging={draggedTask?._id === task._id}
                      />
                    </div>
                  ))
                ) : (
                  <div
                    className={`text-center py-6 border-2 border-dashed rounded-lg transition-all ${
                      isDragOver
                        ? "border-blue-400 bg-blue-950 bg-opacity-30"
                        : "border-gray-600"
                    }`}
                  >
                    <svg
                      className="mx-auto h-6 w-6 text-gray-400 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <p className="text-sm text-gray-400">No tasks</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isDragOver ? "Drop task here" : "Drag tasks here"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        setConflict={setConflict}
      />

      {conflict && (
        <ConflictResolver
          conflict={conflict}
          onClose={() => setConflict(null)}
        />
      )}

      <TaskAssignment
        isOpen={showTaskAssignment}
        onClose={() => setShowTaskAssignment(false)}
      />
    </div>
  );
};

export default KanbanBoard;
