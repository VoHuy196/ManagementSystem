import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/users.model.js";
import { Employee } from "./models/employees.model.js";
import { Document } from "./models/document.model.js";

dotenv.config();

const DEPARTMENTS = ["HR", "Engineering", "Marketing", "Finance"];

const seed = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected successfully!");

  // 1. Fetch all users
  const users = await User.find({});
  if (users.length === 0) {
    console.log("No users found in database. Please register a user first.");
    process.exit(0);
  }
  console.log(`Found ${users.length} users.`);

  // 2. Fetch all employees and assign departments
  const employees = await Employee.find();
  console.log(`Found ${employees.length} employees. Assigning departments...`);

  // Assign departments to employees round-robin
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    emp.department = dept;
    await emp.save();
    console.log(`Employee: ${emp.name} -> Department: ${dept}`);
  }

  // 3. Create sample documents using real User IDs for createdBy
  console.log("Seeding documents...");
  await Document.deleteMany({});

  const sampleDocs = [];
  const adminUser = users[0];
  const secondUser = users[1] || adminUser;
  const thirdUser = users[2] || adminUser;

  // HR Documents
  sampleDocs.push(
    {
      title: "Quy trình Tuyển dụng Nhân sự 2026",
      description: "Tài liệu hướng dẫn quy trình phỏng vấn và tiếp nhận nhân sự mới.",
      fileUrl: "https://docs.google.com/document/d/1hr-tuyendung-2026",
      category: "Quyết định",
      department: "HR",
      createdBy: adminUser._id,
      status: "Published",
    },
    {
      title: "Chính sách Phúc lợi & Bảo hiểm mới",
      description: "Quy định chi tiết về các gói bảo hiểm sức khỏe tự nguyện cho nhân viên chính thức.",
      fileUrl: "https://docs.google.com/document/d/1hr-phucloi-bh",
      category: "Thông báo",
      department: "HR",
      createdBy: adminUser._id,
      status: "Published",
    }
  );

  // Engineering Documents
  sampleDocs.push(
    {
      title: "Kiến trúc hệ thống Microservices v2",
      description: "Tài liệu đặc tả kiến trúc kỹ thuật của hệ thống dự án mới.",
      fileUrl: "https://docs.google.com/document/d/1eng-architecture-v2",
      category: "Tài liệu kỹ thuật",
      department: "Engineering",
      createdBy: secondUser._id,
      status: "Published",
    },
    {
      title: "Quy trình Kiểm thử Tự động (CI/CD Pipeline)",
      description: "Quy chuẩn build và deploy code tự động lên môi trường staging.",
      fileUrl: "https://docs.google.com/document/d/1eng-cicd-pipeline",
      category: "Tài liệu kỹ thuật",
      department: "Engineering",
      createdBy: secondUser._id,
      status: "Published",
    }
  );

  // Marketing Documents
  sampleDocs.push(
    {
      title: "Kế hoạch Chiến dịch Marketing quý 3",
      description: "Kế hoạch ngân sách và các kênh chạy quảng cáo sản phẩm mới.",
      fileUrl: "https://docs.google.com/document/d/1mkt-plan-q3",
      category: "Báo cáo",
      department: "Marketing",
      createdBy: thirdUser._id,
      status: "Published",
    }
  );

  // General Documents
  sampleDocs.push(
    {
      title: "Nội quy & Quy định chung của Công ty",
      description: "Quy định về thời gian làm việc, bảo mật thông tin và ứng xử trong văn phòng.",
      fileUrl: "https://docs.google.com/document/d/1gen-noiquy-congty",
      category: "Quyết định",
      department: "General",
      createdBy: adminUser._id,
      status: "Published",
    }
  );

  await Document.insertMany(sampleDocs);
  console.log(`Successfully seeded ${sampleDocs.length} documents.`);

  mongoose.disconnect();
  console.log("Done!");
};

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
