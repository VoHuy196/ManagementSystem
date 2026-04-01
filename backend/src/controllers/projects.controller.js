import { Project } from "../models/projects.model.js";
import { Task } from "../models/tasks.model.js";
import { ActionLog } from "../models/actionLog.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const createProject = asyncHandler(async (req, res) => {
  const { name, description, members, startDate, endDate, department, budget } = req.body;

  if (!name) {
    throw new ApiError(400, "Project name is required");
  }

  const existingProject = await Project.findOne({ name });

  if (existingProject) {
    throw new ApiError(400, "Project with this name already exists");
  }

  const owner = req.user._id;

  if (!owner) {
    throw new ApiError(400, "User not authenticated");
  }

  const project = await Project.create({
    name,
    description,
    owner,
    members: members || [],
    startDate,
    endDate,
    department,
    budget,
  });

  if (!project) {
    throw new ApiError(500, "Something went wrong while creating project");
  }

  const createdProject = await Project.findById(project._id)
    .populate("owner", "fullName email")
    .populate("members", "fullName email");

  if (!createdProject) {
    throw new ApiError(
      500,
      "Something went wrong while fetching created project"
    );
  }

  const actionLog = await ActionLog.create({
    action: "Project Created",
    user: owner,
    project: project._id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for project creation");
  }

  // Emit socket event for real-time update
  const io = req.app.get('io');
  if (io) {
    io.emit('projectCreated', { project: createdProject });
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { project: createdProject },
        "Project created successfully"
      )
    );
});

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User not authenticated");
  }

  const projects = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  })
    .populate("owner", "fullName email")
    .populate("members", "fullName email");

  if (!projects || projects.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { projects: [] }, "No projects found"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, { projects }, "Projects fetched successfully"));
});

const assignTaskToProject = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.body;

  if (!taskId || !projectId) {
    throw new ApiError(400, "Task ID and Project ID are required");
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to assign task to project
  const userId = req.user._id;
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(
    (member) => member.toString() === userId.toString()
  );

  if (!isOwner && !isMember) {
    throw new ApiError(
      403,
      "You don't have permission to assign tasks to this project"
    );
  }

  task.project = projectId;

  const updatedTask = await task.save();

  if (!updatedTask) {
    throw new ApiError(
      500,
      "Something went wrong while assigning task to project"
    );
  }

  const populatedTask = await Task.findById(taskId)
    .populate("assignedTo", "fullName")
    .populate("createdBy", "fullName")
    .populate("project", "name");

  const actionLog = await ActionLog.create({
    action: "Task Assigned to Project",
    user: userId,
    task: taskId,
    project: projectId,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for task assignment");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { task: populatedTask },
        "Task assigned to project successfully"
      )
    );
});

const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status, members, startDate, endDate, department, budget } = req.body;

  if (!id) {
    throw new ApiError(400, "Project ID is required");
  }

  if (!name && !description && !status && !members) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to update project
  const userId = req.user._id;
  const isOwner = project.owner.toString() === userId.toString();

  if (!isOwner) {
    throw new ApiError(403, "Only project owner can update the project");
  }

  if (name) {
    const existingProject = await Project.findOne({ name, _id: { $ne: id } });
    if (existingProject) {
      throw new ApiError(400, "Project with this name already exists");
    }
    project.name = name;
  }

  if (description !== undefined) {
    project.description = description;
  }

  if (status) {
    const validStatuses = ["active", "completed", "archived"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }
    project.status = status;
  }

  if (members) {
    project.members = members;
  }

  if (startDate !== undefined) {
    project.startDate = startDate;
  }
  if (endDate !== undefined) {
    project.endDate = endDate;
  }
  if (department !== undefined) {
    project.department = department;
  }
  if (budget !== undefined) {
    if (budget < 0) {
      throw new ApiError(400, "Budget cannot be negative");
    }
    project.budget = budget;
  }

  const updatedProject = await project.save();

  if (!updatedProject) {
    throw new ApiError(500, "Something went wrong while updating project");
  }

  const populatedProject = await Project.findById(id)
    .populate("owner", "fullName email")
    .populate("members", "fullName email");

  const actionLog = await ActionLog.create({
    action: "Project Updated",
    user: userId,
    project: id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for project update");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { project: populatedProject },
        "Project updated successfully"
      )
    );
});

const getProjectTasks = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Project ID is required");
  }

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to view project tasks
  const userId = req.user._id;
  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(
    (member) => member.toString() === userId.toString()
  );

  if (!isOwner && !isMember) {
    throw new ApiError(
      403,
      "You don't have permission to view this project's tasks"
    );
  }

  const tasks = await Task.find({ project: id })
    .populate("assignedTo", "fullName email")
    .populate("createdBy", "fullName email")
    .populate("project", "name");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tasks, project: { _id: project._id, name: project.name } },
        "Project tasks fetched successfully"
      )
    );
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;

  if (!id || !memberId) {
    throw new ApiError(400, "Project ID and Member ID are required");
  }

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to add members
  const userId = req.user._id;
  const isOwner = project.owner.toString() === userId.toString();

  if (!isOwner) {
    throw new ApiError(403, "Only project owner can add members");
  }

  // Check if member is already in the project
  if (project.members.includes(memberId)) {
    throw new ApiError(400, "User is already a member of this project");
  }

  project.members.push(memberId);

  const updatedProject = await project.save();

  if (!updatedProject) {
    throw new ApiError(
      500,
      "Something went wrong while adding member to project"
    );
  }

  const populatedProject = await Project.findById(id)
    .populate("owner", "fullName email")
    .populate("members", "fullName email");

  const actionLog = await ActionLog.create({
    action: "Member Added to Project",
    user: userId,
    project: id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for member addition");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { project: populatedProject },
        "Member added to project successfully"
      )
    );
});

const removeMemberFromProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.body;

  if (!id || !memberId) {
    throw new ApiError(400, "Project ID and Member ID are required");
  }

  const project = await Project.findById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Check if user has permission to remove members
  const userId = req.user._id;
  const isOwner = project.owner.toString() === userId.toString();

  if (!isOwner) {
    throw new ApiError(403, "Only project owner can remove members");
  }

  // Check if member is in the project
  if (!project.members.includes(memberId)) {
    throw new ApiError(400, "User is not a member of this project");
  }

  project.members = project.members.filter(
    (member) => member.toString() !== memberId
  );

  const updatedProject = await project.save();

  if (!updatedProject) {
    throw new ApiError(
      500,
      "Something went wrong while removing member from project"
    );
  }

  const populatedProject = await Project.findById(id)
    .populate("owner", "fullName email")
    .populate("members", "fullName email");

  const actionLog = await ActionLog.create({
    action: "Member Removed from Project",
    user: userId,
    project: id,
  });

  if (!actionLog) {
    throw new ApiError(500, "Failed to create action log for member removal");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { project: populatedProject },
        "Member removed from project successfully"
      )
    );
});

export {
  createProject,
  getProjects,
  assignTaskToProject,
  updateProject,
  getProjectTasks,
  addMemberToProject,
  removeMemberFromProject,
};
