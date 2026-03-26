import React, { useState } from "react";
import { createWorklog } from "../services/worklogApi.js";
import toast from "react-hot-toast";

const WorklogModal = ({ onClose, taskId }) => {
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    hours: "",
    description: "",
    employee: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.hours || parseFloat(form.hours) <= 0 || !form.employee) {
      toast.error("Hours and employee are required (positive hours)");
      return;
    }

    try {
      await createWorklog({
        ...form,
        task: taskId,
        hours: parseFloat(form.hours),
      });
      toast.success("Worklog entry created successfully");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save worklog");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Log Work Hours</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-600 hover:text-blue-600 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                name="entryDate"
                type="date"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                value={form.entryDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours *
              </label>
              <input
                name="hours"
                type="number"
                min="0.1"
                step="0.1"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                placeholder="e.g. 4.5"
                value={form.hours}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID *
              </label>
              <input
                name="employee"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                placeholder="Employee ID"
                value={form.employee}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all resize-none"
                placeholder="What did you work on?"
                value={form.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-green-600 border border-green-600 rounded-md hover:bg-green-700 transition-all font-medium text-white"
            >
              Log Work
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorklogModal;

