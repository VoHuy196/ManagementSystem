import React, { useEffect } from "react";
import { Modal, Form, Input, Select, DatePicker, InputNumber, Button, Space, Popconfirm } from "antd";
import { createProject, updateProject, deleteProject } from "../services/projectApi.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { TextArea } = Input;

const ProjectModal = ({ project, open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const isEditing = project && project._id;

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      toast.success("Project deleted successfully");
      if (onSuccess) onSuccess();
      else onClose();
    },
    onError: () => toast.error("Failed to delete project"),
  });

  useEffect(() => {
    if (open) {
      if (isEditing) {
        form.setFieldsValue({
          name: project.name,
          description: project.description,
          status: project.status || "active",
          startDate: project.startDate ? dayjs(project.startDate) : null,
          endDate: project.endDate ? dayjs(project.endDate) : null,
          department: project.department,
          budget: project.budget,
        });
      } else {
        form.resetFields();
      }
    }
  }, [project, open, form, isEditing]);

  const handleFinish = async (values) => {
    const data = {
      ...values,
      startDate: values.startDate ? values.startDate.toISOString() : null,
      endDate: values.endDate ? values.endDate.toISOString() : null,
    };

    try {
      if (isEditing) {
        await updateProject(project._id, data);
        toast.success("Project updated successfully");
      } else {
        await createProject(data);
        toast.success("Project created successfully");
      }
      
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save project");
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Project" : "Create New Project"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ status: "active" }}
      >
        <Form.Item
          name="name"
          label="Project Name"
          rules={[{ required: true, message: "Please enter project name" }]}
        >
          <Input placeholder="Enter project name" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter project description" />
        </Form.Item>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item name="status" label="Status" style={{ flex: 1 }}>
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="archived">Archived</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="department" label="Department" style={{ flex: 1 }}>
            <Input placeholder="Enter department" />
          </Form.Item>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <Form.Item name="budget" label="Budget">
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Enter budget"
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Space>
              {isEditing && (
                <Popconfirm
                  title="Are you sure you want to delete this project?"
                  onConfirm={() => deleteMutation.mutate()}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true, loading: deleteMutation.isLoading }}
                >
                  <Button danger>Delete</Button>
                </Popconfirm>
              )}
            </Space>
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {isEditing ? "Update Project" : "Create Project"}
              </Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectModal;
