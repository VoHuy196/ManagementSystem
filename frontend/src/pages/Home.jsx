import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Project Management System
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            A modern, real-time collaborative project management system built
            with the MERN stack. Teams can manage projects and tasks together
            with live updates, drag & drop functionality, and comprehensive
            activity tracking.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <>
                <Link
                  to="/kanbanboard"
                  className="border border-blue-600 bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 hover:border-blue-700 transition-all text-lg font-medium"
                >
                  Go to Kanban Board
                </Link>
                <Link
                  to="/actionlog"
                  className="border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400 transition-all text-lg font-medium"
                >
                  View Activity Logs
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="border border-blue-600 bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 hover:border-blue-700 transition-all text-lg font-medium"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400 transition-all text-lg font-medium"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Live Demo Badge */}
          <div className="inline-flex items-center px-4 py-2 border border-green-600 rounded-full text-green-600 dark:text-green-400 text-sm font-medium mb-12">
            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live Demo Available
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Real-time Collaboration */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border border-blue-400 rounded-lg flex items-center justify-center mb-4">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Real-time Collaboration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Live task updates across all connected users via Socket.io. See
              changes instantly as your team works together.
            </p>
          </div>

          {/* Drag & Drop Interface */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border border-green-400 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Drag & Drop Interface
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Intuitive drag and drop functionality to move tasks between Todo,
              In Progress, and Done columns with visual feedback.
            </p>
          </div>

          {/* Smart Assignment */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border border-purple-400 rounded-lg flex items-center justify-center mb-4">
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Smart Assignment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Automatically assigns tasks to team members with the least
              workload using intelligent balancing algorithms.
            </p>
          </div>

          {/* Activity Tracking */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border border-yellow-400 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Activity Tracking
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Comprehensive audit trail of all task activities with real-time
              updates and user identification.
            </p>
          </div>

          {/* Priority Management */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border border-red-400 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Priority Management
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Set High, Medium, and Low priority tasks with visual color coding
              for better task organization.
            </p>
          </div>

          {/* Responsive Design */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-900">
            <div className="w-12 h-12 border border-cyan-400 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Responsive Design
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Mobile-first design that works seamlessly on all devices with
              touch support for drag & drop.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">
            Built with Modern Technology
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-2">⚛️</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">React 18</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🟢</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Node.js</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🍃</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">MongoDB</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Socket.io</p>
            </div>
          </div>
        </div>

        {/* Key Highlights */}
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-8 mb-16 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Why Choose Our Project Management System?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">
                  Real-time Synchronization
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  All connected clients receive instant updates with optimistic
                  UI responses
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">Visual Feedback</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Drag states, hover effects, and drop zone highlighting for
                  better UX
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">
                  Conflict Resolution
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Smart handling of concurrent edits with user confirmation
                  dialogs
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium mb-1">
                  User Identification
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Shows "(You)" indicators for current user's tasks and
                  activities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of teams already using our project management system
            to manage their projects efficiently.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="border border-blue-600 bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 hover:border-blue-700 transition-all text-lg font-medium"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="border border-gray-600 text-gray-300 px-8 py-3 rounded hover:text-blue-400 hover:border-blue-400 transition-all text-lg font-medium"
              >
                Sign In to Continue
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
