import React, { useEffect, useState } from "react";
import { createEmployee, updateEmployee } from "../services/employeeApi.js";
import toast from "react-hot-toast";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const EmployeeModal = ({ employee, onClose }) => {
  const [form, setForm] = useState({
    employeeCode: "",
    name: "",
    birthday: null,
    joinDate: null,
  });

  useEffect(() => {
    if (employee && Object.keys(employee).length > 0) {
      setForm({
        employeeCode: employee.employeeCode || "",
        name: employee.name || "",
        birthday: employee.birthday ? dayjs(employee.birthday) : null,
        joinDate: employee.joinDate ? dayjs(employee.joinDate) : null,
      });
    } else {
      setForm({
        employeeCode: "",
        name: "",
        birthday: null,
        joinDate: null,
      });
    }
  }, [employee]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleDateChange = (fieldName, date) => {
    setForm({ ...form, [fieldName]: date });
  };

  const handleSave = async () => {
  if (!form.employeeCode.trim() || !form.name.trim() || !form.joinDate) {
    toast.error("Employee code, name, and join date are required");
    return;
  }

  const payload = {
    ...form,
    birthday: form.birthday ? form.birthday.toDate() : null,
    joinDate: form.joinDate ? form.joinDate.toDate() : null,
  };

  try {
    if (employee?._id) {
      await updateEmployee(employee._id, payload);
      toast.success("Employee updated successfully");
    } else {
      await createEmployee(payload);
      toast.success("Employee created successfully");
    }
    onClose();
  } catch (err) {
    console.log(err.response?.data);
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-300 mb-1 ">
                  Birthday
                </label>
                <DatePicker
                  value={form.birthday}
                  onChange={(date) => handleDateChange("birthday", date)}
                  format="DD/MM/YYYY"
                  className="w-full"
                  placeholder="Select birthday"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Join Date *
                </label>
                <DatePicker
                  value={form.joinDate}
                  onChange={(date) => handleDateChange("joinDate", date)}
                  format="DD/MM/YYYY"
                  className="w-full"
                  placeholder="Select join date"
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

