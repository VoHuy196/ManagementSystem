import React from "react";
import { ProList } from "@ant-design/pro-components";
import { Tag, Typography, Space, Avatar } from "antd";
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getActionLogs } from "../services/actionLogApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

const ActionLog = () => {
  const { user: currentUser } = useAuth();

  const getActionIcon = (action) => {
    switch (action) {
      case "Task Created":
        return <PlusCircleOutlined style={{ color: "#52c41a" }} />;
      case "Task Updated":
        return <EditOutlined style={{ color: "#1890ff" }} />;
      case "Task Deleted":
        return <DeleteOutlined style={{ color: "#ff4d4f" }} />;
      case "Task Status Updated":
        return <CheckCircleOutlined style={{ color: "#722ed1" }} />;
      default:
        return <InfoCircleOutlined style={{ color: "#faad14" }} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "Task Created": return "green";
      case "Task Updated": return "blue";
      case "Task Deleted": return "red";
      case "Task Status Updated": return "purple";
      default: return "default";
    }
  };

  const getDisplayName = (userObj) => {
    if (!userObj) return "Unknown User";
    const currentUserId = currentUser?.data?.user?._id || currentUser?._id;
    const name = userObj.fullName || "Unknown User";
    return currentUserId === userObj._id ? `${name} (You)` : name;
  };

  return (
    <ProList
      headerTitle="Activity Feed"
      rowKey="_id"
      request={async () => {
        const response = await getActionLogs();
        const logs = response.data.data.logs || [];
        return {
          data: logs.sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt))),
          success: true,
        };
      }}
      pagination={{
        pageSize: 10,
      }}
      showActions="hover"
      metas={{
        title: {
          render: (_, record) => (
            <Space>
              {getActionIcon(record.action)}
              <Text strong>{getDisplayName(record.user)}</Text>
              <Text>{record.action.toLowerCase()}</Text>
              {record.task && (
                <Text type="secondary">
                  "{record.task.title}"
                </Text>
              )}
            </Space>
          ),
        },
        description: {
          render: (_, record) => (
            <Text type="secondary">
              {dayjs(record.createdAt).fromNow()} ({dayjs(record.createdAt).format("DD/MM/YYYY HH:mm")})
            </Text>
          ),
        },
        avatar: {
          render: () => (
            <Avatar icon={<UserOutlined />} />
          ),
        },
        extra: {
          render: (_, record) => (
            <Tag color={getActionColor(record.action)}>{record.action}</Tag>
          ),
        },
      }}
    />
  );
};

export default ActionLog;
