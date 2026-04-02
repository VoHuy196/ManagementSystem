import React, { useEffect, useState } from "react";
import { getActionLogs } from "../services/actionLogApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ActionLog = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await getActionLogs();

        const fetchedLogs = response.data.data.logs || [];

        const sortedLogs = fetchedLogs.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        setLogs(sortedLogs);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch logs. Please try again.";
        toast.error(errorMessage);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const isCurrentUser = (userId) => {
    const currentUserId = user?.data?.user?._id || user?._id;
    return currentUserId === userId;
  };

  const getDisplayName = (userObj) => {
    if (!userObj) return "Unknown User";

    const name = userObj.fullName || "Unknown User";
    const isYou = isCurrentUser(userObj._id);

    return isYou ? `${name} (You)` : name;
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "Task Created":
        return (
          <div className="w-8 h-8 rounded-full border border-green-400 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
        );
      case "Task Updated":
        return (
          <div className="w-8 h-8 rounded-full border border-blue-400 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
        );
      case "Task Deleted":
        return (
          <div className="w-8 h-8 rounded-full border border-red-400 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        );
      case "Task Status Updated":
        return (
          <div className="w-8 h-8 rounded-full border border-purple-400 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  const formatActionText = (log) => {
    const { user, action, task } = log;
    const userName = getDisplayName(user);
    const taskTitle = task?.title;
    const isCurrentUserAction = isCurrentUser(user?._id);

    switch (action) {
      case "Task Created":
        return (
          <span>
            <span
              className={`font-medium ${
                isCurrentUserAction ? "text-green-400" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {userName}
            </span>{" "}
            created task{" "}
            {taskTitle ? (
              <span className="font-medium text-green-400 hover:text-green-300 transition-all">
                "{taskTitle}"
              </span>
            ) : (
              <span className="font-medium text-gray-600 dark:text-gray-400">(Task deleted)</span>
            )}
          </span>
        );
      case "Task Updated":
        return (
          <span>
            <span
              className={`font-medium ${
                isCurrentUserAction ? "text-blue-400" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {userName}
            </span>{" "}
            updated task{" "}
            {taskTitle ? (
              <span className="font-medium text-blue-400 hover:text-blue-300 transition-all">
                "{taskTitle}"
              </span>
            ) : (
              <span className="font-medium text-gray-600 dark:text-gray-400">(Task deleted)</span>
            )}
          </span>
        );
      case "Task Deleted":
        return (
          <span>
            <span
              className={`font-medium ${
                isCurrentUserAction ? "text-red-400" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {userName}
            </span>{" "}
            <span className="text-red-400 font-medium">deleted a task</span>
          </span>
        );
      case "Task Status Updated":
        return (
          <span>
            <span
              className={`font-medium ${
                isCurrentUserAction ? "text-purple-400" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {userName}
            </span>{" "}
            updated task status{" "}
            {taskTitle ? (
              <span>
                for{" "}
                <span className="font-medium text-purple-400 hover:text-purple-300 transition-all">
                  "{taskTitle}"
                </span>
              </span>
            ) : null}
          </span>
        );
      default:
        return (
          <span>
            <span
              className={`font-medium ${
                isCurrentUserAction ? "text-blue-400" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {userName}
            </span>{" "}
            performed {action.toLowerCase()}{" "}
            {taskTitle ? (
              <span>
                on{" "}
                <span className="font-medium text-blue-400 hover:text-blue-300 transition-all">
                  "{taskTitle}"
                </span>
              </span>
            ) : null}
          </span>
        );
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "Task Created":
        return "text-green-400 border-green-400";
      case "Task Updated":
        return "text-blue-400 border-blue-400";
      case "Task Deleted":
        return "text-red-400 border-red-400";
      case "Task Status Updated":
        return "text-purple-400 border-purple-400";
      default:
        return "text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-600";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return diffInSeconds <= 5 ? "Just now" : `${diffInSeconds} seconds ago`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-300 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Activity Feed
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Recent activities and changes in your workspace
            </p>
          </div>
          <div className="text-center py-8">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Loading activity logs...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg shadow-md overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-300 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Activity Feed
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                Latest activities and changes in your workspace
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {logs.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Activities</div>
            </div>
          </div>
        </div>

        <div>
          {logs.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <li
                    key={log._id}
                    className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-l-4 hover:border-l-blue-400 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Action Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getActionIcon(log.action)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {formatActionText(log)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(log.createdAt)}
                        </div>
                      </div>

                      {/* Action Badge */}
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 712-2h2a2 2 0 712 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No activity logs
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Activity logs will appear here when actions are performed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionLog;
