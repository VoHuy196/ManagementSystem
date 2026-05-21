import React, { useRef } from "react";
import { ProTable } from "@ant-design/pro-components";
import { Typography, Tag } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { getWorklogs } from "../services/worklogApi.js";

const { Text } = Typography;

const Worklogs = () => {
  const actionRef = useRef();

  const columns = [
    {
      title: "Date",
      dataIndex: "entryDate",
      valueType: "date",
      sorter: true,
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Employee",
      dataIndex: "employee",
      render: (text) => <Text strong color="blue">{text}</Text>,
    },
    {
      title: "Task",
      dataIndex: "task",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Hours",
      dataIndex: "hours",
      sorter: true,
      render: (text) => (
        <Tag color="green" icon={<ClockCircleOutlined />}>
          {text}h
        </Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      valueType: "dateTime",
      hideInSearch: true,
      hideInTable: true,
    },
  ];

  return (
    <ProTable
      columns={columns}
      actionRef={actionRef}
      cardBordered
      request={async (params) => {
        const response = await getWorklogs();
        let data = response.data.data.worklogs || [];

        // Manual filtering since backend might not support it yet
        if (params.employee) {
          data = data.filter((item) =>
            item.employee.toLowerCase().includes(params.employee.toLowerCase())
          );
        }
        if (params.task) {
          data = data.filter((item) =>
            item.task.toLowerCase().includes(params.task.toLowerCase())
          );
        }

        return {
          data,
          success: true,
          total: data.length,
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
      pagination={{
        pageSize: 10,
      }}
      dateFormatter="string"
      headerTitle="Work Logs"
    />
  );
};

export default Worklogs;
