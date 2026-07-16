/**
 * Script seed vector embeddings cho documents hiện có trong DB
 * Dành cho documents có URL giả hoặc không download được
 * Dùng title + description để tạo vector thay thế
 * 
 * Run: node backend/seedVectors.js
 */
import mongoose from "mongoose";
import axios from "axios";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGODB_URI;
const AI_URL = "http://localhost:8000";

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI không tìm thấy trong .env");
  process.exit(1);
}

const docSchema = new mongoose.Schema({}, { strict: false });
const Document = mongoose.models.Document || mongoose.model("Document", docSchema, "documents");

await mongoose.connect(MONGO_URI);
console.log("✅ Kết nối MongoDB Atlas\n");

// Lấy tất cả documents chưa có vector
const docs = await Document.find({
  $or: [
    { vectorEmbedding: { $exists: false } },
    { vectorEmbedding: [] },
    { ocrStatus: { $in: ["Pending", "Failed"] } }
  ]
});

console.log(`📋 Tìm thấy ${docs.length} document cần vectorize\n`);

for (const doc of docs) {
  const text = [doc.title, doc.description, doc.extractedText]
    .filter(Boolean)
    .join(". ");

  if (!text.trim()) {
    console.log(`⚠️  Bỏ qua "${doc.title}" — không có text`);
    continue;
  }

  try {
    process.stdout.write(`🔄 Vectorizing "${doc.title}"... `);
    
    const res = await axios.post(`${AI_URL}/ai/vectorize`, { text }, { timeout: 10000 });
    
    if (res.data.success && res.data.vector) {
      await Document.findByIdAndUpdate(doc._id, {
        $set: {
          vectorEmbedding: res.data.vector,
          vectorChunks: [res.data.vector], // single chunk = full title+desc
          extractedText: text,
          ocrStatus: "Completed",
          retryCount: 0,
        }
      });
      console.log(`✅ OK (384-dim vector)`);
    } else {
      console.log(`❌ AI trả về không hợp lệ`);
    }
  } catch (err) {
    console.log(`❌ Lỗi: ${err.message}`);
  }
}

const stats = await Document.countDocuments({ vectorEmbedding: { $exists: true, $ne: [] } });
console.log(`\n✅ Hoàn thành! ${stats}/${docs.length + stats} documents đã có vector.`);

await mongoose.disconnect();
