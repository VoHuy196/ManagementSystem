import React from "react";
import { Link } from "react-router-dom";
import { Typography, Button, Space, Card, Row, Col, Statistic, Tag } from "antd";
import {
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  MobileOutlined,
  ArrowRightOutlined,
  LoginOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      title: "Real-time Collaboration",
      description: "Live task updates across all connected users via Socket.io. See changes instantly.",
      icon: <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      color: 'blue'
    },
    {
      title: "Drag & Drop Interface",
      description: "Intuitive kanban board to move tasks between columns with visual feedback.",
      icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      color: 'green'
    },
    {
      title: "Smart Assignment",
      description: "Automatically balances workload using intelligent assignment algorithms.",
      icon: <RocketOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      color: 'purple'
    },
    {
      title: "Activity Tracking",
      description: "Comprehensive audit trail of all task activities with real-time updates.",
      icon: <BarChartOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      color: 'orange'
    },
    {
      title: "Priority Management",
      description: "Organize tasks with High, Medium, and Low priority color coding.",
      icon: <CheckCircleOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
      color: 'red'
    },
    {
      title: "Responsive Design",
      description: "Mobile-first design that works seamlessly on all your modern devices.",
      icon: <MobileOutlined style={{ fontSize: '24px', color: '#13c2c2' }} />,
      color: 'cyan'
    }
  ];

  return (
    <div style={{ padding: '40px 0' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '800px', margin: '0 auto 80px' }}>
        <Title level={1} style={{ fontSize: '48px', marginBottom: '24px' }}>
          Project Management System
        </Title>
        <Paragraph style={{ fontSize: '18px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '40px' }}>
          A modern, real-time collaborative project management system built with Ant Design & Pro Components. 
          Manage projects and tasks with live updates and intelligent workflows.
        </Paragraph>
        
        <Space size="middle">
          {user ? (
            <>
              <Link to="/kanbanboard">
                <Button type="primary" size="large" icon={<ArrowRightOutlined />} style={{ height: '48px', padding: '0 32px' }}>
                  Go to Kanban Board
                </Button>
              </Link>
              <Link to="/actionlog">
                <Button size="large" style={{ height: '48px', padding: '0 32px' }}>
                  View Activity Logs
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register">
                <Button type="primary" size="large" icon={<UserAddOutlined />} style={{ height: '48px', padding: '0 32px' }}>
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="large" icon={<LoginOutlined />} style={{ height: '48px', padding: '0 32px' }}>
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </Space>
        
        <div style={{ marginTop: '40px' }}>
          <Tag color="green" icon={<ThunderboltOutlined />}>Live Demo Available</Tag>
        </div>
      </div>

      {/* Features Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: '80px' }}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card 
              hoverable 
              style={{ height: '100%', borderRadius: '8px' }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '8px', 
                background: `var(--ant-color-${feature.color}-1)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {feature.icon}
              </div>
              <Title level={4}>{feature.title}</Title>
              <Paragraph type="secondary">{feature.description}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Stats Section */}
      <Card style={{ borderRadius: '12px', background: 'var(--ant-color-bg-container)', marginBottom: '80px' }}>
        <Row gutter={16} textAlign="center">
          <Col span={6}>
            <Statistic title="Active Users" value={1200} prefix={<TeamOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Projects Managed" value={450} prefix={<BarChartOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Tasks Completed" value={8900} prefix={<CheckCircleOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Uptime" value={99.9} suffix="%" prefix={<ThunderboltOutlined />} />
          </Col>
        </Row>
      </Card>

      {/* CTA Footer */}
      {!user && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px', 
          background: 'var(--ant-color-primary-1)', 
          borderRadius: '12px' 
        }}>
          <Title level={2}>Ready to optimize your workflow?</Title>
          <Paragraph style={{ fontSize: '16px', marginBottom: '32px' }}>
            Join hundreds of teams managing projects more efficiently with our system.
          </Paragraph>
          <Link to="/register">
            <Button type="primary" size="large" style={{ height: '48px', padding: '0-40px' }}>
              Create Your Free Account
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
