import React, { useState, useEffect } from "react";
import { getEmployees, createEmployee, updateEmployee } from "../services/employeeApi.js";
import EmployeeModal from "../modal/EmployeeModal.jsx";
// import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
// const { user } = useAuth();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = getEmployees();
      setEmployees(response.data.data.employees || []);
    } catch {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (employeeData) => {
    try {
      const response = await createEmployee(employeeData);
      setEmployees([...employees, response.data.data.employee]);
      toast.success("Employee created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create employee");
    }
  };

  const handleUpdateEmployee = async (employeeData) => {
    try {
      const response = await updateEmployee(editingEmployee._id, employeeData);
      setEmployees(employees.map(e => e._id === editingEmployee._id ? response.data.data.employee : e));
      toast.success("Employee updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee");
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
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Employees</h1>
            <p className="text-gray-400">Manage company members</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Employee
          </button>
        </div>

        <div className="bg-black border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 font-semibold text-white">Code</th>
                <th className="text-left p-4 font-semibold text-white">Name</th>
                <th className="text-left p-4 font-semibold text-white">Birthday</th>
                <th className="text-left p-4 font-semibold text-white">Join Date</th>
                <th className="text-left p-4 font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee._id} className="border-b border-gray-700 hover:bg-gray-900 transition-colors">
                  <td className="p-4 font-mono text-blue-400">{employee.employeeCode}</td>
                  <td className="p-4 font-medium text-white">{employee.name}</td>
                  <td className="p-4 text-gray-400">{formatDate(employee.birthday)}</td>
                  <td className="p-4 text-gray-400">{formatDate(employee.joinDate)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => setEditingEmployee(employee)}
                      className="text-blue-400 hover:text-blue-300 mr-2"
                    >
                      Edit
                    </button>
                    <button className="text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEmployee(null);
        }}
        onSave={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
        employee={editingEmployee}
      />
    </div>
  );
};

export default Employees;

