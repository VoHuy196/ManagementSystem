import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  TimePicker,
  Select,
  Popconfirm,
  Space,
  Tag,
  Spin,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  getWorkShifts,
  createWorkShift,
  updateWorkShift,
  deleteWorkShift,
} from "../services/workShiftApi.js";

const { Title, Text } = Typography;

const SHIFT_COLORS = [
  { label: "Blue", value: "#1890ff" },
  { label: "Green", value: "#52c41a" },
  { label: "Orange", value: "#fa8c16" },
  { label: "Red", value: "#f5222d" },
  { label: "Purple", value: "#722ed1" },
  { label: "Cyan", value: "#13c2c2" },
  { label: "Magenta", value: "#eb2f96" },
  { label: "Gold", value: "#faad14" },
];

// Visual 24-hour timeline component
const ShiftTimeline = ({ shifts }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const parseHour = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    return parseInt(parts[0], 10) + parseInt(parts[1] || 0, 10) / 60;
  };

  return (
    <Card
      style={{ marginBottom: 24 }}
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Biểu đồ ca làm việc 24h</span>
        </Space>
      }
    >
      <div style={{ position: "relative", height: "120px", overflow: "hidden" }}>
        {/* Hour ruler */}
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #d9d9d9",
            height: "30px",
            alignItems: "flex-end",
          }}
        >
          {hours.map((h) => (
            <div
              key={h}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: "10px",
                color: "#8c8c8c",
                borderLeft: "1px solid #f0f0f0",
                paddingBottom: "4px",
                fontWeight: 500,
              }}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* Shift bars */}
        <div style={{ position: "relative", marginTop: "8px" }}>
          {shifts.map((shift, index) => {
            const startHour = parseHour(shift.startTime);
            const endHour = parseHour(shift.endTime);
            const left = (startHour / 24) * 100;
            let width;
            if (endHour > startHour) {
              width = ((endHour - startHour) / 24) * 100;
            } else {
              // Overnight shift
              width = ((24 - startHour + endHour) / 24) * 100;
            }

            return (
              <Tooltip
                key={shift._id || index}
                title={`${shift.name}: ${shift.startTime} - ${shift.endTime}`}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${Math.min(width, 100 - left)}%`,
                    height: "28px",
                    top: `${index * 34}px`,
                    backgroundColor: shift.color || "#1890ff",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    opacity: 0.9,
                    cursor: "pointer",
                    transition: "opacity 0.2s, transform 0.2s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "scaleY(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.transform = "scaleY(1)";
                  }}
                >
                  {shift.name}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

const WorkShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await getWorkShifts();
      if (response.data.success) {
        setShifts(response.data.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenCreate = () => {
    setEditingShift(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingShift(record);
    form.setFieldsValue({
      name: record.name,
      startTime: record.startTime ? dayjs(record.startTime, "HH:mm") : null,
      endTime: record.endTime ? dayjs(record.endTime, "HH:mm") : null,
      color: record.color,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        name: values.name,
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        color: values.color,
        description: values.description || "",
      };

      if (editingShift) {
        await updateWorkShift(editingShift._id, payload);
        toast.success("Cập nhật ca làm việc thành công!");
      } else {
        await createWorkShift(payload);
        toast.success("Tạo ca làm việc thành công!");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingShift(null);
      fetchShifts();
    } catch (error) {
      if (error.errorFields) return; // form validation error
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWorkShift(id);
      toast.success("Xóa ca làm việc thành công!");
      fetchShifts();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa ca làm việc");
    }
  };

  const columns = [
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: record.color || "#1890ff",
            }}
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Giờ bắt đầu",
      dataIndex: "startTime",
      key: "startTime",
      render: (text) => (
        <Tag color="blue" icon={<ClockCircleOutlined />}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Giờ kết thúc",
      dataIndex: "endTime",
      key: "endTime",
      render: (text) => (
        <Tag color="green" icon={<ClockCircleOutlined />}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Màu",
      dataIndex: "color",
      key: "color",
      render: (color) => (
        <div
          style={{
            width: 32,
            height: 20,
            borderRadius: "4px",
            backgroundColor: color || "#1890ff",
            border: "1px solid #d9d9d9",
          }}
        />
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => text || <Text type="secondary">—</Text>,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            style={{ color: "#1890ff" }}
          />
          <Popconfirm
            title="Xóa ca làm việc"
            description="Bạn có chắc muốn xóa ca này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <ScheduleOutlined style={{ marginRight: 12 }} />
            Quản lý ca làm việc
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: "block" }}>
            Thiết lập và quản lý các ca làm việc trong hệ thống
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleOpenCreate}
          style={{
            borderRadius: "8px",
            height: "44px",
            paddingInline: "24px",
            fontWeight: 600,
          }}
        >
          Thêm ca mới
        </Button>
      </div>

      {/* Timeline visualization */}
      {shifts.length > 0 && <ShiftTimeline shifts={shifts} />}

      {/* Data table */}
      <Card
        style={{ borderRadius: "12px" }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={shifts}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} ca làm việc`,
          }}
          style={{ borderRadius: "12px" }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingShift ? "Chỉnh sửa ca làm việc" : "Thêm ca làm việc mới"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingShift(null);
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingShift ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên ca"
            rules={[{ required: true, message: "Vui lòng nhập tên ca!" }]}
          >
            <Input placeholder="VD: Ca sáng, Ca chiều..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu!" }]}
              >
                <TimePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="Giờ kết thúc"
                rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc!" }]}
              >
                <TimePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="color"
            label="Màu hiển thị"
            rules={[{ required: true, message: "Vui lòng chọn màu!" }]}
          >
            <Select placeholder="Chọn màu">
              {SHIFT_COLORS.map((c) => (
                <Select.Option key={c.value} value={c.value}>
                  <Space>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        backgroundColor: c.value,
                        display: "inline-block",
                      }}
                    />
                    {c.label}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Nhập mô tả cho ca làm việc..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkShiftManagement;
