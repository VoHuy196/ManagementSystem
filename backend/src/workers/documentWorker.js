import axios from "axios";
import FormData from "form-data";
import { Document } from "../models/document.model.js";

const AI_SERVICE_URL = "http://localhost:8000/ai/ocr";
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [30_000, 120_000, 600_000]; // 30s → 2min → 10min

let isRunning = false;
let ioInstance = null;

// ─────────────────────────────────────────────────────────────────
// Start the worker polling loop
// ─────────────────────────────────────────────────────────────────
export const startDocumentWorker = (app) => {
  ioInstance = app.get("io");
  console.log("🚀 [WORKER] Document OCR & Vectorization worker started.");

  // Main loop: poll every 10 s
  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await processPendingDocuments();
      await retryFailedDocuments();
    } catch (error) {
      console.error("[WORKER] Error in polling loop:", error.message);
    } finally {
      isRunning = false;
    }
  }, 10_000);
};

// ─────────────────────────────────────────────────────────────────
// Process one Pending document per tick
// ─────────────────────────────────────────────────────────────────
const processPendingDocuments = async () => {
  const doc = await Document.findOneAndUpdate(
    { ocrStatus: "Pending" },
    { ocrStatus: "Processing" },
    { new: true }
  );
  if (!doc) return;

  console.log(`[WORKER] Processing "${doc.title}" (${doc._id})...`);
  await processDocument(doc);
};

// ─────────────────────────────────────────────────────────────────
// Retry Failed documents after their backoff delay
// ─────────────────────────────────────────────────────────────────
const retryFailedDocuments = async () => {
  const now = Date.now();
  const failedDocs = await Document.find({
    ocrStatus: "Failed",
    retryCount: { $lt: MAX_RETRIES },
  });

  for (const doc of failedDocs) {
    const retryIndex = doc.retryCount;            // 0-based
    const delayMs = RETRY_DELAYS_MS[retryIndex] ?? RETRY_DELAYS_MS.at(-1);
    const lastUpdate = new Date(doc.updatedAt).getTime();

    if (now - lastUpdate >= delayMs) {
      console.log(`[WORKER] Retrying "${doc.title}" (attempt ${retryIndex + 1}/${MAX_RETRIES})...`);
      // Move back to Processing
      doc.ocrStatus = "Processing";
      await doc.save();
      await processDocument(doc);
    }
  }
};

// ─────────────────────────────────────────────────────────────────
// Core processing function
// ─────────────────────────────────────────────────────────────────
const processDocument = async (doc) => {
  try {
    let fileBuffer;
    let filename = "document.txt";
    let contentType = "text/plain";

    const fileUrl = doc.fileUrl || "";

    // ── Case 1: data URI (from direct file upload) ──────────────────
    if (fileUrl.startsWith("data:")) {
      const matches = fileUrl.match(/^data:([^;]+);(?:name=([^;]+);)?base64,(.+)$/s);
      if (matches) {
        contentType = matches[1];
        filename = decodeURIComponent(matches[2] || "document");
        fileBuffer = Buffer.from(matches[3], "base64");
      }
    }

    // ── Case 2: HTTP URL ─────────────────────────────────────────────
    else if (fileUrl.startsWith("http")) {
      console.log(`[WORKER] Downloading: ${fileUrl}`);
      try {
        const response = await axios.get(fileUrl, {
          responseType: "arraybuffer",
          timeout: 10_000,
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        fileBuffer = Buffer.from(response.data);
        const ct = response.headers["content-type"] || "";
        if (ct.includes("pdf")) {
          contentType = "application/pdf";
          filename = "document.pdf";
        } else if (ct.includes("wordprocessingml") || ct.includes("docx")) {
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          filename = "document.docx";
        }
      } catch (err) {
        console.warn(`[WORKER] Download failed: ${err.message}`);
      }
    }

    // ── Fallback: use title + description as plain text ──────────────
    if (!fileBuffer) {
      fileBuffer = Buffer.from(`${doc.title}\n${doc.description || ""}`, "utf-8");
      filename = "document.txt";
      contentType = "text/plain";
    }

    // Ensure filename has correct extension
    if (contentType === "application/pdf" && !filename.endsWith(".pdf")) {
      filename += ".pdf";
    }

    // ── Send to FastAPI ────────────────────────────────────────────
    const form = new FormData();
    form.append("file", fileBuffer, { filename, contentType });

    const aiResponse = await axios.post(AI_SERVICE_URL, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 45_000,
    });

    if (aiResponse.status === 200 && aiResponse.data.success) {
      const { text, vector, chunkVectors } = aiResponse.data;

      // Use $set to avoid version conflict issues
      await Document.findByIdAndUpdate(doc._id, {
        $set: {
          extractedText: text || "",
          vectorEmbedding: vector || [],
          vectorChunks: chunkVectors || [],
          ocrStatus: "Completed",
          retryCount: 0,
        }
      });

      console.log(`[WORKER] ✅ Completed "${doc.title}". Chunks: ${(chunkVectors || []).length}`);

      if (ioInstance) {
        ioInstance.emit("documentOcrFinished", {
          documentId: doc._id,
          ocrStatus: "Completed",
          title: doc.title,
        });
      }
    } else {
      throw new Error("FastAPI returned non-success response");
    }

  } catch (error) {
    const newRetryCount = (doc.retryCount || 0) + 1;
    const finallyFailed = newRetryCount >= MAX_RETRIES;

    console.error(
      `[WORKER] ❌ Failed "${doc.title}" (retry ${newRetryCount}/${MAX_RETRIES}): ${error.message}`
    );

    await Document.findByIdAndUpdate(doc._id, {
      $set: {
        ocrStatus: finallyFailed ? "Failed" : "Failed",
        retryCount: newRetryCount,
      }
    });

    if (ioInstance && finallyFailed) {
      ioInstance.emit("documentOcrFinished", {
        documentId: doc._id,
        ocrStatus: "Failed",
        title: doc.title,
      });
    }
  }
};
