import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Card, Row, Col, Statistic, Button, Typography, Tag, Space, Select, DatePicker,
} from "antd";
import {
  ClockCircleOutlined, PlusOutlined, CalendarOutlined, FireOutlined, TeamOutlined,
} from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { getWorklogs } from "../services/worklogApi.js";
import { getEmployees } from "../services/employeeApi.js";
import WorklogModal from "../modal/WorklogModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ─── Helper: group hours by day for bar chart ──────────────────────────────
const buildChartData = (worklogs) => {
  const map = {};
  worklogs.forEach((w) => {
    const day = dayjs(w.entryDate).format("DD/MM");
    map[day] = (map[day] || 0) + (w.hours || 0);
  });
  return Object.entries(map)
    .sort(([a], [b]) => {
      const da = dayjs(a, "DD/MM");
      const db = dayjs(b, "DD/MM");
      return da - db;
    })
    .slice(-14) // last 14 days
    .map(([date, hours]) => ({ date, hours: parseFloat(hours.toFixed(1)) }));
};

// ─── Helper: calc totals ───────────────────────────────────────────────────
const calcTotals = (worklogs) => {
  const now = dayjs();
  const thisWeekStart = now.startOf("isoWeek");
  const thisMonthStart = now.startOf("month");

  let weekHours = 0;
  let monthHours = 0;
  let totalHours = 0;

  worklogs.forEach((w) => {
    const d = dayjs(w.entryDate);
    totalHours += w.hours || 0;
    if (d.isSame(thisWeekStart) || d.isAfter(thisWeekStart)) weekHours += w.hours || 0;
    if (d.isSame(thisMonthStart) || d.isAfter(thisMonthStart)) monthHours += w.hours || 0;
  });

  return {
    total: parseFloat(totalHours.toFixed(1)),
    week: parseFloat(weekHours.toFixed(1)),
    month: parseFloat(monthHours.toFixed(1)),
  };
};

const Worklogs = () => {
  const { user } = useAuth();
  const actionRef = useRef();
  const isAdminOrManager = user?.role === "Admin" || user?.role === "Manager";

  const [allWorklogs, setAllWorklogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState({ total: 0, week: 0, month: 0 });
  const [showModal, setShowModal] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState(undefined);
  const [filterRange, setFilterRange] = useState(null);

  // ── Fetch all data ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [wlRes, empRes] = await Promise.all([
        getWorklogs(),
        getEmployees(),
      ]);
      const wls = wlRes.data?.data?.worklogs || [];
      const emps = empRes.data?.data?.employees || empRes.data?.employees || [];
      setAllWorklogs(wls);
      setEmployees(emps);
      setChartData(buildChartData(wls));
      setTotals(calcTotals(wls));
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter logic ────────────────────────────────────────────────────────
  const filteredWorklogs = allWorklogs.filter((w) => {
    if (filterEmployee && w.employee?._id !== filterEmployee) return false;
    if (filterRange) {
      const d = dayjs(w.entryDate);
      const [start, end] = filterRange;
      if (d.isBefore(start, "day") || d.isAfter(end, "day")) return false;
    }
    return true;
  });

  // ── Columns ─────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Date",
      dataIndex: "entryDate",
      valueType: "date",
      sorter: (a, b) => dayjs(a.entryDate) - dayjs(b.entryDate),
      render: (_, record) => (
        <Text>{dayjs(record.entryDate).format("DD/MM/YYYY")}</Text>
      ),
    },
    {
      title: "Employee",
      dataIndex: ["employee", "name"],
      render: (_, record) => {
        const name = record.employee?.name || "—";
        const code = record.employee?.employeeCode || "";
        return (
          <Space>
            <TeamOutlined style={{ color: "#1890ff" }} />
            <Text strong>{name}</Text>
            {code && <Tag color="blue">{code}</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Task",
      dataIndex: ["task", "title"],
      render: (_, record) => (
        <Text>{record.task?.title || "—"}</Text>
      ),
    },
    {
      title: "Hours",
      dataIndex: "hours",
      sorter: (a, b) => a.hours - b.hours,
      render: (hours) => (
        <Tag
          color={hours >= 8 ? "red" : hours >= 4 ? "orange" : "green"}
          icon={<ClockCircleOutlined />}
        >
          {hours}h
        </Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (text) => <Text type="secondary">{text || "—"}</Text>,
    },
  ];

  return (
    <div className="p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <Title level={2} style={{ margin: 0 }}>
          <ClockCircleOutlined className="mr-2 text-blue-500" />
          Work Logs
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setShowModal(true)}
        >
          Log Work
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="shadow-sm">
            <Statistic
              title="Tổng giờ làm"
              value={totals.total}
              suffix="h"
              prefix={<FireOutlined style={{ color: "#f5222d" }} />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm">
            <Statistic
              title="Tuần này"
              value={totals.week}
              suffix="h"
              prefix={<CalendarOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm">
            <Statistic
              title="Tháng này"
              value={totals.month}
              suffix="h"
              prefix={<ClockCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Bar Chart ── */}
      <Card title="Giờ làm theo ngày (14 ngày gần nhất)" className="shadow-sm mb-6">
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis unit="h" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}h`, "Giờ làm"]} />
              <Legend />
              <Bar dataKey="hours" name="Giờ làm" fill="#1890ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Filters ── */}
      <Card className="shadow-sm mb-4">
        <Space wrap>
          {isAdminOrManager && (
            <Select
              placeholder="Lọc theo nhân viên"
              allowClear
              style={{ width: 200 }}
              onChange={setFilterEmployee}
              value={filterEmployee}
            >
              {employees.map((e) => (
                <Select.Option key={e._id} value={e._id}>
                  {e.name}
                </Select.Option>
              ))}
            </Select>
          )}
          <RangePicker
            onChange={(dates) => setFilterRange(dates ? [dates[0], dates[1]] : null)}
            placeholder={["Từ ngày", "Đến ngày"]}
          />
          <Button
            onClick={() => {
              setFilterEmployee(undefined);
              setFilterRange(null);
            }}
          >
            Xóa bộ lọc
          </Button>
        </Space>
      </Card>

      {/* ── Table ── */}
      <ProTable
        columns={columns}
        actionRef={actionRef}
        cardBordered
        dataSource={filteredWorklogs}
        rowKey="_id"
        search={false}
        options={{ reload: fetchData }}
        pagination={{ pageSize: 10 }}
        dateFormatter="string"
        headerTitle={`${filteredWorklogs.length} bản ghi`}
        toolBarRender={() => []}
      />

      {/* ── Modal ── */}
      {showModal && (
        <WorklogModal
          onClose={() => {
            setShowModal(false);
            fetchData();
            actionRef.current?.reload();
          }}
          taskId={null}
        />
      )}
    </div>
  );
};

export default Worklogs;
