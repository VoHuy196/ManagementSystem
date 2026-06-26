import React, { useRef, useState } from "react";
import { ProTable } from "@ant-design/pro-components";
import { Button, Space, Typography, Tooltip, Popconfirm, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getEmployees, deleteEmployee } from "../services/employeeApi.js";
import EmployeeModal from "../modal/EmployeeModal.jsx";
import toast from "react-hot-toast";

const { Text } = Typography;

const Employees = () => {
  const actionRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      toast.success("Employee deleted successfully");
      actionRef.current?.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete employee");
    }
  };

  const columns = [
    {
      title: "Employee Code",
      dataIndex: "employeeCode",
      copyable: true,
      sorter: true,
      render: (text) => <Text code color="blue">{text}</Text>,
    },
    {
      title: "Full Name",
      dataIndex: "name",
      copyable: true,
      search: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Department",
      dataIndex: "department",
      search: true,
      render: (text) => text ? <Tag color="geekblue">{text}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Birthday",
      dataIndex: "birthday",
      valueType: "date",
      hideInSearch: true,
    },
    {
      title: "Join Date",
      dataIndex: "joinDate",
      valueType: "date",
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      valueType: "dateTime",
      hideInSearch: true,
      hideInTable: true,
    },
    {
      title: "Actions",
      valueType: "option",
      key: "option",
      render: (text, record) => [
        <Tooltip title="Edit" key="edit">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingEmployee(record);
              setShowModal(true);
            }}
          />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="Delete employee"
          description="Are you sure to delete this employee?"
          onConfirm={() => handleDelete(record._id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>,
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
          const response = await getEmployees();
          let data = response.data.data.employees || [];

          if (params.name) {
            data = data.filter((item) =>
              item.name.toLowerCase().includes(params.name.toLowerCase())
            );
          }
          if (params.employeeCode) {
            data = data.filter((item) =>
              item.employeeCode.toLowerCase().includes(params.employeeCode.toLowerCase())
            );
          }
          if (params.department) {
            data = data.filter((item) =>
              item.department && item.department.toLowerCase().includes(params.department.toLowerCase())
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
        headerTitle="Employee Management"
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEmployee(null);
              setShowModal(true);
            }}
            type="primary"
          >
            Add Employee
          </Button>,
        ]}
      />

      {(showModal || editingEmployee) && (
        <EmployeeModal
          employee={editingEmployee}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingEmployee(null);
            actionRef.current?.reload();
          }}
        />
      )}
    </>
  );
};

export default Employees;
