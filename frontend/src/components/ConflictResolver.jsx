import React, { useState } from "react";
import { updateTask } from "../services/taskApi";
import socket from "../services/socketService";
import toast from "react-hot-toast";

const ConflictResolver = ({ conflict, onClose }) => {
  const [isResolving, setIsResolving] = useState(false);
  const { clientTask, serverTask } = conflict;

  const handleKeepMine = async () => {
    setIsResolving(true);
    try {
      // Force update with client's version, ignoring server changes
      const updateData = {
        ...clientTask,
        forceUpdate: true, // Special flag to bypass conflict detection
      };
      const res = await updateTask(clientTask._id, updateData);
      socket.emit("taskUpdated", res.data);
      toast.success("Your changes have been saved");
      onClose();
    } catch {
      toast.error("Failed to save your changes");
    } finally {
      setIsResolving(false);
    }
  };

  const handleKeepTheirs = async () => {
    setIsResolving(true);
    try {
      // Just close the modal - server version is already current
      toast.info("Keeping the other user's changes");
      onClose();
    } catch {
      // Just close on any error
    } finally {
      setIsResolving(false);
    }
  };

  const handleMerge = async () => {
    setIsResolving(true);
    try {
      // Create a merged version - for now, keep client's title/priority and server's description/status
      const mergedTask = {
        _id: clientTask._id,
        title: clientTask.title,
        description: serverTask.description,
        status: serverTask.status,
        priority: clientTask.priority,
        forceUpdate: true,
      };

      const res = await updateTask(clientTask._id, mergedTask);
      socket.emit("taskUpdated", res.data);
      toast.success("Changes merged successfully");
      onClose();
    } catch {
      toast.error("Failed to merge changes");
    } finally {
      setIsResolving(false);
    }
  };

  const getFieldChanges = () => {
    const changes = [];
    if (clientTask.title !== serverTask.title) {
      changes.push({
        field: "Title",
        yours: clientTask.title,
        theirs: serverTask.title,
      });
    }
    if (clientTask.description !== serverTask.description) {
      changes.push({
        field: "Description",
        yours: clientTask.description || "(empty)",
        theirs: serverTask.description || "(empty)",
      });
    }
    if (clientTask.status !== serverTask.status) {
      changes.push({
        field: "Status",
        yours: clientTask.status,
        theirs: serverTask.status,
      });
    }
    if (clientTask.priority !== serverTask.priority) {
      changes.push({
        field: "Priority",
        yours: clientTask.priority,
        theirs: serverTask.priority,
      });
    }
    return changes;
  };

  const changes = getFieldChanges();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">
                Conflict Detected
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
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

          {/* Message */}
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">
              This task has been modified by another user while you were editing
              it. Please choose how to resolve the conflict.
            </p>
          </div>

          {/* Changes Comparison */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">
              Conflicting Changes:
            </h4>
            <div className="space-y-4">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className="bg-gray-800 border border-gray-600 rounded-lg p-4"
                >
                  <div className="text-sm font-medium text-gray-300 mb-2">
                    {change.field}:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-900/30 border border-blue-600/30 rounded p-3">
                      <div className="text-xs font-medium text-blue-300 mb-1">
                        Your Version:
                      </div>
                      <div className="text-sm text-white break-words">
                        {change.yours}
                      </div>
                    </div>
                    <div className="bg-green-900/30 border border-green-600/30 rounded p-3">
                      <div className="text-xs font-medium text-green-300 mb-1">
                        Their Version:
                      </div>
                      <div className="text-sm text-white break-words">
                        {change.theirs}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleKeepMine}
              disabled={isResolving}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
            >
              Keep My Changes
            </button>
            <button
              onClick={handleKeepTheirs}
              disabled={isResolving}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg font-medium transition-colors"
            >
              Keep Their Changes
            </button>
            <button
              onClick={handleMerge}
              disabled={isResolving}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors"
            >
              Smart Merge
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-xs text-gray-400">
            <p>
              <strong>Keep My Changes:</strong> Override with your version
            </p>
            <p>
              <strong>Keep Their Changes:</strong> Discard your changes and use
              the other user's version
            </p>
            <p>
              <strong>Smart Merge:</strong> Automatically combine
              non-conflicting changes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConflictResolver;
