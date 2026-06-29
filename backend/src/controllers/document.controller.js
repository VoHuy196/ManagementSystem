import { Document } from "../models/document.model.js";
import { Employee } from "../models/employees.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

// Helper to get employee department
const getUserDepartment = async (userId) => {
  const employee = await Employee.findOne({ user: userId });
  return employee ? employee.department : "";
};

// @desc    Get all documents based on department visibility
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const userRole = req.user.role; // "Admin", "Manager", "Employee"
  const filter = {};

  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (userDept) {
      filter.department = userDept;
    } else {
      filter.department = "__NONE__"; // User has no department, block all viewing
    }
  }

  const documents = await Document.find(filter)
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { documents }, "Documents fetched successfully")
  );
});

// @desc    Get document details
// @route   GET /api/documents/:id
// @access  Private
const getDocumentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const document = await Document.findById(id).populate("createdBy", "fullName email");

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check access permissions
  const userRole = req.user.role;
  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (!userDept || userDept !== document.department) {
      throw new ApiError(403, "You do not have permission to view this document");
    }
  }

  res.status(200).json(
    new ApiResponse(200, { document }, "Document details fetched successfully")
  );
});

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
const createDocument = asyncHandler(async (req, res) => {
  const { title, description, fileUrl, category, department, status } = req.body;

  if (!title || !category || !department) {
    throw new ApiError(400, "Title, category, and department are required");
  }

  // Check create permissions: non-admin can only create in their own department
  const userRole = req.user.role;
  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (!userDept || userDept !== department) {
      throw new ApiError(403, "You can only create documents for your own department");
    }
  }

  const document = await Document.create({
    title,
    description,
    fileUrl,
    category,
    department,
    status: status || "Published",
    createdBy: req.user._id,
  });

  const populated = await Document.findById(document._id).populate("createdBy", "fullName email");

  // Emit socket event for real-time notification
  const io = req.app.get("io");
  if (io) {
    io.emit("documentCreated", { document: populated });
  }

  res.status(201).json(
    new ApiResponse(201, { document: populated }, "Document created successfully")
  );
});

// @desc    Update document details
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, fileUrl, category, department, status } = req.body;

  const document = await Document.findById(id);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check write permissions
  const userRole = req.user.role;
  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (!userDept || userDept !== document.department) {
      throw new ApiError(403, "You do not have permission to edit this document");
    }
    // Loophole fix: non-admins cannot change the document's department to something they don't belong to
    if (department !== undefined && department !== userDept) {
      throw new ApiError(403, "You cannot assign this document to another department");
    }
  }

  // Update fields
  if (title !== undefined) document.title = title;
  if (description !== undefined) document.description = description;
  if (fileUrl !== undefined) document.fileUrl = fileUrl;
  if (category !== undefined) document.category = category;
  if (department !== undefined) document.department = department;
  if (status !== undefined) document.status = status;

  const updatedDoc = await document.save();
  const populated = await Document.findById(updatedDoc._id).populate("createdBy", "fullName email");

  // Emit socket event for real-time notification
  const io = req.app.get("io");
  if (io) {
    io.emit("documentUpdated", { document: populated });
  }

  res.status(200).json(
    new ApiResponse(200, { document: populated }, "Document updated successfully")
  );
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await Document.findById(id);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  // Check delete permissions: Admin or Creator in same department
  const userRole = req.user.role;
  const creatorId = document.createdBy?._id || document.createdBy;
  const isCreator = creatorId && creatorId.toString() === req.user._id.toString();
 
  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (!isCreator || !userDept || userDept !== document.department) {
      throw new ApiError(403, "Only the creator belonging to the same department or Admin can delete this document");
    }
  }

  await Document.findByIdAndDelete(id);

  // Emit socket event for real-time notification
  const io = req.app.get("io");
  if (io) {
    io.emit("documentDeleted", { documentId: id });
  }

  res.status(200).json(
    new ApiResponse(200, {}, "Document deleted successfully")
  );
});

export {
  getDocuments,
  getDocumentDetails,
  createDocument,
  updateDocument,
  deleteDocument,
};
