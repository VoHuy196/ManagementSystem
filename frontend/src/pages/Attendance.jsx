import React, { useEffect, useState } from "react";
import { Card, Button, Table, Tag, Space, Typography, message, Row, Col, Statistic, Alert } from "antd";
import { LoginOutlined, LogoutOutlined, HistoryOutlined, UserOutlined } from "@ant-design/icons";
import { attendanceApi } from "../services/attendanceApi";
import { getMyEmployee } from "../services/employeeApi";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [hasProfile, setHasProfile] = useState(true); // track nếu có employee profile
  const { user } = useAuth();
  // user object có format: { data: { user: { role, ... } } } hoặc trực tiếp { role, ... }
  const userRole = user?.data?.user?.role || user?.role;
  const isAdminOrManager = userRole === "Admin" || userRole === "Manager";

  // Ensure employee profile exists khi mount
  useEffect(() => {
    const ensureProfile = async () => {
      try {
        await getMyEmployee(); // Backend tự động tạo nếu chưa có
        setHasProfile(true);
      } catch (err) {
        setHasProfile(false);
      }
    };
    ensureProfile();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = isAdminOrManager 
        ? await attendanceApi.getAllRecords() 
        : await attendanceApi.getMyRecords();
      
      // Axios wraps HTTP body inside response.data
      // Backend ApiResponse format: { statusCode, data: [...], success, message }
      const body = response.data;
      if (body.success) {
        setRecords(body.data);
        
        // Find today's record for the current user
        const today = dayjs().startOf('day');
        const found = body.data.find(r => 
          dayjs(r.date).isSame(today, 'day')
        );
        setTodayRecord(found);
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to fetch records");
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
      if (res.data.success) {
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
      if (res.data.success) {
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

      {!hasProfile && (
        <Alert
          type="warning"
          showIcon
          icon={<UserOutlined />}
          message="Employee profile not set up"
          description="Your employee profile could not be found or created. Please contact your administrator."
          className="mb-4"
        />
      )}
      
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
