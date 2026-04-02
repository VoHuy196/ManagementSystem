import React, { useState, useEffect } from "react";
import { getWorklogs } from "../services/worklogApi.js";
import toast from "react-hot-toast";

const Worklogs = () => {
  const [worklogs, setWorklogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [selectedTaskId, setSelectedTaskId] = useState(null);
  // const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchWorklogs();
  }, []);

  const fetchWorklogs = async () => {
    try {
      setLoading(true);
      const response = await getWorklogs();
      setWorklogs(response.data.data.worklogs || []);
    } catch {
      toast.error("Failed to fetch worklogs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Work Logs</h1>
            <p className="text-gray-600 dark:text-gray-400">Track time spent on tasks</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-700">
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Employee</th>
                <th className="text-left p-4 font-semibold">Task</th>
                <th className="text-left p-4 font-semibold">Hours</th>
                <th className="text-left p-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {worklogs.map((worklog) => (
                <tr key={worklog._id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <td className="p-4 text-gray-900 dark:text-gray-200">{formatDate(worklog.entryDate)}</td>
                  <td className="p-4 font-mono text-blue-600 dark:text-blue-400">{worklog.employee}</td>
                  <td className="p-4 text-gray-900 dark:text-gray-200">{worklog.task}</td>
                  <td className="p-4 font-semibold text-green-600 dark:text-green-400">{worklog.hours}h</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 max-w-md line-clamp-1">{worklog.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {worklogs.length === 0 && (
          <div className="text-center py-16 mt-8 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No work logs yet</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">Log your first time entry to track progress on tasks.</p>
          </div>
        )}
      </div>

      {/* WorklogModal would be opened from Task details */}
      {/* <WorklogModal 
        isOpen={showModal} 
        taskId={selectedTaskId}
        onClose={() => setShowModal(false)} 
      /> */}
    </div>
  );
};

export default Worklogs;

