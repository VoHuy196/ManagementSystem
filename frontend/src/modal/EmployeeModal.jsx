import React, { useEffect } from "react";
import { Modal, Form, Input, DatePicker, Button, Space } from "antd";
import { createEmployee, updateEmployee } from "../services/employeeApi.js";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const EmployeeModal = ({ employee, open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const isEditing = employee && employee._id;

  useEffect(() => {
    if (open) {
      if (isEditing) {
        form.setFieldsValue({
          employeeCode: employee.employeeCode,
          name: employee.name,
          birthday: employee.birthday ? dayjs(employee.birthday) : null,
          joinDate: employee.joinDate ? dayjs(employee.joinDate) : null,
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
