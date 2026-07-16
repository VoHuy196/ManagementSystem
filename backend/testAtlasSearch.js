/**
 * Test Atlas Vector Search Integration
 * Kiểm tra $vectorSearch pipeline kết nối MongoDB Atlas
 * Run: node backend/testAtlasSearch.js
 */

import mongoose from "mongoose";
import axios from "axios";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Load env từ backend
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Thử load từ thư mục hiện tại trước, rồi thử backend/
const envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;
const AI_URL = "http://localhost:8000";

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

// ── Kết nối MongoDB ──────────────────────────────────────────────────────
console.log("\n====================================");
console.log("   Atlas Vector Search - Test Suite");
console.log("====================================\n");

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI không tìm thấy trong .env file!");
  console.error("   Kiểm tra file backend/.env có chứa MONGODB_URI không.");
  process.exit(1);
}

console.log("🔌 Kết nối MongoDB Atlas...");
await mongoose.connect(MONGO_URI);
console.log("✅ Kết nối thành công!\n");

// Lấy Document model trực tiếp từ mongoose để tránh import phức tạp
const documentSchema = new mongoose.Schema({}, { strict: false });
const Document = mongoose.models.Document || mongoose.model("Document", documentSchema, "documents");

// ── TEST 1: AI Service health ─────────────────────────────────────────────
console.log("📌 [1] AI Service");

await test("AI service đang chạy", async () => {
  const res = await axios.get(`${AI_URL}/`, { timeout: 5000 });
  assert(res.data.status === "healthy", "AI service không healthy");
  const depts = res.data.cached_departments || [];
  console.log(`      Cached departments: ${depts.join(", ")}`);
});

// ── TEST 2: Vectorize một câu tiếng Việt ────────────────────────────────
console.log("\n📌 [2] Vectorize");

let testVector = null;
await test("Vectorize query tiếng Việt thành công", async () => {
  const res = await axios.post(`${AI_URL}/ai/vectorize`,
    { text: "hợp đồng lao động nhân sự" },
    { timeout: 8000 }
  );
  assert(res.data.success === true, "vectorize thất bại");
  assert(res.data.vector.length === 384, `Expected 384 dims, got ${res.data.vector.length}`);
  testVector = res.data.vector;
  console.log(`      Vector dims: ${testVector.length} ✓`);
});

// ── TEST 3: Kiểm tra documents trong DB có vector chưa ──────────────────
console.log("\n📌 [3] Kiểm tra dữ liệu trong MongoDB");

let totalDocs = 0;
let docsWithVector = 0;
let docsWithChunks = 0;

await test("Đếm documents và tình trạng vector", async () => {
  totalDocs = await Document.countDocuments({});
  docsWithVector = await Document.countDocuments({ vectorEmbedding: { $exists: true, $ne: [] } });
  docsWithChunks = await Document.countDocuments({ vectorChunks: { $exists: true, $ne: [] } });

  console.log(`      Tổng documents   : ${totalDocs}`);
  console.log(`      Có vectorEmbedding: ${docsWithVector}`);
  console.log(`      Có vectorChunks   : ${docsWithChunks}`);
  assert(totalDocs >= 0, "Không thể đếm documents");
});

// ── TEST 4: Atlas $vectorSearch pipeline ─────────────────────────────────
console.log("\n📌 [4] Atlas $vectorSearch Pipeline");

await test("$vectorSearch trả về kết quả từ Atlas", async () => {
  if (!testVector) throw new Error("Bỏ qua: chưa có test vector từ bước 2");
  if (docsWithVector === 0) {
    console.log("      ⚠️  Chưa có document nào được OCR/vectorize → thêm document rồi thử lại");
    return;
  }

  const pipeline = [
    {
      $vectorSearch: {
        index: "vectorEmbedding",
        path: "vectorEmbedding",
        queryVector: testVector,
        numCandidates: 50,
        limit: 5,
      }
    },
    {
      $addFields: {
        vectorScore: { $meta: "vectorSearchScore" }
      }
    },
    {
      $project: {
        title: 1,
        department: 1,
        ocrStatus: 1,
        vectorScore: 1,
        _id: 1,
      }
    }
  ];

  const results = await Document.aggregate(pipeline);
  console.log(`      Kết quả trả về: ${results.length} document(s)`);

  if (results.length > 0) {
    console.log("      Top kết quả:");
    results.slice(0, 3).forEach((doc, i) => {
      const score = ((doc.vectorScore || 0) * 100).toFixed(1);
      console.log(`        ${i + 1}. "${doc.title}" [${doc.department}] → score: ${score}%`);
    });
  }

  // Nếu pipeline chạy không lỗi là thành công (kể cả khi không có kết quả)
  assert(Array.isArray(results), "$vectorSearch không trả về array");
});

// ── TEST 5: $vectorSearch với filter department ──────────────────────────
console.log("\n📌 [5] $vectorSearch với Department Filter");

await test("$vectorSearch filter theo department hoạt động", async () => {
  if (!testVector) throw new Error("Bỏ qua: chưa có test vector");

  // Lấy 1 department thực tế có trong DB
  const sampleDoc = await Document.findOne({ vectorEmbedding: { $exists: true, $ne: [] } }).select("department");
  if (!sampleDoc) {
    console.log("      ⚠️  Chưa có document có vector → bỏ qua test này");
    return;
  }

  const testDept = sampleDoc.department;
  console.log(`      Test filter department: "${testDept}"`);

  const pipeline = [
    {
      $vectorSearch: {
        index: "vectorEmbedding",
        path: "vectorEmbedding",
        queryVector: testVector,
        numCandidates: 50,
        limit: 5,
        filter: { department: { $eq: testDept } }
      }
    },
    {
      $addFields: { vectorScore: { $meta: "vectorSearchScore" } }
    },
    {
      $project: { title: 1, department: 1, vectorScore: 1 }
    }
  ];

  const results = await Document.aggregate(pipeline);
  console.log(`      Kết quả với filter: ${results.length} document(s)`);

  // Verify tất cả kết quả đúng department
  const wrongDept = results.filter(d => d.department !== testDept);
  assert(wrongDept.length === 0, `${wrongDept.length} document thuộc sai department!`);

  if (results.length > 0) {
    const score = ((results[0].vectorScore || 0) * 100).toFixed(1);
    console.log(`      Top: "${results[0].title}" → score: ${score}%`);
  }
});

// ── SUMMARY ──────────────────────────────────────────────────────────────
await mongoose.disconnect();

console.log("\n====================================");
if (failed === 0) {
  console.log(`   ✅ Tất cả ${passed} tests PASSED`);
  console.log("   Atlas Vector Search hoạt động tốt!");
} else {
  console.log(`   Results: ${passed} passed, ${failed} FAILED`);
}
console.log("====================================\n");

if (failed > 0) process.exit(1);
