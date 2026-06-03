import React, { useEffect, useState } from "react";
import { Modal, Form, Input, DatePicker, Button, Space, Select } from "antd";
import { createEmployee, updateEmployee } from "../services/employeeApi.js";
import API from "../services/apiHandler.js";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const EmployeeModal = ({ employee, open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const isEditing = employee && employee._id;

  // Lấy danh sách Users để Admin có thể link với Employee profile
  useEffect(() => {
    if (open) {
      Promise.all([
        API.get("/auth/users"),
        API.get("/employees")
      ])
        .then(([usersRes, employeesRes]) => {
          const allUsers = usersRes.data?.data?.users || [];
          const employees = employeesRes.data?.data?.employees || [];
          const linkedUserIds = new Set(
            employees.filter((e) => e.user).map((e) => e.user?._id || e.user)
          );
          // Cho phép chọn các user chưa được gán cho nhân viên nào, hoặc user hiện tại của employee này
          const currentUserId = employee?.user?._id || employee?.user;
          const unlinkedUsers = allUsers.filter(
            (u) => !linkedUserIds.has(u._id) || u._id === currentUserId
          );
          setUsers(unlinkedUsers);
        })
        .catch(() => {});
    }
  }, [open, employee]);

  useEffect(() => {
    if (open) {
      if (isEditing) {
        form.setFieldsValue({
          employeeCode: employee.employeeCode,
          name: employee.name,
          birthday: employee.birthday ? dayjs(employee.birthday) : null,
          joinDate: employee.joinDate ? dayjs(employee.joinDate) : null,
          user: employee.user?._id || employee.user || undefined,
        });
      } else {
        form.resetFields();
      }
    }
  }, [employee, open, form, isEditing]);

  const handleFinish = async (values) => {
    const payload = {
      ...values,
      birthday: values.birthday ? values.birthday.toISOString() : null,
      joinDate: values.joinDate ? values.joinDate.toISOString() : null,
    };

    try {
      if (isEditing) {
        await updateEmployee(employee._id, payload);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(payload);
        toast.success("Employee created successfully");
      }
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save employee");
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Employee" : "Create New Employee"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="employeeCode"
          label="Employee Code"
          rules={[{ required: true, message: "Please enter employee code" }]}
        >
          <Input placeholder="Enter employee code (e.g. EMP001)" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: "Please enter full name" }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item
            name="birthday"
            label="Birthday"
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Select birthday" />
          </Form.Item>

          <Form.Item
            name="joinDate"
            label="Join Date"
            rules={[{ required: true, message: "Please select join date" }]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Select join date" />
          </Form.Item>
        </div>

        <Form.Item
          name="user"
          label="Link User Account"
          tooltip="Link this employee profile to a User account to enable Attendance, Leave, and Performance features"
        >
          <Select
            placeholder="Select a user account (optional)"
            allowClear
            showSearch
            optionFilterProp="label"
            options={users.map((u) => ({
              value: u._id,
              label: `${u.fullName} ${u.email ? `(${u.email})` : ""}`,
            }))}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {isEditing ? "Update Employee" : "Create Employee"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmployeeModal;
