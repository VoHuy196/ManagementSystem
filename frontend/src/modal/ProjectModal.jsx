import React, { useEffect, useState } from "react";
import { createProject, updateProject, deleteProject } from "../services/projectApi.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const ProjectModal = ({ project, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    startDate: "",
    endDate: "",
    department: "",
    budget: "",
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      toast.success("Project deleted successfully");
      onClose();
    },
    onError: () => toast.error("Failed to delete project"),
  });

  useEffect(() => {
    if (project && Object.keys(project).length > 0) {
      setForm({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "active",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        department: project.department || "",
        budget: project.budget || "",
      });
    } else {
      setForm({
        name: "",
        description: "",
        status: "active",
        startDate: "",
        endDate: "",
        department: "",
        budget: "",
      });
    }
  }, [project]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (form.budget && parseFloat(form.budget) < 0) {
      toast.error("Budget cannot be negative");
      return;
    }

    const data = { ...form };
    if (form.budget) data.budget = parseFloat(form.budget);

    try {
      if (project?._id) {
        await updateProject(project._id, data);
        toast.success("Project updated successfully");
      } else {
        await createProject(data);
        toast.success("Project created successfully");
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save project");
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate();
    }
  };

  const isEditing = project?._id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="border rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              {isEditing ? "Edit Project" : "Create New Project"}
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                name="name"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                placeholder="Enter project name"
                value={form.name}
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
                placeholder="Enter project description"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all appearance-none cursor-pointer"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  name="department"
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                  placeholder="Enter department"
                  value={form.department}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  name="startDate"
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  name="endDate"
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget
              </label>
              <input
                name="budget"
                type="number"
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                placeholder="Enter budget"
                value={form.budget}
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
              className="flex-1 px-4 py-2 bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-all font-medium text-white"
            >
              {isEditing ? "Update Project" : "Create Project"}
            </button>
            {isEditing && (
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-all font-medium text-white"
              >
                Delete Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;

