import { Task } from "../models/tasks.model.js";
import { User } from "../models/users.model.js";

const smartAssign = async () => {
  // Chỉ assign cho users có role Employee, không assign cho Admin/Manager
  const users = await User.find({ role: "Employee" });
  
  if (users.length === 0) {
    // Fallback: nếu không có Employee nào thì lấy tất cả users
    const allUsers = await User.find();
    if (allUsers.length === 0) return null;
    return allUsers[0];
  }

  const userTasks = await Promise.all(
    users.map(async (user) => {
      const count = await Task.countDocuments({
        assignedTo: user._id,
        status: { $ne: "Done" }, // Đếm task chưa hoàn thành
      });
      return { user, count };
    })
  );
  
  userTasks.sort((a, b) => a.count - b.count);
  return userTasks[0].user;
};

export default smartAssign;
