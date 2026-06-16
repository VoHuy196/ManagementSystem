import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  Typography,
  Spin,
  Tag,
  Space,
  Empty,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  WarningOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { workloadStatsApi } from "../services/workloadStatsApi.js";
import { getWorkShifts } from "../services/workShiftApi.js";
import { getProjects } from "../services/projectApi.js";
import { getEmployees } from "../services/employeeApi.js";
import ProductivityHeatmap from "../components/ProductivityHeatmap.jsx";

const { Title, Text } = Typography;

const FALLBACK_COLORS = ["#1890ff", "#52c41a", "#fa8c16", "#f5222d", "#722ed1", "#13c2c2", "#eb2f96", "#faad14"];

const cardGradients = [
  { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", icon: "#e8e0ff" },
  { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", icon: "#e0fff0" },
  { bg: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", icon: "#fff3e0" },
  { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", icon: "#ffe0e6" },
];

const CustomTooltipContent = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "none",
        }}
      >
        <Text strong style={{ display: "block", marginBottom: 4 }}>
          {label}
        </Text>
        {payload.map((item, index) => (
          <div key={index} style={{ color: item.color, fontSize: "13px" }}>
            {item.name}: <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const WorkloadAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("week");
  const [projectId, setProjectId] = useState(undefined);
  const [userId, setUserId] = useState(undefined);

  const [teamOverview, setTeamOverview] = useState(null);
  const [shiftComparison, setShiftComparison] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [userBreakdown, setUserBreakdown] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [shiftsRes, projectsRes, employeesRes] = await Promise.all([
          getWorkShifts(),
          getProjects(),
          getEmployees(),
        ]);
        if (shiftsRes.data.success) setShifts(shiftsRes.data.data || []);
        if (projectsRes.data.success) setProjects(projectsRes.data.data.projects || []);
        if (employeesRes.data.success) setEmployees(employeesRes.data.data.employees || []);
      } catch (error) {
        console.error("Failed to load filter data:", error);
      }
    };
    fetchFilters();
  }, []);

  // Fetch main data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = { period };
      if (projectId) params.projectId = projectId;
      if (userId) params.userId = userId;

      try {
        const [overviewRes, shiftRes, heatmapRes, byUserRes] = await Promise.all([
          workloadStatsApi.getTeamOverview(params),
          workloadStatsApi.getShiftComparison(params),
          workloadStatsApi.getHeatmap(params),
          workloadStatsApi.getByUser(params),
        ]);

        if (overviewRes.data.success) setTeamOverview(overviewRes.data.data);
        if (shiftRes.data.success) setShiftComparison(shiftRes.data.data);
        if (heatmapRes.data.success) setHeatmapData(heatmapRes.data.data);
        if (byUserRes.data.success) setUserBreakdown(byUserRes.data.data);
      } catch (error) {
        console.error("Failed to fetch workload stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period, projectId, userId]);

  // Overview stats cards
  const overviewCards = useMemo(() => {
    if (!teamOverview) {
      return [
        { title: "Tổng giờ làm", value: 0, icon: <ClockCircleOutlined />, suffix: "h" },
        { title: "Task hoàn thành", value: 0, icon: <CheckCircleOutlined /> },
        { title: "TB giờ/Task", value: 0, icon: <FieldTimeOutlined />, suffix: "h", precision: 1 },
        { title: "Giờ tăng ca", value: 0, icon: <WarningOutlined />, suffix: "h" },
      ];
    }
    return [
      {
        title: "Tổng giờ làm",
        value: teamOverview.totalHours || 0,
        icon: <ClockCircleOutlined />,
        suffix: "h",
      },
      {
        title: "Task hoàn thành",
        value: teamOverview.totalTasks || 0,
        icon: <CheckCircleOutlined />,
      },
      {
        title: "TB giờ/Task",
        value: teamOverview.avgHoursPerTask || 0,
        icon: <FieldTimeOutlined />,
        suffix: "h",
        precision: 1,
      },
      {
        title: "Giờ tăng ca",
        value: teamOverview.overtimeHours || 0,
        icon: <WarningOutlined />,
        suffix: "h",
      },
    ];
  }, [teamOverview]);

  // Chart data for shift comparison bar chart
  const barChartData = useMemo(() => {
    if (!shiftComparison || shiftComparison.length === 0) return [];
    return shiftComparison.map((item) => ({
      name: item.name,
      hours: item.hours || 0,
      tasks: item.tasks || 0,
      color: item.color || "#1890ff",
    }));
  }, [shiftComparison]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    if (!shiftComparison || shiftComparison.length === 0) return [];
    return shiftComparison.map((item, index) => ({
      name: item.name,
      value: item.tasks || 0,
      color: item.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    }));
  }, [shiftComparison]);

  // User breakdown table columns
  const userColumns = useMemo(() => {
    const baseCols = [
      {
        title: "Nhân viên",
        dataIndex: "fullName",
        key: "fullName",
        fixed: "left",
        width: 180,
        render: (name) => <Text strong>{name || "N/A"}</Text>,
      },
    ];

    // Dynamic columns for each shift
    shifts.forEach((shift) => {
      baseCols.push({
        title: (
          <Space>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: shift.color || "#1890ff",
                display: "inline-block",
              }}
            />
            {shift.name}
          </Space>
        ),
        key: `shift_${shift._id}`,
        align: "center",
        render: (_, record) => {
          const shiftData = record.shifts?.find(
            (s) => s.shiftInfo?._id === shift._id || (s.shift && s.shift.toString() === shift._id)
          );
          return shiftData ? (
            <Tag color={shift.color || "blue"}>{shiftData.totalHours || 0}h</Tag>
          ) : (
            <Text type="secondary">—</Text>
          );
        },
      });
    });

    baseCols.push(
      {
        title: "Tổng giờ",
        dataIndex: "overallHours",
        key: "overallHours",
        align: "center",
        sorter: (a, b) => (a.overallHours || 0) - (b.overallHours || 0),
        render: (val) => (
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {val || 0}h
          </Tag>
        ),
      },
      {
        title: "Tổng sessions",
        dataIndex: "overallSessions",
        key: "overallSessions",
        align: "center",
        sorter: (a, b) => (a.overallSessions || 0) - (b.overallSessions || 0),
        render: (val) => (
          <Tag color="green" style={{ fontWeight: 600 }}>
            {val || 0}
          </Tag>
        ),
      }
    );

    return baseCols;
  }, [shifts]);

  return (
    <div style={{ padding: "0" }}>
      {/* Header + Filters */}
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
            <BarChartOutlined style={{ marginRight: 12, color: "#1890ff" }} />
            Workload Analytics
          </Title>
          <Text type="secondary" style={{ marginTop: 4, display: "block" }}>
            Phân tích khối lượng công việc và năng suất theo ca
          </Text>
        </div>

        <Space wrap size="middle">
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 140 }}
            options={[
              { label: "Tuần này", value: "week" },
              { label: "Tháng này", value: "month" },
              { label: "Quý này", value: "quarter" },
            ]}
          />
          <Select
            value={projectId}
            onChange={setProjectId}
            allowClear
            placeholder="Tất cả dự án"
            style={{ width: 180 }}
            options={projects.map((p) => ({
              label: p.name,
              value: p._id,
            }))}
          />
          <Select
            value={userId}
            onChange={setUserId}
            allowClear
            placeholder="Tất cả nhân viên"
            style={{ width: 180 }}
            options={employees.map((e) => ({
              label: e.name || e.fullName || e.user?.fullName || "N/A",
              value: e.user?._id || e.user || e._id,
            }))}
          />
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* Overview Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {overviewCards.map((card, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                style={{
                  borderRadius: "12px",
                  border: "none",
                  background: cardGradients[index].bg,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
                styles={{ body: { padding: "20px 24px" } }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "13px",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {card.title}
                    </Text>
                    <div
                      style={{
                        color: "#fff",
                        fontSize: "28px",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {card.precision
                        ? Number(card.value).toFixed(card.precision)
                        : card.value}
                      {card.suffix && (
                        <span style={{ fontSize: "16px", fontWeight: 400, marginLeft: 4 }}>
                          {card.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      color: "#fff",
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Bar Chart - Shift Comparison */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: "#1890ff" }} />
                  <span>So sánh ca làm việc</span>
                </Space>
              }
              style={{ borderRadius: "12px", height: "100%" }}
              styles={{ body: { padding: "16px 24px" } }}
            >
              {barChartData.length > 0 ? (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#8c8c8c" }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: "#8c8c8c" }} />
                      <Tooltip content={<CustomTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey="hours"
                        name="Giờ làm"
                        fill="#1890ff"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      >
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-hours-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="tasks"
                        name="Số tasks"
                        fill="#52c41a"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                        opacity={0.7}
                      >
                        {barChartData.map((entry, index) => (
                          <Cell
                            key={`cell-tasks-${index}`}
                            fill={entry.color}
                            opacity={0.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="Chưa có dữ liệu" />
              )}
            </Card>
          </Col>

          {/* Pie Chart - Task Distribution */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  <span>Phân bổ task theo ca</span>
                </Space>
              }
              style={{ borderRadius: "12px", height: "100%" }}
              styles={{ body: { padding: "16px 24px" } }}
            >
              {pieChartData.length > 0 ? (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={{ stroke: "#8c8c8c" }}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} tasks`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty description="Chưa có dữ liệu" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Heatmap Section */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: "#722ed1" }} />
              <span>Bản đồ nhiệt năng suất</span>
            </Space>
          }
          style={{ borderRadius: "12px", marginBottom: 24 }}
          styles={{ body: { padding: "24px" } }}
        >
          <ProductivityHeatmap data={heatmapData} />
        </Card>

        {/* User Breakdown Table */}
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: "#fa8c16" }} />
              <span>Chi tiết theo nhân viên</span>
            </Space>
          }
          style={{ borderRadius: "12px" }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={userBreakdown}
            columns={userColumns}
            rowKey={(record) => record.userId || record._id || record.employeeName}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nhân viên`,
            }}
            scroll={{ x: "max-content" }}
            size="middle"
          />
        </Card>
      </Spin>
    </div>
  );
};

export default WorkloadAnalytics;
