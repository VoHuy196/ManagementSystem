import React, { useState } from "react";
import {
  ProjectsList,
  OnlineUsers,
  ProjectTasks,
  ProjectDashboard,
} from "../components";
import ProjectModal from "../modal/ProjectModal.jsx";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";

const Projects = () => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket(() => {}, user);
  const [showProjectModal, setShowProjectModal] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Section */}
        <div className="mb-8">
          <ProjectDashboard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Projects Content */}
          <div className="lg:col-span-3">
            <ProjectsList onCreateClick={() => setShowProjectModal(true)} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <OnlineUsers onlineUsers={onlineUsers} />
            </div>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal project={{}} onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  );
};

export default Projects;
