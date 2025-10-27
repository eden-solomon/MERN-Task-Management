const Task = require("../models/Task");

// @desc Get all tasks (Admin: all, User: only assigned tasks)
// @route GET /api/tasks/
// @access Private
const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    // Fetch tasks based on role
    let tasks;
    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    }

    // Add completed todoChecklist count safely
    tasks = tasks.map((task) => {
      const completedCount = Array.isArray(task.todoChecklist)
        ? task.todoChecklist.filter((item) => item.completed).length
        : 0;

      return { ...task._doc, completedTodoCount: completedCount };
    });

    // Counts for status summary
    const baseFilter = req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    const allTasks = await Task.countDocuments(baseFilter);
    const pendingTasks = await Task.countDocuments({ ...baseFilter, status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ ...baseFilter, status: "In Progress" });
    const completedTasks = await Task.countDocuments({ ...baseFilter, status: "Completed" });

    res.json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    console.error("Error in getTasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// @desc Get task by ID
// @route GET /api/tasks/:id
// @access Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc Create a new task (Admin only)
// @route POST /api/tasks/
// @access Private (Admin)


const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo, // fixed variable name (no spaces)
      attachments,
      todoChecklist,
    } = req.body;

    // Validate required fields
    if (!title || !description || !dueDate || !assignedTo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if assignedTo is an array
    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "assignedTo must be an array of user IDs" });
    }

    // Create the task
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user._id, // make sure req.user is set from auth middleware
      todoChecklist,
      attachments,
    });

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// @desc Update task details
// @route PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update fields if provided
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;

    // Update assignedTo if provided
    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res
          .status(400)
          .json({ message: "assignedTo must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();
    res.json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Delete a task (Admin only)
// @route DELETE /api/tasks/:id
// @access Private (Admin)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Update task status
// @route PUT /api/tasks/:id/status
// @access Private
const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Handle both single and multiple assignees
    let isAssigned = false;
    if (Array.isArray(task.assignedTo)) {
      // Multiple users assigned
      isAssigned = task.assignedTo.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
    } else {
      // Single user assigned
      isAssigned = task.assignedTo.toString() === req.user._id.toString();
    }

    if (!isAssigned && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update status
    task.status = req.body.status || task.status;

    // If completed, mark all checklist items completed
    if (task.status === "Completed") {
      task.todoChecklist.forEach((item) => (item.completed = true));
      task.progress = 100;
    }

    await task.save();
    res.json({ message: "Task status updated", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc Update task checklist
// @route PUT /api/tasks/:id/todo
// @access Private
const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user is assigned or admin (works for single or multiple assignees)
    let isAssigned = false;
    if (Array.isArray(task.assignedTo)) {
      isAssigned = task.assignedTo.some(
        (userId) => userId.toString() === req.user._id.toString()
      );
    } else {
      isAssigned = task.assignedTo.toString() === req.user._id.toString();
    }

    if (!isAssigned && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update checklist" });
    }

    // Update checklist
    task.todoChecklist = todoChecklist;

    // Auto-update progress based on checklist completion
    const completedCount = task.todoChecklist.filter((item) => item.completed)
      .length;
    const totalItems = task.todoChecklist.length;

    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // Auto-update task status based on progress
    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    // Return the updated task with populated assignedTo
    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    res.json({ message: "Task checklist updated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// @desc Admin dashboard data (summary)
// @route GET /api/tasks/dashboard-data
// @access Private (Admin)
const getDashboardData = async (req, res) => {
  try {
    // Fetch statistics
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status
    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, ""); // remove spaces
      const foundStatus = taskDistributionRaw.find((item) => item._id === status);
      acc[formattedKey] = foundStatus ? foundStatus.count : 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks; // Add total tasks

    // Task distribution by priority
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      const foundPriority = taskPriorityRaw.find((item) => item._id === priority);
      acc[priority] = foundPriority ? foundPriority.count : 0;
      return acc;
    }, {});

    // Fetch recent tasks (latest 10)
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
        recentTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc User dashboard data
// @route GET /api/tasks/user-dashboard-data
// @access Private
const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id; // Only fetch data for the logged-in user

    // Fetch statistics for user-specific tasks
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Pending",
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    // Task distribution by status
    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
         taskDistribution["All"] = totalTasks;
    // Task distribution by priority
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    // Fetch recent tasks (latest 10)
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    // Return response
    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
        recentTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
