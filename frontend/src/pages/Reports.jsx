import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Typography, Select, message } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { statsApi } from "../services/statsApi";
import { 
  TeamOutlined, 
  ProjectOutlined, 
  CheckSquareOutlined, 
  CalendarOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

const Reports = () => {
  const [overview, setOverview] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [overviewRes, attendanceRes, projectsRes] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getAttendance(),
        statsApi.getProjects()
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      
      if (attendanceRes.success) {
        const { present, absent, leaves } = attendanceRes.data;
        setAttendance([
          { name: "Present", value: present, color: "#52c41a" },
          { name: "Absent", value: absent, color: "#f5222d" },
          { name: "Leave", value: leaves, color: "#1890ff" },
        ]);
      }

      if (projectsRes.success) setProjects(projectsRes.data);
    } catch (error) {
      message.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <Title level={2}>Reports & Statistics</Title>

      {/* Overview Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic title="Total Employees" value={overview.totalEmployees} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic title="Active Projects" value={overview.totalProjects} valueStyle={{ color: '#3f8600' }} prefix={<ProjectOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic title="Pending Tasks" value={overview.totalTasks} valueStyle={{ color: '#cf1322' }} prefix={<CheckSquareOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-sm">
            <Statistic title="Pending Leaves" value={overview.pendingLeaves} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Project Progress Bar Chart */}
        <Col xs={24} lg={16}>
          <Card title="Project Completion Progress (%)" className="shadow-sm">
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={projects} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="percentage" name="Progress %" fill="#1890ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Attendance Pie Chart */}
        <Col xs={24} lg={8}>
          <Card title="Monthly Attendance Overview" className="shadow-sm">
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={attendance}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
