const User = require("../models/User");
const Task = require("../models/Task");
const excelJS = require("exceljs");

// @desc    Export all tasks as an Excel file
// @route   GET /api/reports/export/tasks
// @access  Private (Admin)
const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");

    worksheet.columns = [
      { header: "Task ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
    ];

    tasks.forEach((task) => {
      const assignedTo = Array.isArray(task.assignedTo)
        ? task.assignedTo.map((user) => user.name).join(", ")
        : task.assignedTo
        ? task.assignedTo.name
        : "";

      worksheet.addRow({
        _id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.toLocaleDateString() : "",
        assignedTo,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="tasks_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting tasks:", error);
    res.status(500).json({ message: "Error exporting tasks", error: error.message });
  }
};

// @desc    Export all users and their task stats as Excel
// @route   GET /api/reports/export/users
// @access  Private (Admin)
const exportUsersReport = async (req, res) => {
  try {
    console.log("Export Users Report called"); // ✅ debug log

    const users = await User.find().select("name email _id").lean();
    const tasks = await Task.find().populate("assignedTo", "name email _id");

    const userTaskMap = {};

    // Initialize user map
    users.forEach((user) => {
      userTaskMap[user._id] = {
        name: user.name,
        email: user.email, // ✅ fixed from email_id
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    // Aggregate task stats per user
    tasks.forEach((task) => {
      if (task.assignedTo) {
        const assignedUsers = Array.isArray(task.assignedTo)
          ? task.assignedTo
          : [task.assignedTo];

        assignedUsers.forEach((assignedUser) => {
          const userStats = userTaskMap[assignedUser._id];
          if (userStats) {
            userStats.taskCount += 1;

            if (task.status === "Pending") userStats.pendingTasks += 1;
            else if (task.status === "In Progress") userStats.inProgressTasks += 1;
            else if (task.status === "Completed") userStats.completedTasks += 1;
          }
        });
      }
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Report");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Total Tasks", key: "taskCount", width: 20 },
      { header: "Pending Tasks", key: "pendingTasks", width: 20 },
      { header: "In Progress Tasks", key: "inProgressTasks", width: 20 },
      { header: "Completed Tasks", key: "completedTasks", width: 20 },
    ];

    Object.values(userTaskMap).forEach((user) => worksheet.addRow(user));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="users_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting users:", error); // ✅ will show exact reason
    res.status(500).json({ message: "Error exporting users", error: error.message });
  }
};

module.exports = {
  exportTasksReport,
  exportUsersReport,
};
