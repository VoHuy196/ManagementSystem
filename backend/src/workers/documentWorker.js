import axios from "axios";
import FormData from "form-data";
import { Document } from "../models/document.model.js";

const AI_SERVICE_URL = "http://localhost:8000/ai/ocr";
let isRunning = false;
let ioInstance = null;

// Start the worker polling loop
export const startDocumentWorker = (app) => {
  ioInstance = app.get("io");
  console.log("🚀 [WORKER] Document OCR & Vectorization worker started.");
  
  // Poll every 10 seconds
  setInterval(async () => {
    if (isRunning) return; // Prevent concurrent loops
    isRunning = true;
    try {
      await processPendingDocuments();
    } catch (error) {
      console.error("[WORKER] Error in polling loop:", error.message);
    } finally {
      isRunning = false;
    }
  }, 10000);
};

const processPendingDocuments = async () => {
  // Find one pending document, mark it as Processing atomically
  const doc = await Document.findOneAndUpdate(
    { ocrStatus: "Pending" },
    { ocrStatus: "Processing" },
    { new: true }
  );

  if (!doc) return; // No pending docs

  console.log(`[WORKER] Found pending document: "${doc.title}" (${doc._id}). Processing...`);

  try {
    let fileBuffer;
    let filename = "document.txt";
    let contentType = "text/plain";

    // 1. Download file if fileUrl exists
    if (doc.fileUrl && doc.fileUrl.startsWith("http")) {
      console.log(`[WORKER] Downloading file from URL: ${doc.fileUrl}`);
      try {
        const response = await axios.get(doc.fileUrl, {
          responseType: "arraybuffer",
          timeout: 8000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
        fileBuffer = response.data;
        
        // Extract filename from URL
        const urlParts = doc.fileUrl.split("/");
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart.includes(".")) {
          filename = lastPart.split("?")[0];
        }
        
        const contentTypeHeader = response.headers["content-type"] || "";
        if (contentTypeHeader.includes("pdf")) {
          contentType = "application/pdf";
          if (!filename.endsWith(".pdf")) filename += ".pdf";
        }
      } catch (err) {
        console.warn(`[WORKER] Failed to download file from URL, using default content: ${err.message}`);
      }
    }

    // If download failed or no URL, use fallback dummy text
    if (!fileBuffer) {
      fileBuffer = Buffer.from(`Tài liệu: ${doc.title}\nMô tả: ${doc.description || ""}`);
    }

    // 2. Prepare multipart form upload for FastAPI
    const form = new FormData();
    form.append("file", fileBuffer, {
      filename,
      contentType
    });

    console.log(`[WORKER] Sending file to FastAPI AI service...`);
    const aiResponse = await axios.post(AI_SERVICE_URL, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000 // Allow up to 30s for OCR models
    });

    if (aiResponse.status === 200 && aiResponse.data.success) {
      const { text, vector } = aiResponse.data;
      doc.extractedText = text || "";
      doc.vectorEmbedding = vector || [];
      doc.ocrStatus = "Completed";
      await doc.save();
      console.log(`[WORKER] Finished processing document "${doc.title}". Status: Completed.`);

      // Emit real-time notification
      if (ioInstance) {
        ioInstance.emit("documentOcrFinished", {
          documentId: doc._id,
          ocrStatus: "Completed",
          title: doc.title
        });
      }
    } else {
      throw new Error("FastAPI returned unsuccessful response");
    }

  } catch (error) {
    console.error(`[WORKER] Failed to process document "${doc.title}":`, error.message);
    doc.ocrStatus = "Failed";
    await doc.save();

    if (ioInstance) {
      ioInstance.emit("documentOcrFinished", {
        documentId: doc._id,
        ocrStatus: "Failed",
        title: doc.title
      });
    }
  }
};
