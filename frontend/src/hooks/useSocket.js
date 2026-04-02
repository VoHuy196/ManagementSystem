import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const useSocket = (setTasks, currentUser = null) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  // 1. DÙNG useRef ĐỂ GIỮ GIÁ TRỊ currentUser MỚI NHẤT
  const currentUserRef = useRef(currentUser);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Lấy ra chuỗi ID nguyên thủy để đưa vào dependency
  const currentUserId = currentUser?.data?.user?._id || currentUser?._id;

  const isCurrentUserAction = useCallback((actionUser) => {
    if (!currentUserId || !actionUser) return false;
    const actionUserId = actionUser._id || actionUser;
    return currentUserId === actionUserId;
  }, [currentUserId]);

  const getUserDisplayName = useCallback((user) => {
    if (!user) return "Someone";
    return user.fullName || user.name || "Unknown User";
  }, []);

  useEffect(() => {
    // 2. LẤY DATA TỪ REF THAY VÌ DÙNG BIẾN currentUser TRỰC TIẾP
    const latestUser = currentUserRef.current;
    
    if (latestUser) {
      const userData = latestUser?.data?.user || latestUser;
      if (userData?._id) {
        socket.emit("userOnline", userData);
      }
    }

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleReceiveNotification = ({ message, type = "info" }) => {
      const toastOptions = { duration: 4000, style: { color: "white" } };
      switch (type) {
        case "success": toast.success(message, { ...toastOptions, style: { ...toastOptions.style, background: "#10B981" } }); break;
        case "error": toast.error(message, { ...toastOptions, style: { ...toastOptions.style, background: "#EF4444" } }); break;
        case "warning": toast(message, { ...toastOptions, icon: "⚠️", style: { ...toastOptions.style, background: "#F59E0B" } }); break;
        default: toast(message, { ...toastOptions, icon: "ℹ️", style: { ...toastOptions.style, background: "#3B82F6" } });
      }
    };

    const handleTaskCreated = (taskData) => {
      const newTask = taskData.data?.task || taskData;
      const creator = newTask.createdBy;
      if (setTasks) {
        setTasks((prev) => {
          const exists = prev.some((task) => task._id === newTask._id);
          if (exists) return prev;
          return [...prev, newTask];
        });
      }

      if (!isCurrentUserAction(creator)) {
        toast.success(`${getUserDisplayName(creator)} created a new task: "${newTask.title}"`, { icon: "✨", duration: 4000, style: { background: "#10B981", color: "white" } });
      }
    };

    const handleTaskUpdated = (taskData) => {
      const updatedTask = taskData.data?.task || taskData;
      const updater = updatedTask.createdBy;
      if (setTasks) {
        setTasks((prev) => prev.map((task) => task._id === updatedTask._id ? { ...task, ...updatedTask } : task));
      }

      if (!isCurrentUserAction(updater)) {
        toast(`${getUserDisplayName(updater)} updated task: "${updatedTask.title}"`, { icon: "📝", duration: 3000, style: { background: "#3B82F6", color: "white" } });
      }
    };

    const handleTaskDeleted = (taskData) => {
      const taskId = taskData.data?.taskId || taskData._id || taskData;
      const deletedTask = taskData.data?.task || {};
      const deleter = taskData.data?.deletedBy || deletedTask.createdBy;
      if (setTasks) {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
      }

      if (!isCurrentUserAction(deleter)) {
        toast.error(`${getUserDisplayName(deleter)} deleted task: "${deletedTask.title || "Untitled"}"`, { icon: "🗑️", duration: 3000, style: { background: "#EF4444", color: "white" } });
      }
    };

    const handleTaskMoved = (taskData) => {
      const movedTask = taskData.data?.task || taskData;
      const fromStatus = taskData.data?.fromStatus;
      const toStatus = taskData.data?.toStatus;
      const mover = movedTask.createdBy;
      
      if (setTasks) {
        setTasks((prev) => prev.map((task) => task._id === movedTask._id ? { ...task, ...movedTask } : task));
      }

      if (!isCurrentUserAction(mover)) {
        const statusDisplay = { todo: "Todo", "in-progress": "In Progress", done: "Done" };
        toast(`${getUserDisplayName(mover)} moved "${movedTask.title}" from ${statusDisplay[fromStatus] || fromStatus} to ${statusDisplay[toStatus] || toStatus}`, { icon: "🚀", duration: 4000, style: { background: "#8B5CF6", color: "white" } });
      }
    };

    const handleProjectCreated = (projectData) => {
      const newProject = projectData.data?.project || projectData;
      const creator = newProject.owner;
      if (!isCurrentUserAction(creator)) {
        toast.success(`${getUserDisplayName(creator)} created a new project: "${newProject.name}"`, { icon: "🏗️", duration: 4000, style: { background: "#10B981", color: "white" } });
      }
    };

    const handleTaskAssignedToProject = (data) => {
      const task = data.data?.task || data.task;
      const project = data.data?.project || data.project;
      const assigner = data.data?.user || data.user;
      if (!isCurrentUserAction(assigner)) {
        toast(`${getUserDisplayName(assigner)} assigned task "${task?.title}" to project "${project?.name}"`, { icon: "📋", duration: 4000, style: { background: "#8B5CF6", color: "white" } });
      }
    };

    const handleConnect = () => {
      const userNow = currentUserRef.current; // Lấy từ Ref
      if (userNow) {
        const userData = userNow?.data?.user || userNow;
        if (userData?._id) socket.emit("userOnline", userData);
      }
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("receiveNotification", handleReceiveNotification);
    socket.on("taskCreated", handleTaskCreated);
    socket.on("taskUpdated", handleTaskUpdated);
    socket.on("taskDeleted", handleTaskDeleted);
    socket.on("taskMoved", handleTaskMoved);
    socket.on("projectCreated", handleProjectCreated);
    socket.on("taskAssignedToProject", handleTaskAssignedToProject);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("receiveNotification", handleReceiveNotification);
      socket.off("taskCreated", handleTaskCreated);
      socket.off("taskUpdated", handleTaskUpdated);
      socket.off("taskDeleted", handleTaskDeleted);
      socket.off("taskMoved", handleTaskMoved);
      socket.off("projectCreated", handleProjectCreated);
      socket.off("taskAssignedToProject", handleTaskAssignedToProject);
      socket.off("connect", handleConnect);
    };
    
  // 3. MẢNG DEPENDENCY Chỉ chứa ID và Function, không chứa object
  }, [currentUserId, isCurrentUserAction, getUserDisplayName, setTasks]); 

  const sendNotification = (toUserId, message, type = "info") => {
    socket.emit("sendNotification", { toUserId, message, type });
  };

  return { socket, onlineUsers, sendNotification };
};

export default useSocket;