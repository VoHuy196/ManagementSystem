import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/users.model.js";

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- ${u.fullName} (${u.email}), role: ${u.role}, ID: ${u._id}`);
  });
  mongoose.disconnect();
};

check();
