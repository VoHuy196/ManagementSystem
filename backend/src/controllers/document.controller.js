import axios from "axios";
import FormData from "form-data";
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

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getSnippet = (text, query) => {
  if (!text) return "";
  const cleanQuery = query.toLowerCase().trim();
  const idx = text.toLowerCase().indexOf(cleanQuery);
  if (idx !== -1) {
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + cleanQuery.length + 80);
    return (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
  }
  return text.substring(0, 150) + (text.length > 150 ? "..." : "");
};

// @desc    Get all documents based on department visibility
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
  const userRole = req.user.role; // "Admin", "Manager", "Employee"
  const { search, searchType } = req.query;
  const filter = {};

  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (userDept) {
      filter.department = userDept;
    } else {
      filter.department = "__NONE__"; // User has no department, block all viewing
    }
  }

  // Keyword search filter
  if (search && searchType !== "ai") {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { extractedText: regex }
    ];
  }

  let documents = await Document.find(filter)
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 });

  // AI Semantic search
  if (search && searchType === "ai") {
    try {
      console.log(`[AI SEARCH] Vectorizing query: "${search}"`);
      const vectorizeResponse = await axios.post("http://localhost:8000/ai/vectorize", {
        text: search
      }, { timeout: 5000 });

      if (vectorizeResponse.status === 200 && vectorizeResponse.data?.vector) {
        const queryVector = vectorizeResponse.data.vector;

        // Calculate similarity for each document
        const docsWithScores = documents.map(doc => {
          let score = 0;

          // ── Use chunk vectors if available (Priority 4 optimisation) ──
          if (doc.vectorChunks && doc.vectorChunks.length > 0) {
            // Best-chunk similarity: max over all chunks
            const chunkScores = doc.vectorChunks.map(cv => cosineSimilarity(queryVector, cv));
            score = Math.max(...chunkScores);
          } else if (doc.vectorEmbedding && doc.vectorEmbedding.length > 0) {
            score = cosineSimilarity(queryVector, doc.vectorEmbedding);
          } else {
            // Keyword fallback for documents not yet OCRed
            const textToMatch = `${doc.title} ${doc.description} ${doc.extractedText}`.toLowerCase();
            score = textToMatch.includes(search.toLowerCase()) ? 0.3 : 0.0;
          }

          return {
            ...doc.toObject(),
            similarityScore: Math.round(score * 100),
            snippet: getSnippet(doc.extractedText || doc.description || "", search)
          };
        });

        // Filter and sort by score
        documents = docsWithScores
          .filter(doc => doc.similarityScore >= 20 || (doc.title && doc.title.toLowerCase().includes(search.toLowerCase())))
          .sort((a, b) => b.similarityScore - a.similarityScore);

        return res.status(200).json(
          new ApiResponse(200, { documents }, "AI Semantic search completed successfully")
        );
      }
    } catch (error) {
      console.error("[AI SEARCH] Failed to run vector search:", error.message);
      // Fallback to keyword search
      const regex = new RegExp(search, "i");
      const fallbackDocs = documents.filter(doc =>
        regex.test(doc.title) || regex.test(doc.description) || regex.test(doc.extractedText)
      );
      return res.status(200).json(
        new ApiResponse(200, { documents: fallbackDocs, warning: "AI Offline, fallback to keyword search" }, "Keyword search fallback completed")
      );
    }
  }

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
  if (fileUrl !== undefined) {
    if (fileUrl !== document.fileUrl) {
      document.fileUrl = fileUrl;
      document.ocrStatus = "Pending";
      document.extractedText = "";
      document.vectorEmbedding = [];
    }
  }
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

// @desc  Upload a document file (multipart) and immediately queue OCR
// @route POST /api/documents/upload
// @access Private
const uploadDocumentFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded. Please send a multipart/form-data request with a 'file' field.");
  }

  const { title, description, category, department, status } = req.body;

  if (!title || !category || !department) {
    throw new ApiError(400, "title, category and department are required fields.");
  }

  const userRole = req.user.role;
  if (userRole !== "Admin") {
    const userDept = await getUserDepartment(req.user._id);
    if (userDept && userDept !== department) {
      throw new ApiError(403, "You can only upload documents to your own department.");
    }
  }

  // Store file as base64 in a temporary field so the worker can access it
  // In production you'd upload to S3/Cloudinary here and save the URL instead
  const fileBuffer = req.file.buffer;
  const originalName = req.file.originalname;
  const mimeType = req.file.mimetype;

  const document = await Document.create({
    title,
    description: description || "",
    category,
    department,
    status: status || "Published",
    createdBy: req.user._id,
    ocrStatus: "Pending",
    // Store as data URI so worker can process without re-downloading
    fileUrl: `data:${mimeType};name=${encodeURIComponent(originalName)};base64,${fileBuffer.toString("base64")}`,
  });

  const io = req.app.get("io");
  if (io) io.emit("documentCreated", { document });

  res.status(201).json(
    new ApiResponse(201, { document }, "Document uploaded successfully. AI OCR queued.")
  );
});

export {
  getDocuments,
  getDocumentDetails,
  createDocument,
  uploadDocumentFile,
  updateDocument,
  deleteDocument,
};
