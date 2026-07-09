/**
 * Integration Test - AI Optimization Features
 * Run: node testOptimizations.js
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const AI_URL = "http://localhost:8000";
const BACKEND_URL = "http://localhost:3000/api";

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
};

const assert = (condition, msg) => {
  if (!condition) throw new Error(msg || "Assertion failed");
};

console.log("\n====================================");
console.log("   AI Optimization Integration Test");
console.log("====================================\n");

// ── SECTION 1: AI Service Health & Startup Cache ─────────────────────
console.log("📌 [1] AI Service - Startup Cache & Health");

await test("Health endpoint responds", async () => {
  const res = await axios.get(`${AI_URL}/`, { timeout: 5000 });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(res.data.status === "healthy", "Status should be healthy");
});

await test("Startup cache: all departments pre-computed", async () => {
  const res = await axios.get(`${AI_URL}/`, { timeout: 5000 });
  const depts = res.data.cached_departments || [];
  assert(depts.length >= 7, `Expected 7+ dept embeddings, got ${depts.length}`);
  console.log(`      Cached departments: ${depts.join(", ")}`);
});

// ── SECTION 2: Vectorize Endpoint ────────────────────────────────────
console.log("\n📌 [2] Vectorize Endpoint");

await test("Vectorize returns 384-dim vector", async () => {
  const res = await axios.post(`${AI_URL}/ai/vectorize`, { text: "Lập trình API backend Node.js" }, { timeout: 8000 });
  assert(res.data.success === true, "success should be true");
  assert(Array.isArray(res.data.vector), "vector should be an array");
  assert(res.data.vector.length === 384, `Expected 384 dims, got ${res.data.vector.length}`);
});

// ── SECTION 3: Smart Assign with Skills + Feedback ───────────────────
console.log("\n📌 [3] Smart Assign - Skills + Feedback History");

await test("Smart assign accepts skills and feedbackHistory", async () => {
  const payload = {
    task: {
      title: "Xây dựng REST API cho module báo cáo",
      description: "Viết Node.js backend, kết nối MongoDB, trả về dữ liệu JSON",
      taskType: "Feature",
      priority: "High"
    },
    employees: [
      { id: "emp1", fullName: "Nguyen Van A", department: "Engineering", pendingTasksCount: 2, skills: ["Node.js", "MongoDB", "React"] },
      { id: "emp2", fullName: "Tran Thi B",   department: "HR",          pendingTasksCount: 0, skills: ["Tuyển dụng", "Hành chính"] },
      { id: "emp3", fullName: "Le Van C",      department: "Engineering", pendingTasksCount: 5, skills: ["Python", "Docker"] },
    ],
    historicalTasks: [
      { title: "Phát triển API user management", description: "REST API Node.js", assignedTo: "emp1", status: "Done", rating: 4.5 }
    ],
    feedbackHistory: [
      { taskType: "Feature", department: "Engineering", assignedUserId: "emp1", aiSuggested: true },
      { taskType: "Feature", department: "Engineering", assignedUserId: "emp1", aiSuggested: false },
    ]
  };

  const res = await axios.post(`${AI_URL}/ai/predict-assignee`, payload, { timeout: 10000 });
  assert(res.status === 200, `Expected 200, got ${res.status}`);
  assert(Array.isArray(res.data.predictions), "predictions should be an array");
  assert(res.data.predictions.length > 0, "Should have at least 1 prediction");

  const top = res.data.predictions[0];
  console.log(`      Top pick: ${top.fullName} (confidence: ${top.confidence}%)`);
  console.log(`      Reason: ${top.reason}`);

  // Engineering employee should beat HR employee for this task
  const engPick = res.data.predictions.find(p => p.employeeId === "emp1" || p.employeeId === "emp3");
  assert(engPick, "Engineering employee should be in top suggestions");
});

// ── SECTION 4: OCR with Chunking ─────────────────────────────────────
console.log("\n📌 [4] OCR - Text Chunking");

await test("OCR endpoint returns chunks and chunkVectors", async () => {
  const longText = Array(50).fill("Đây là nội dung văn bản thử nghiệm cho hệ thống chunking.").join(" ");
  const fileBuffer = Buffer.from(longText, "utf-8");

  const form = new FormData();
  form.append("file", fileBuffer, { filename: "test.txt", contentType: "text/plain" });

  const res = await axios.post(`${AI_URL}/ai/ocr`, form, {
    headers: form.getHeaders(),
    timeout: 15000,
  });

  assert(res.data.success === true, "OCR should succeed");
  assert(Array.isArray(res.data.chunks), "chunks should be an array");
  assert(Array.isArray(res.data.chunkVectors), "chunkVectors should be an array");
  assert(res.data.chunks.length > 1, `Expected >1 chunk, got ${res.data.chunks.length}`);
  assert(res.data.chunkVectors.length === res.data.chunks.length, "Each chunk should have a vector");
  assert(Array.isArray(res.data.vector) && res.data.vector.length === 384, "Primary vector should be 384-dim");

  console.log(`      Text length: ${res.data.text.length} chars`);
  console.log(`      Chunks generated: ${res.data.chunks.length}`);
  console.log(`      Chunk vectors: ${res.data.chunkVectors.length} x 384-dim`);
});

// ── SECTION 5: DOCX Support ──────────────────────────────────────────
console.log("\n📌 [5] DOCX Support");

await test("OCR handles .docx file extension gracefully", async () => {
  // We test the path by sending a fake DOCX-named text (won't parse as real DOCX but verifies routing)
  const form = new FormData();
  const textBuf = Buffer.from("Nội dung tài liệu Word thử nghiệm", "utf-8");
  form.append("file", textBuf, {
    filename: "test.docx",
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });

  const res = await axios.post(`${AI_URL}/ai/ocr`, form, {
    headers: form.getHeaders(),
    timeout: 15000,
  });
  // Should succeed (even if text extraction fails, it returns success with fallback)
  assert(res.data.success === true, "Should succeed for docx");
  assert(typeof res.data.text === "string", "Should return text field");
  assert(Array.isArray(res.data.vector), "Should return vector field");
});

// ── SUMMARY ──────────────────────────────────────────────────────────
console.log("\n====================================");
console.log(`   Results: ${passed} passed, ${failed} failed`);
console.log("====================================\n");

if (failed > 0) process.exit(1);
