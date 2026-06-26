import React, { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Space, Typography, Avatar, Dropdown } from "antd";
import {
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TrophyOutlined,
  DashboardOutlined,
  ScheduleOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useAuth } from "./context/AuthContext";
import ThemeToggle from "./components/ThemeToggle";

const { Header, Content, Sider, Footer } = Layout;
const { Text, Title } = Typography;

const MIN_SIDER_WIDTH = 60;
const MAX_SIDER_WIDTH = 240;
const DEFAULT_SIDER_WIDTH = 200;
const COLLAPSED_WIDTH = 80;

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Load width from localStorage or use default
  const [siderWidth, setSiderWidth] = useState(() => {
    const saved = localStorage.getItem("siderWidth");
    return saved ? parseInt(saved, 10) : DEFAULT_SIDER_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const siderRef = useRef(null);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= MIN_SIDER_WIDTH && newWidth <= MAX_SIDER_WIDTH) {
          setSiderWidth(newWidth);
          localStorage.setItem("siderWidth", newWidth.toString());
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const menuItems = [
    {
      key: "/kanbanboard",
      icon: <AppstoreOutlined />,
      label: <Link to="/kanbanboard">Kanban Board</Link>,
    },
    {
      key: "/projects",
      icon: <ProjectOutlined />,
      label: <Link to="/projects">Projects</Link>,
    },
    {
      key: "/employees",
      icon: <TeamOutlined />,
      label: <Link to="/employees">Employees</Link>,
    },
    {
      key: "/worklogs",
      icon: <ClockCircleOutlined />,
      label: <Link to="/worklogs">Worklogs</Link>,
    },
    {
      key: "/attendance",
      icon: <CalendarOutlined />,
      label: <Link to="/attendance">Attendance</Link>,
    },
    {
      key: "/leaves",
      icon: <FileTextOutlined />,
      label: <Link to="/leaves">Leave Requests</Link>,
    },
    {
      key: "/performance",
      icon: <TrophyOutlined />,
      label: <Link to="/performance">Performance</Link>,
    },
    {
      key: "/reports",
      icon: <BarChartOutlined />,
      label: <Link to="/reports">Reports</Link>,
    },
    {
      key: "/workload",
      icon: <DashboardOutlined />,
      label: <Link to="/workload">Workload Analytics</Link>,
    },
    {
      key: "/work-shifts",
      icon: <ScheduleOutlined />,
      label: <Link to="/work-shifts">Quản lý ca</Link>,
    },
    {
      key: "/documents",
      icon: <FolderOpenOutlined />,
      label: <Link to="/documents">Quản lý văn bản</Link>,
    },
    {
      key: "/actionlog",
      icon: <HistoryOutlined />,
      label: <Link to="/actionlog">Action Logs</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: <Link to="/logout">Logout</Link>,
    },
  ];

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : siderWidth;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        ref={siderRef}
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={siderWidth}
        collapsedWidth={COLLAPSED_WIDTH}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
        theme="dark"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: isResizing ? "none" : "all 0.2s",
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <Title level={4} style={{ color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {collapsed ? "PMS" : "Project Management"}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
        
        {/* Resize Handle */}
        {!collapsed && (
          <div
            onMouseDown={startResizing}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "4px",
              height: "100%",
              cursor: "col-resize",
              zIndex: 101,
              backgroundColor: isResizing ? "var(--ant-color-primary)" : "transparent",
              transition: "background-color 0.2s",
            }}
            className="hover:bg-blue-500"
          />
        )}
      </Sider>
      
      <Layout style={{ 
        marginLeft: effectiveWidth, 
        transition: isResizing ? "none" : "all 0.2s",
        minHeight: "100vh"
      }}>
        <Header
          style={{
            padding: "0 24px",
            background: "var(--ant-color-bg-container)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: "16px", width: 64, height: 64 }}
          />
          
          <Space size="large">
            <ThemeToggle />
            {user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Text>{user?.data?.user?.fullName}</Text>
                  <Avatar icon={<UserOutlined />} />
                </Space>
              </Dropdown>
            ) : (
              <Space>
                <Link to="/login">
                  <Button type="primary">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </Space>
            )}
          </Space>
        </Header>
        
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "var(--ant-color-bg-container)",
            borderRadius: "8px",
          }}
        >
          <Outlet />
        </Content>
        
        <Footer style={{ textAlign: "center" }}>
          Project Management System ©{new Date().getFullYear()} Created by Gemini CLI
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
