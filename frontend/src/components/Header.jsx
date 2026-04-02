import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="border-b shadow-sm dark:border-gray-700 bg-white dark:bg-gray-950 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-all dark:text-gray-100"
            >
              Project Management System
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link
              to="/kanbanboard"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-all dark:text-gray-300"
            >
              Kanban Board
            </Link>
            <Link to="/projects" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all dark:text-gray-300">
              Projects
            </Link>
            <Link to="/employees" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all dark:text-gray-300">
              Employees
            </Link>
            <Link to="/worklogs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all dark:text-gray-300">
              Worklogs
            </Link>
            <Link
              to="/actionlog"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-all dark:text-gray-300"
            >
              Action Logs
            </Link>
          </nav>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm dark:text-gray-300">
                  Welcome, {user?.data?.user?.fullName}
                </span>
                <Link
                  className="border px-3 py-2 rounded hover:text-blue-600 hover:border-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all"
                  to="/logout"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="border px-3 py-2 rounded hover:text-blue-600 hover:border-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all"
                  to="/register"
                >
                  Register
                </Link>
                <Link
                  className="border px-3 py-2 rounded hover:text-blue-600 hover:border-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all"
                  to="/login"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMenu}
              className="p-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && (
                <>
                  <div className="px-3 py-2 text-sm font-medium dark:text-gray-300">
                    Welcome, {user?.data?.user?.fullName}
                  </div>
                  <Link
                    to="/kanbanboard"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kanban Board
                  </Link>
                  <Link
                    to="/projects"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    to="/employees"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Employees
                  </Link>
                  <Link
                    to="/worklogs"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Worklogs
                  </Link>
                  <Link
                    to="/actionlog"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Action Logs
                  </Link>
                  <Link
                    to="/logout"
                    className="block px-3 py-2 border rounded hover:text-blue-600 hover:border-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Logout
                  </Link>
                </>
              )}
              {!user && (
                <>
                  <Link
                    to="/kanbanboard"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kanban Board
                  </Link>
                  <Link
                    to="/projects"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    to="/employees"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Employees
                  </Link>
                  <Link
                    to="/worklogs"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Worklogs
                  </Link>
                  <Link
                    to="/actionlog"
                    className="block px-3 py-2 rounded hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Action Logs
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 border rounded hover:text-blue-600 hover:border-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                  <Link
                    to="/login"
                    className="block px-3 py-2 border rounded hover:text-blue-600 hover:border-blue-600 dark:border-gray-600 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:border-blue-400 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
