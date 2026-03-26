import React, { useEffect, useState } from "react";
import { createEmployee, updateEmployee } from "../services/employeeApi.js";
import toast from "react-hot-toast";

const EmployeeModal = ({ employee, onClose }) => {
  const [form, setForm] = useState({
    employeeCode: "",
    name: "",
    birthday: "",
    joinDate: "",
  });

  useEffect(() => {
    if (employee && Object.keys(employee).length > 0) {
      setForm({
        employeeCode: employee.employeeCode || "",
        name: employee.name || "",
        birthday: employee.birthday ? new Date(employee.birthday).toISOString().split('T')[0] : "",
        joinDate: employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : "",
      });
    } else {
      setForm({
        employeeCode: "",
        name: "",
        birthday: "",
        joinDate: "",
      });
    }
  }, [employee]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.employeeCode.trim() || !form.name.trim() || !form.joinDate) {
      toast.error("Employee code, name, and join date are required");
      return;
    }

    try {
      if (employee?._id) {
        await updateEmployee(employee._id, form);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(form);
        toast.success("Employee created successfully");
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save employee");
    }
  };

  const isEditing = employee?._id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">
              {isEditing ? "Edit Employee" : "Create New Employee"}
            </h3>
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
                Employee Code *
              </label>
              <input
                name="employeeCode"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                placeholder="Enter employee code (e.g. EMP001)"
                value={form.employeeCode}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                name="name"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                placeholder="Enter full name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthday
                </label>
                <input
                  name="birthday"
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                  value={form.birthday}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Join Date *
                </label>
                <input
                  name="joinDate"
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-600 transition-all"
                  value={form.joinDate}
                  onChange={handleChange}
                />
              </div>
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
              {isEditing ? "Update Employee" : "Create Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModal;

