import React, { useEffect, useState } from "react";
import { Card, Button, Table, Tag, Space, Typography, message, Form, Input, DatePicker, Select, Modal, Tabs } from "antd";
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { leaveApi } from "../services/leaveApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

const LeaveRequest = () => {
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuth();
  const isAdminOrManager = user?.role === "Admin" || user?.role === "Manager";

  const fetchMyRequests = async () => {
    try {
      const res = await leaveApi.getMyRequests();
      if (res.success) setMyRequests(res.data);
    } catch (error) {
      message.error("Failed to fetch your requests");
    }
  };

  const fetchAllRequests = async () => {
    if (!isAdminOrManager) return;
    try {
      const res = await leaveApi.getAllRequests();
      if (res.success) setAllRequests(res.data);
    } catch (error) {
      message.error("Failed to fetch all requests");
    }
  };

  useEffect(() => {
    fetchMyRequests();
    if (isAdminOrManager) fetchAllRequests();
  }, [isAdminOrManager]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        leaveType: values.leaveType,
        startDate: values.dates[0].toDate(),
        endDate: values.dates[1].toDate(),
        reason: values.reason,
      };
      const res = await leaveApi.createRequest(payload);
      if (res.success) {
        message.success("Leave request submitted!");
        setIsModalOpen(false);
        form.resetFields();
        fetchMyRequests();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await leaveApi.updateStatus(id, status);
      if (res.success) {
        message.success(`Request ${status.toLowerCase()} successfully`);
        fetchAllRequests();
      }
    } catch (error) {
      message.error("Update failed");
    }
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "leaveType",
      key: "leaveType",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = status === "Approved" ? "green" : status === "Rejected" ? "red" : "orange";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  const adminColumns = [
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
      render: (emp) => emp?.name || "N/A",
    },
    ...columns,
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        record.status === "Pending" && (
          <Space>
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleUpdateStatus(record._id, "Approved")}
            >
              Approve
            </Button>
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />} 
              onClick={() => handleUpdateStatus(record._id, "Rejected")}
            >
              Reject
            </Button>
          </Space>
        )
      ),
    },
  ];

  const items = [
    {
      key: "1",
      label: "My Requests",
      children: (
        <Table dataSource={myRequests} columns={columns} rowKey="_id" />
      ),
    },
    ...(isAdminOrManager ? [{
      key: "2",
      label: "All Requests (Admin)",
      children: (
        <Table dataSource={allRequests} columns={adminColumns} rowKey="_id" />
      ),
    }] : []),
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Leave Management</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
        >
          Request Leave
        </Button>
      </div>

      <Card className="shadow-sm">
        <Tabs defaultActiveKey="1" items={items} />
      </Card>

      <Modal
        title="New Leave Request"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Select.Option value="Annual">Annual Leave</Select.Option>
              <Select.Option value="Sick">Sick Leave</Select.Option>
              <Select.Option value="Unpaid">Unpaid Leave</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dates" label="Duration" rules={[{ required: true }]}>
            <RangePicker className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="Why are you taking leave?" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveRequest;
