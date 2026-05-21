import React, { useRef, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import { Button, Tag, Space, Typography, Tooltip, Avatar } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getProjects } from "../services/projectApi.js";
import { useAuth } from "../context/AuthContext";
import ProjectModal from "../modal/ProjectModal.jsx";
import { ProjectTasks } from "../components";

const { Text } = Typography;

const ProjectsList = () => {
  const actionRef = useRef();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTasks, setShowTasks] = useState(false);

  const isOwner = (project) => {
    const currentUserId = user?.data?.user?._id || user?._id;
    return project.owner?._id === currentUserId;
  };

  const columns = [
    {
      title: "Project Name",
      dataIndex: "name",
      copyable: true,
      ellipsis: true,
      formItemProps: {
        rules: [{ required: true, message: "Project name is required" }],
      },
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        active: { text: "Active", status: "Success" },
        completed: { text: "Completed", status: "Processing" },
        archived: { text: "Archived", status: "Default" },
      },
      render: (_, record) => {
        let color = "default";
        switch (record.status) {
          case "active":
            color = "green";
            break;
          case "completed":
            color = "blue";
            break;
          case "archived":
            color = "gray";
            break;
        }
        return <Tag color={color}>{record.status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Owner",
      dataIndex: ["owner", "fullName"],
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.owner?.fullName}</Text>
        </Space>
      ),
    },
    {
      title: "Members",
      dataIndex: "members",
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <TeamOutlined />
          <Text>{record.members?.length || 0}</Text>
        </Space>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      valueType: "dateTime",
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Actions",
      valueType: "option",
      key: "option",
      render: (text, record) => [
        <Tooltip title="View Tasks" key="view">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedProject(record);
              setShowTasks(true);
            }}
          />
        </Tooltip>,
        isOwner(record) && (
          <Tooltip title="Edit" key="edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingProject(record);
                setShowModal(true);
              }}
            />
          </Tooltip>
        ),
      ],
    },
  ];

  return (
    <>
      <ProTable
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          const response = await getProjects();
          const projects = response.data.data.projects || [];
          
          // Basic filtering (can be enhanced if backend supports it)
          let filteredData = projects;
          if (params.name) {
            filteredData = filteredData.filter(item => 
              item.name.toLowerCase().includes(params.name.toLowerCase())
            );
          }
          if (params.status) {
            filteredData = filteredData.filter(item => item.status === params.status);
          }

          return {
            data: filteredData,
            success: true,
            total: filteredData.length,
          };
        }}
        rowKey="_id"
        search={{
          labelWidth: "auto",
        }}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
        form={{
          syncToUrl: (values, type) => {
            if (type === "get") {
              return {
                ...values,
                created_at: [values.startTime, values.endTime],
              };
            }
            return values;
          },
        }}
        pagination={{
          pageSize: 10,
        }}
        dateFormatter="string"
        headerTitle="Projects List"
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProject(null);
              setShowModal(true);
            }}
            type="primary"
          >
            Create Project
          </Button>,
        ]}
      />

      <ProjectModal
        project={editingProject || {}}
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        onSuccess={() => {
          setShowModal(false);
          setEditingProject(null);
          actionRef.current?.reload();
        }}
      />

      <ProjectTasks
        project={selectedProject}
        isOpen={showTasks}
        onClose={() => {
          setShowTasks(false);
          setSelectedProject(null);
        }}
      />
    </>
  );
};

export default ProjectsList;
