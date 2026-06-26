import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Space,
  Tag,
  Row,
  Col,
  Tooltip,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyEmployee } from "../services/employeeApi.js";
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../services/documentApi.js";

const { Title, Text, Paragraph } = Typography;

const CATEGORIES = [
  "Quyết định",
  "Hợp đồng",
  "Thông báo",
  "Tài liệu kỹ thuật",
  "Báo cáo",
  "Khác",
];

const DEPARTMENTS = [
  "HR",
  "Engineering",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "General",
];

const DocumentManagement = () => {
  const { user } = useAuth();
  const currentUser = user?.data?.user;
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userDept, setUserDept] = useState("");
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState(undefined);
  const [deptFilter, setDeptFilter] = useState(undefined);
  
  const [form] = Form.useForm();

  // Fetch documents and user department
  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, empRes] = await Promise.all([
        getDocuments(),
        getMyEmployee().catch(() => null), // Catch errors if profile doesn't exist
      ]);

      if (docsRes.data.success) {
        setDocuments(docsRes.data.data.documents || []);
      }
      if (empRes?.data?.success) {
        setUserDept(empRes.data.data.employee?.department || "");
      }
    } catch (error) {
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingDoc(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingDoc(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      fileUrl: record.fileUrl,
      category: record.category,
      department: record.department,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        title: values.title,
        description: values.description || "",
        fileUrl: values.fileUrl || "",
        category: values.category,
        department: values.department,
        status: values.status || "Published",
      };

      if (editingDoc) {
        await updateDocument(editingDoc._id, payload);
        toast.success("Cập nhật tài liệu thành công!");
      } else {
        await createDocument(payload);
        toast.success("Tạo tài liệu mới thành công!");
      }

      setModalOpen(false);
      form.resetFields();
      setEditingDoc(null);
      fetchData();
    } catch (error) {
      if (error.errorFields) return;
      toast.error(error?.response?.data?.message || "Lưu tài liệu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      toast.success("Xóa tài liệu thành công!");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa tài liệu");
    }
  };

  // Helper to check edit/delete permissions
  const hasEditPermission = (doc) => {
    if (!currentUser) return false;
    if (currentUser.role === "Admin") return true;
    
    const isCreator = doc.createdBy?._id === currentUser._id || doc.createdBy === currentUser._id;
    const sameDept = userDept && doc.department === userDept;
    
    return isCreator || sameDept;
  };

  const hasDeletePermission = (doc) => {
    if (!currentUser) return false;
    if (currentUser.role === "Admin") return true;
    
    const isCreator = doc.createdBy?._id === currentUser._id || doc.createdBy === currentUser._id;
    return isCreator;
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchCategory = !categoryFilter || doc.category === categoryFilter;
      const matchDept = !deptFilter || doc.department === deptFilter;
      return matchCategory && matchDept;
    });
  }, [documents, categoryFilter, deptFilter]);

  const columns = [
    {
      title: "Tên văn bản",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <FileTextOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
            <Text strong style={{ fontSize: "14px" }}>{text}</Text>
          </Space>
          {record.description && (
            <Text type="secondary" style={{ fontSize: "12px", marginLeft: "20px" }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Loại văn bản",
      dataIndex: "category",
      key: "category",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "Người đăng",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (creator) => creator?.fullName || "N/A",
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Tài liệu",
      key: "link",
      align: "center",
      render: (_, record) => {
        return record.fileUrl ? (
          <Tooltip title="Mở đường liên kết">
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => window.open(record.fileUrl, "_blank")}
              style={{ color: "#52c41a" }}
            />
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 130,
      render: (_, record) => {
        const canEdit = hasEditPermission(record);
        const canDelete = hasDeletePermission(record);

        return (
          <Space>
            {canEdit ? (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleOpenEdit(record)}
                style={{ color: "#1890ff" }}
              />
            ) : (
              <Tooltip title="Không có quyền chỉnh sửa">
                <Button type="text" icon={<EditOutlined />} disabled />
              </Tooltip>
            )}

            {canDelete ? (
              <Popconfirm
                title="Xóa văn bản"
                description="Bạn có chắc chắn muốn xóa văn bản này không?"
                onConfirm={() => handleDelete(record._id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ) : (
              <Tooltip title="Chỉ người tạo hoặc Admin mới được xóa">
                <Button type="text" icon={<DeleteOutlined />} disabled />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <FolderOpenOutlined style={{ marginRight: 12, color: "#1890ff" }} />
            Quản lý văn bản phòng ban
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: "block" }}>
            Quản lý tài liệu và phân quyền xem, chỉnh sửa theo phòng ban của bạn
            {userDept && (
              <span>
                {" "}
                (Phòng ban hiện tại: <Tag color="geekblue" style={{ fontWeight: 600 }}>{userDept}</Tag>)
              </span>
            )}
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
          Thêm văn bản mới
        </Button>
      </div>

      {/* Filter and Content */}
      <Card style={{ borderRadius: "12px", marginBottom: 16 }}>
        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Text strong>Bộ lọc:</Text>
          <Select
            allowClear
            placeholder="Tất cả loại văn bản"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
          <Select
            allowClear
            placeholder="Tất cả phòng ban"
            value={deptFilter}
            onChange={setDeptFilter}
            style={{ width: 180 }}
            options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
          />
        </Space>

        <Table
          dataSource={filteredDocuments}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} văn bản`,
          }}
          style={{ borderRadius: "8px" }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingDoc ? "Chỉnh sửa tài liệu" : "Tải lên văn bản mới"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingDoc(null);
        }}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingDoc ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        width={550}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Tiêu đề văn bản"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
          >
            <Input placeholder="Nhập tiêu đề văn bản..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Loại văn bản"
                rules={[{ required: true, message: "Chọn loại văn bản!" }]}
              >
                <Select placeholder="Chọn loại...">
                  {CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="Phòng ban có quyền xem/sửa"
                rules={[{ required: true, message: "Chọn phòng ban!" }]}
              >
                <Select placeholder="Chọn phòng ban...">
                  {DEPARTMENTS.map((dept) => (
                    <Select.Option key={dept} value={dept}>
                      {dept}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="fileUrl"
            label="Đường dẫn file liên kết"
            rules={[{ type: "url", message: "Vui lòng nhập đúng định dạng URL!" }]}
          >
            <Input placeholder="https://drive.google.com/..." prefix={<LinkOutlined />} />
          </Form.Item>

          <Form.Item name="description" label="Mô tả tóm tắt">
            <Input.TextArea rows={3} placeholder="Mô tả sơ lược về văn bản này..." />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái xuất bản" initialValue="Published">
            <Select>
              <Select.Option value="Published">Published</Select.Option>
              <Select.Option value="Draft">Draft</Select.Option>
              <Select.Option value="Archived">Archived</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagement;
