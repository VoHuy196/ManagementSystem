import React, { useEffect, useState, useCallback } from "react";
import {
  Card, Row, Col, Statistic, Typography, Spin, Button, message,
} from "antd";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  TeamOutlined, ProjectOutlined, CheckSquareOutlined, CalendarOutlined,
  DownloadOutlined, FileExcelOutlined,
} from "@ant-design/icons";
import { statsApi } from "../services/statsApi";

const { Title } = Typography;

// ── Color palette ────────────────────────────────────────────────────────
const COLORS = {
  Done: "#52c41a",
  "In Progress": "#1890ff",
  Todo: "#faad14",
  attendance: ["#52c41a", "#f5222d", "#1890ff"],
};

// ── Backend CSV download ─────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const downloadBackendCSV = (endpoint, filename) => {
  const a = document.createElement("a");
  a.href = `${BASE_URL}/export/${endpoint}`;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview]         = useState({});
  const [attendance, setAttendance]     = useState([]);
  const [projects, setProjects]         = useState([]);
  const [worklogData, setWorklogData]   = useState([]);
  const [taskData, setTaskData]         = useState([]);
  const [perfData, setPerfData]         = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, attRes, projRes, wlRes, taskRes, perfRes] = await Promise.all([
        statsApi.getOverview(),
        statsApi.getAttendance(),
        statsApi.getProjects(),
        statsApi.getWorklogs(),
        statsApi.getTasks(),
        statsApi.getPerformance(),
      ]);

      if (ovRes.data.success)   setOverview(ovRes.data.data);
      if (attRes.data.success) {
        const { present, absent, leaves } = attRes.data.data;
        setAttendance([
          { name: "Đi làm",   value: present, color: COLORS.attendance[0] },
          { name: "Vắng mặt", value: absent,  color: COLORS.attendance[1] },
          { name: "Nghỉ phép", value: leaves, color: COLORS.attendance[2] },
        ]);
      }
      if (projRes.data.success) setProjects(projRes.data.data);
      if (wlRes.data.success)   setWorklogData(wlRes.data.data);
      if (taskRes.data.success) setTaskData(taskRes.data.data);
      if (perfRes.data.success) setPerfData(perfRes.data.data);
    } catch {
      message.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <Spin spinning={loading}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Title level={2} style={{ margin: 0 }}>Báo cáo &amp; Thống kê</Title>
          <div className="flex gap-2">
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => downloadBackendCSV("worklogs",  "worklogs.csv")}
            >
              Export Worklogs
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => downloadBackendCSV("tasks",     "tasks.csv")}
            >
              Export Tasks
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={() => downloadBackendCSV("employees", "employees.csv")}
            >
              Export Employees
            </Button>
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              onClick={() => downloadBackendCSV("projects",  "projects.csv")}
            >
              Export Projects
            </Button>
          </div>
        </div>

        {/* ── Overview Cards ── */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Tổng nhân viên"
                value={overview.totalEmployees}
                prefix={<TeamOutlined style={{ color: "#1890ff" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Dự án đang chạy"
                value={overview.totalProjects}
                valueStyle={{ color: "#3f8600" }}
                prefix={<ProjectOutlined style={{ color: "#3f8600" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Task chưa hoàn thành"
                value={overview.totalTasks}
                valueStyle={{ color: "#cf1322" }}
                prefix={<CheckSquareOutlined style={{ color: "#cf1322" }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-sm">
              <Statistic
                title="Đơn nghỉ phép chờ duyệt"
                value={overview.pendingLeaves}
                prefix={<CalendarOutlined style={{ color: "#faad14" }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* ── Row 1: Project Progress + Attendance ── */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={16}>
            <Card title="Tiến độ hoàn thành dự án (%)" className="shadow-sm">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={projects} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v}%`, "Tiến độ"]} />
                    <Bar dataKey="percentage" name="Tiến độ" fill="#1890ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Chuyên cần tháng này" className="shadow-sm">
              <div style={{ width: "100%", height: 300 }}>
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
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {attendance.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
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

        {/* ── Row 2: Worklog hours + Task completion ── */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card title="Giờ làm theo tháng (6 tháng gần nhất)" className="shadow-sm">
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={worklogData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis unit="h" />
                    <Tooltip formatter={(v) => [`${v}h`, "Tổng giờ"]} />
                    <Bar dataKey="hours" name="Giờ làm" fill="#52c41a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Task theo trạng thái theo tháng" className="shadow-sm">
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={taskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Done"        name="Hoàn thành"   fill={COLORS.Done}           stackId="a" />
                    <Bar dataKey="In Progress" name="Đang làm"     fill={COLORS["In Progress"]} stackId="a" />
                    <Bar dataKey="Todo"        name="Chưa bắt đầu" fill={COLORS.Todo}           stackId="a" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── Row 3: Performance trend ── */}
        {perfData.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Điểm KPI trung bình theo tháng" className="shadow-sm">
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={perfData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        name="Điểm KPI TB"
                        stroke="#722ed1"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </Spin>
  );
};

export default Reports;
