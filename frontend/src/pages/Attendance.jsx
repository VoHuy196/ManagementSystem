import React, { useEffect, useState } from "react";
import { Card, Button, Table, Tag, Space, Typography, message, Row, Col, Statistic } from "antd";
import { LoginOutlined, LogoutOutlined, HistoryOutlined } from "@ant-design/icons";
import { attendanceApi } from "../services/attendanceApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const { user } = useAuth();
  const isAdminOrManager = user?.role === "Admin" || user?.role === "Manager";

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = isAdminOrManager 
        ? await attendanceApi.getAllRecords() 
        : await attendanceApi.getMyRecords();
      
      if (response.success) {
        setRecords(response.data);
        
        // Find today's record for the current user
        const today = dayjs().startOf('day');
        const found = response.data.find(r => 
          dayjs(r.date).isSame(today, 'day') && 
          (isAdminOrManager ? r.employee?.user === user?._id : true)
        );
        setTodayRecord(found);
      }
    } catch (error) {
      message.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [isAdminOrManager]);

  const handleCheckIn = async () => {
    try {
      const res = await attendanceApi.checkIn();
      if (res.success) {
        message.success("Checked in successfully!");
        fetchRecords();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await attendanceApi.checkOut();
      if (res.success) {
        message.success("Checked out successfully!");
        fetchRecords();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Check-out failed");
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
    },
    ...(isAdminOrManager ? [{
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
      render: (emp) => emp?.name || "N/A",
    }] : []),
    {
      title: "Check In",
      dataIndex: "checkIn",
      key: "checkIn",
      render: (time) => time ? dayjs(time).format("HH:mm:ss") : "-",
    },
    {
      title: "Check Out",
      dataIndex: "checkOut",
      key: "checkOut",
      render: (time) => time ? dayjs(time).format("HH:mm:ss") : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = status === "Present" ? "green" : "volcano";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Attendance Management</Title>
      
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={8}>
          <Card className="text-center shadow-sm">
            <Statistic 
              title="Today Status" 
              value={todayRecord ? (todayRecord.checkOut ? "Completed" : "Working") : "Not Started"} 
              valueStyle={{ color: todayRecord ? '#3f8600' : '#cf1322' }}
            />
            <Space className="mt-4">
              <Button 
                type="primary" 
                icon={<LoginOutlined />} 
                onClick={handleCheckIn}
                disabled={!!todayRecord}
                size="large"
              >
                Check In
              </Button>
              <Button 
                danger 
                icon={<LogoutOutlined />} 
                onClick={handleCheckOut}
                disabled={!todayRecord || !!todayRecord.checkOut}
                size="large"
              >
                Check Out
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={16}>
          <Card title={<><HistoryOutlined /> Attendance History</>} className="shadow-sm">
            <Table 
              dataSource={records} 
              columns={columns} 
              rowKey="_id" 
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Attendance;
