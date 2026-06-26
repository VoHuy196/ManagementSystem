import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/users.model.js";
import { Employee } from "./models/employees.model.js";
import { Document } from "./models/document.model.js";

dotenv.config();

const runTest = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected successfully!");

  try {
    const user = await User.findOne({ role: "Admin" });
    if (!user) {
      console.log("No user found in database!");
      mongoose.disconnect();
      return;
    }
    console.log(`Testing query for user: ${user.fullName} (${user.email}), role: ${user.role}, ID: ${user._id}`);

    // Test getUserDepartment helper
    const employee = await Employee.findOne({ user: user._id });
    const userDept = employee ? employee.department : "";
    console.log(`Department found: "${userDept}"`);

    // Test filter building
    const filter = {};
    if (user.role !== "Admin") {
      filter.$or = [
        { createdBy: user._id },
      ];
      if (userDept) {
        filter.$or.push({ department: userDept });
      }
    }
    console.log("Generated query filter:", JSON.stringify(filter, null, 2));

    // Run find
    const documents = await Document.find(filter)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 });

    console.log(`Query successful! Found ${documents.length} documents.`);
    if (documents.length > 0) {
      console.log("Sample document:", documents[0]);
    }
  } catch (error) {
    console.error("QUERY ERROR:", error);
  }

  mongoose.disconnect();
  console.log("Test finished.");
};

runTest();
