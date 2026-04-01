import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { getProjects } from "../services/projectApi.js";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
const [activeIndex, setActiveIndex] = useState(null);
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      setProjects(response.data.data.projects || []);
    } catch {
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const archived = projects.filter((p) => p.status === "archived").length;
    const owned = projects.filter((p) => p.owner?._id === user?._id).length;
    const member = projects.filter(
      (p) =>
        p.members?.some((m) => m._id === user?._id) &&
        p.owner?._id !== user?._id
    ).length;

    return { total, active, completed, archived, owned, member };
  };

  const getRecentProjects = () => {
    return projects
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      )
      .slice(0, 5);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-900 text-green-200 border-green-700";
      case "completed":
        return "bg-blue-900 text-blue-200 border-blue-700";
      case "archived":
        return "bg-gray-700 text-gray-300 border-gray-600";
      default:
        return "bg-gray-700 text-gray-300 border-gray-600";
    }
  };

  const stats = getProjectStats();
  const recentProjects = getRecentProjects();

  const pieData = [
    { name: 'Active', value: stats.active },
    { name: 'Completed', value: stats.completed },
    { name: 'Archived', value: stats.archived },
  ];

  const ownershipData = [
    { name: 'Owned', value: stats.owned },
    { name: 'Member', value: stats.member },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-gray-900 via-black to-gray-900 border border-gray-700 rounded-xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Manage and track your collaborative projects
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-300 font-medium">Welcome back,</p>
            <p className="text-blue-400 font-semibold text-lg">
              {user?.fullName}!
            </p>
          </div>
        </div>
      </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    <div className="group bg-black border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
          {stats.total}
        </div>
        <svg
          className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <div className="text-sm text-gray-400">Total Projects</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: "100%" }}
        ></div>
      </div>
    </div>

    <div className="group bg-black border border-gray-700 rounded-lg p-4 hover:border-green-600 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-green-400 group-hover:scale-105 transition-transform">
          {stats.active}
        </div>
        <svg
          className="w-6 h-6 text-gray-500 group-hover:text-green-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div className="text-sm text-gray-400">Active</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
        <div
          className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
          style={{
            width:
              stats.total > 0
                ? `${(stats.active / stats.total) * 100}%`
                : "0%",
          }}
        ></div>
      </div>
    </div>

    <div className="group bg-black border border-gray-700 rounded-lg p-4 hover:border-blue-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-blue-400 group-hover:scale-105 transition-transform">
          {stats.completed}
        </div>
        <svg
          className="w-6 h-6 text-gray-500 group-hover:text-blue-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="text-sm text-gray-400">Completed</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{
            width:
              stats.total > 0
                ? `${(stats.completed / stats.total) * 100}%`
                : "0%",
          }}
        ></div>
      </div>
    </div>

    <div className="group bg-black border border-gray-700 rounded-lg p-4 hover:border-gray-500 transition-all duration-200 hover:shadow-lg hover:shadow-gray-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-gray-400 group-hover:scale-105 transition-transform">
          {stats.archived}
        </div>
        <svg
          className="w-6 h-6 text-gray-500 group-hover:text-gray-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8l6 6m0 0l6-6m-6 6V2"
          />
        </svg>
      </div>
      <div className="text-sm text-gray-400">Archived</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
        <div
          className="bg-gray-600 h-1.5 rounded-full transition-all duration-300"
          style={{
            width:
              stats.total > 0
                ? `${(stats.archived / stats.total) * 100}%`
                : "0%",
          }}
        ></div>
      </div>
    </div>

    <div className="group bg-black border border-gray-700 rounded-lg p-4 hover:border-purple-600 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-purple-400 group-hover:scale-105 transition-transform">
          {stats.owned}
        </div>
        <svg
          className="w-6 h-6 text-gray-500 group-hover:text-purple-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <div className="text-sm text-gray-400">Owned</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
        <div
          className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
          style={{
            width:
              stats.total > 0
                ? `${(stats.owned / stats.total) * 100}%`
                : "0%",
          }}
        ></div>
      </div>
    </div>

    <div className="group bg-black border border-gray-700 rounded-lg p-4 hover:border-yellow-600 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10">
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl font-bold text-yellow-400 group-hover:scale-105 transition-transform">
          {stats.member}
        </div>
        <svg
          className="w-6 h-6 text-gray-500 group-hover:text-yellow-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <div className="text-sm text-gray-400">Member</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3">
        <div
          className="bg-yellow-600 h-1.5 rounded-full transition-all duration-300"
          style={{
            width:
              stats.total > 0
                ? `${(stats.member / stats.total) * 100}%`
                : "0%",
          }}
        ></div>
      </div>
    </div>
  </div>

  {/* Charts Section */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
    <div className="bg-black border border-gray-700 rounded-xl p-8">
      <h3 className="text-xl font-semibold text-white mb-6">Project Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            paddingAngle={2}
            activeIndex={activeIndex}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            // isAnimationActive={false}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-black border border-gray-700 rounded-xl p-8">
      <h3 className="text-xl font-semibold text-white mb-6">Projects Ownership</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={ownershipData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            nameKey="name"
           
          >
            {ownershipData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip /> 
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>

      {/* Recent Projects */}
      <div className="bg-black border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-white">
              Recent Projects
            </h2>
          </div>
          <span className="text-sm text-gray-500">Last 5 projects</span>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
            <svg
              className="mx-auto h-16 w-16 text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Create your first project to start collaborating with your team
              and organizing your tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project, index) => (
              <div
                key={project._id}
                className="group p-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-gray-600 hover:bg-gray-900 transition-all duration-200 hover:shadow-lg hover:shadow-white/5"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.5s ease-out forwards",
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500 group-hover:bg-blue-400 transition-colors"></div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status?.charAt(0).toUpperCase() +
                          project.status?.slice(1)}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2 group-hover:text-gray-300 transition-colors">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-6 text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>{project.owner?.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>{project.members?.length || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {formatDate(project.updatedAt || project.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-blue-400 hover:border-blue-600 transition-all opacity-0 group-hover:opacity-100">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-black border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-200">
        <div className="flex items-center gap-3 mb-6">
          <svg
            className="w-6 h-6 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="group flex items-center gap-4 p-5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg hover:border-blue-600 hover:from-blue-900/20 hover:to-gray-800 transition-all duration-200 text-left hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <svg
                className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                Create New Project
              </div>
              <div className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
                Start a new collaborative project
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          <button className="group flex items-center gap-4 p-5 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg hover:border-green-600 hover:from-green-900/20 hover:to-gray-800 transition-all duration-200 text-left hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex-shrink-0 w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
              <svg
                className="w-6 h-6 text-green-400 group-hover:text-green-300 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:text-green-300 transition-colors">
                View All Tasks
              </div>
              <div className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
                Manage your tasks across projects
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
