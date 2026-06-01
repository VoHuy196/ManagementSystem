import React, { useEffect, useState } from "react";
import { Card, Table, Typography, Row, Col, List, Avatar, Tag, Statistic } from "antd";
import { TrophyOutlined, LineChartOutlined, StarOutlined } from "@ant-design/icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { performanceApi } from "../services/performanceApi";
import { useAuth } from "../context/AuthContext";

const { Title } = Typography;

const Performance = () => {
  const [ranking, setRanking] = useState([]);
  const [myStats, setMyStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rankingRes, statsRes] = await Promise.all([
        performanceApi.getRanking(),
        performanceApi.getMyStats()
      ]);
      
      if (rankingRes.success) setRanking(rankingRes.data);
      if (statsRes.success) setMyStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch performance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rankingColumns = [
    {
      title: "Rank",
      key: "rank",
      render: (_, __, index) => (
        <Avatar 
          style={{ backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#f0f0f0', color: index < 3 ? '#fff' : '#000' }}
        >
          {index + 1}
        </Avatar>
      ),
      width: 80,
    },
    {
      title: "Employee",
      dataIndex: "employee",
      key: "employee",
      render: (emp) => emp?.name || "N/A",
    },
    {
      title: "Tasks (Done/Total)",
      key: "tasks",
      render: (record) => `${record.completedTasks}/${record.totalTasks}`,
    },
    {
      title: "Score",
      dataIndex: "finalScore",
      key: "finalScore",
      render: (score) => (
        <Tag color={score >= 8 ? "gold" : score >= 5 ? "blue" : "volcano"}>
          {score} / 10
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Title level={2}>Performance Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={<><TrophyOutlined /> Top Performers (This Month)</>} className="shadow-sm">
            <Table 
              dataSource={ranking} 
              columns={rankingColumns} 
              rowKey="_id" 
              pagination={false} 
              loading={loading}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title={<><LineChartOutlined /> My Performance Trend</>} className="shadow-sm">
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={myStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="finalScore" stroke="#1890ff" name="Final Score" strokeWidth={2} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            
            <Col span={24}>
                <Card title={<><StarOutlined /> Performance Insights</>} className="shadow-sm">
                   <Row gutter={16}>
                      <Col span={8}>
                        <Statistic title="Avg. Monthly Score" value={myStats.length > 0 ? (myStats.reduce((acc, curr) => acc + curr.finalScore, 0) / myStats.length).toFixed(1) : 0} precision={1} suffix="/ 10" />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Total Tasks Completed" value={myStats.reduce((acc, curr) => acc + curr.completedTasks, 0)} />
                      </Col>
                      <Col span={8}>
                        <Statistic title="Overall Completion Rate" value={myStats.length > 0 ? (myStats.reduce((acc, curr) => acc + curr.taskCompletionRate, 0) / myStats.length).toFixed(0) : 0} suffix="%" />
                      </Col>
                   </Row>
                </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Performance;
