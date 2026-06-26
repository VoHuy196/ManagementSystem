import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/users.model.js";
import { Employee } from "./models/employees.model.js";

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const employees = await Employee.find().populate("user");
  console.log("Employees in DB:");
  employees.forEach(e => {
    console.log(`- Employee: ${e.name} (Code: ${e.employeeCode}), Department: "${e.department}", User linked: ${e.user ? `${e.user.fullName} (${e.user.email}) [ID: ${e.user._id}]` : "NONE"}`);
  });

  const users = await User.find({});
  console.log("\nUsers in DB:");
  users.forEach(u => {
    const isLinked = employees.some(e => e.user && e.user._id.toString() === u._id.toString());
    console.log(`- User: ${u.fullName} (${u.email}), role: ${u.role}, Linked to employee: ${isLinked ? "YES" : "NO"}`);
  });

  mongoose.disconnect();
};

check();
