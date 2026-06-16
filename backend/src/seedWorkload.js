import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/users.model.js";
import { Project } from "./models/projects.model.js";
import { Task } from "./models/tasks.model.js";
import { WorkShift } from "./models/workShift.model.js";
import { WorkSession } from "./models/workSession.model.js";
import dayjs from "dayjs";

dotenv.config();

const seed = async () => {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected successfully!");

  // 1. Create or fetch Shifts
  console.log("Seeding WorkShifts...");
  await WorkShift.deleteMany({});
  const shifts = await WorkShift.insertMany([
    {
      name: "Ca Sáng",
      startTime: "08:00",
      endTime: "12:00",
      color: "#1890ff",
      description: "Ca làm việc buổi sáng",
    },
    {
      name: "Ca Chiều",
      startTime: "13:00",
      endTime: "17:00",
      color: "#52c41a",
      description: "Ca làm việc buổi chiều",
    },
    {
      name: "Ca Tối",
      startTime: "18:00",
      endTime: "22:00",
      color: "#fa8c16",
      description: "Ca làm việc buổi tối (tăng ca / hỗ trợ)",
    },
  ]);
  console.log(`Seeded ${shifts.length} shifts.`);

  // 2. Fetch users, projects, tasks
  const users = await User.find({});
  if (users.length === 0) {
    console.log("No users found. Please register a user first.");
    process.exit(0);
  }
  console.log(`Found ${users.length} users.`);

  let projects = await Project.find({});
  if (projects.length === 0) {
    console.log("Creating a dummy project...");
    const dummyProj = await Project.create({
      name: "Dự án Alpha",
      description: "Dự án chính để test",
      owner: users[0]._id,
      members: users.map(u => u._id),
      startDate: new Date(),
      endDate: dayjs().add(30, "day").toDate(),
      department: "Engineering",
      budget: 100000,
    });
    projects = [dummyProj];
  }
  console.log(`Found ${projects.length} projects.`);

  let tasks = await Task.find({});
  if (tasks.length === 0) {
    console.log("Creating dummy tasks...");
    const dummyTasks = [];
    for (let i = 1; i <= 10; i++) {
      dummyTasks.push({
        title: `Task #${i} - Tính năng quan trọng`,
        description: `Mô tả cho task #${i}`,
        priority: i % 3 === 0 ? "High" : i % 2 === 0 ? "Medium" : "Low",
        status: "Done",
        taskType: "Feature",
        project: projects[0]._id,
        createdBy: users[0]._id,
        assignedTo: users[i % users.length]._id,
      });
    }
    tasks = await Task.insertMany(dummyTasks);
  }
  console.log(`Found ${tasks.length} tasks.`);

  // 3. Seed WorkSessions
  console.log("Seeding WorkSessions...");
  await WorkSession.deleteMany({});
  
  const sessions = [];
  const now = dayjs();

  // Generate sessions for the last 14 days
  for (let d = 0; d < 14; d++) {
    const targetDate = now.subtract(d, "day");
    // Skip weekends with 80% probability to keep it realistic
    if ((targetDate.day() === 0 || targetDate.day() === 6) && Math.random() > 0.2) {
      continue;
    }

    users.forEach((user) => {
      // Each user works on 1-3 tasks per day
      const numTasks = Math.floor(Math.random() * 3) + 1;
      for (let t = 0; t < numTasks; t++) {
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];

        // Pick a shift or outside shift
        const roll = Math.random();
        let shift = null;
        let startHour, startMin, durationMins;

        if (roll < 0.4) {
          // Morning Shift: 08:00 - 12:00
          shift = shifts[0];
          startHour = 8 + Math.floor(Math.random() * 3); // 8 to 10
          startMin = Math.floor(Math.random() * 60);
          durationMins = Math.floor(Math.random() * 120) + 60; // 60 to 180 mins
        } else if (roll < 0.8) {
          // Afternoon Shift: 13:00 - 17:00
          shift = shifts[1];
          startHour = 13 + Math.floor(Math.random() * 3); // 13 to 15
          startMin = Math.floor(Math.random() * 60);
          durationMins = Math.floor(Math.random() * 120) + 60;
        } else if (roll < 0.92) {
          // Evening Shift: 18:00 - 22:00
          shift = shifts[2];
          startHour = 18 + Math.floor(Math.random() * 2); // 18 to 19
          startMin = Math.floor(Math.random() * 60);
          durationMins = Math.floor(Math.random() * 90) + 60;
        } else {
          // Outside shift / Overtime: e.g. 22:00 - 24:00
          shift = null; // Unassigned shift
          startHour = 22;
          startMin = Math.floor(Math.random() * 30);
          durationMins = Math.floor(Math.random() * 90) + 30; // 30 to 120 mins
        }

        const startTime = targetDate.hour(startHour).minute(startMin).second(0).toDate();
        const endTime = dayjs(startTime).add(durationMins, "minute").toDate();

        sessions.push({
          user: user._id,
          task: task._id,
          project: project._id,
          startTime,
          endTime,
          duration: durationMins,
          shift: shift ? shift._id : null,
          status: "completed",
          notes: `Đã hoàn thành công việc trên task này.`,
        });
      }
    });
  }

  await WorkSession.insertMany(sessions);
  console.log(`Seeded ${sessions.length} sessions.`);

  mongoose.disconnect();
  console.log("Done!");
};

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
