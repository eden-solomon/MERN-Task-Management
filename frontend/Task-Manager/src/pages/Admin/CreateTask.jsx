import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { LuTrash2 } from "react-icons/lu";
import SelectDropdown from "../../components/Inputs/SelectDropdown";
import SelectUsers from "../../components/Inputs/SelectUsers";
import TodoListInput from "../../components/Inputs/TodoListInput";
import AddAttachmentsInput from "../../components/Inputs/AddAttachmentsInput"
import DeleteAlert from "../../components/DeleteAlert";
import Modal from "../../components/Modal";
import moment from "moment"; 

const CreateTask = () => {
  const location = useLocation();
  const { taskId } = location.state || {};
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "Low",
    dueDate: "",
    assignedTo: [], 
    todoChecklist: [],
    attachments: [],
  });

  // ✅ Handle field value change
  const handleValueChange = (key, value) => {
    setTaskData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  // ✅ Reset form fields
  const clearData = () => {
    setTaskData({
      title: "",
      description: "",
      priority: "Low",
      dueDate: "",
      assignedTo: [],
      todoChecklist: [],
      attachments: [],
    });
  };

  // 🛠️ Helper to prepare the payload data defensively
  const preparePayload = (isUpdate = false) => {
    // Convert todoChecklist to the required server format
    const todolist = taskData.todoChecklist.map((item) => ({
      text: item,
      // On creation, all are false. On update, we handle completion status separately.
      completed: isUpdate ? (
        currentTask?.todoChecklist.find((task) => task.text === item)?.completed || false
      ) : false,
    }));

    // Safely convert dueDate to ISO string only if it exists
    const isoDueDate = taskData.dueDate
      ? new Date(taskData.dueDate).toISOString()
      : null; 
      
    // Ensure array fields are explicitly arrays
    const assignedToIds = Array.isArray(taskData.assignedTo) ? taskData.assignedTo : [];
    const taskAttachments = Array.isArray(taskData.attachments) ? taskData.attachments : [];

    return {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      dueDate: isoDueDate, // Use the safely converted date (or null)
      assignedTo: assignedToIds,
      todoChecklist: todolist,
      attachments: taskAttachments,
    };
  }

  // ✅ Update existing task
  const updateTask = async () => {
    setLoading(true);
    try {
      // Use the helper to prepare the update payload
      const payload = preparePayload(true); 

      await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), payload);

      toast.success("Task updated successfully!");
      
    } catch (error) {
      console.error("Error updating task:", error);
      const serverMessage = error.response?.data?.message || "Server error. Check backend logs.";
      toast.error(`Failed to update task: ${serverMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create new task
  const createTask = async () => {
    setLoading(true);
    try {
      // Use the helper to prepare the creation payload
      const payload = preparePayload(false); 
      
      // Line 139 equivalent - this is where the 500 happens.
      await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, payload); 

      toast.success("Task created successfully!");
      clearData();
    } catch (error) {
      console.error("Error creating task:", error);
      const serverMessage = error.response?.data?.message || "Server error. Check backend logs.";
      toast.error(`Failed to create task: ${serverMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch task details
  const getTaskDetailsByID = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(taskId)
      );

      if (response.data) {
        const taskInfo = response.data;
        setCurrentTask(taskInfo);
        setTaskData({
          title: taskInfo.title,
          description: taskInfo.description,
          priority: taskInfo.priority,
          dueDate: taskInfo.dueDate
            ? moment(taskInfo.dueDate).format("YYYY-MM-DD")
            : "",
          // Ensure we extract only IDs for assignedTo
          assignedTo: Array.isArray(taskInfo.assignedTo)
            ? taskInfo.assignedTo.map((item) => item?._id)
            : taskInfo.assignedTo
            ? [taskInfo.assignedTo._id || taskInfo.assignedTo]
            : [],
          todoChecklist: taskInfo.todoChecklist?.map((item) => item.text) || [],
          attachments: taskInfo.attachments || [],
        });
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
    }
  };


  // ✅ Delete task
  const deleteTask = async () => {
    try {
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
      setOpenDeleteAlert(false);
      toast.success("Task deleted successfully!");
      navigate("/admin/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task.");
    }
  };

  // ✅ Handle submit (create/update)
  const handleSubmit = async () => {
    setError(null);

    // Frontend Validation
    if (!taskData.title.trim()) return setError("Title is required.");
    if (!taskData.description.trim()) return setError("Description is required.");
    if (!taskData.dueDate) return setError("Due date is required.");
    if (taskData.assignedTo.length === 0)
      return setError("Task must be assigned to at least one member.");
    if (taskData.todoChecklist.length === 0)
      return setError("Add at least one todo task.");

    if (taskId) {
      updateTask();
    } else {
      createTask();
    }
  };

  // ✅ Load task data if editing
  useEffect(() => {
    if (taskId) {
      getTaskDetailsByID(taskId);
    }
    return()=>{};

  }, [taskId]);

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="mt-1">
        <div className="grid grid-cols-1 md:grid-cols-4 mt-4">
          <div className="form-card col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-xl font-medium">
                {taskId ? "Update Task" : "Create Task"}
              </h2>

              {taskId && (
                <button
                  className="flex items-center gap-1.5 text-[13px] font-medium text-rose-500 bg-rose-50 rounded px-2 py-1 border-rose-100 hover:border-rose-300 cursor-pointer"
                  onClick={() => setOpenDeleteAlert(true)}
                >
                  <LuTrash2 className="text-base" /> Delete
                </button>
              )}
            </div>

            {/* FORM INPUTS */}
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600">
                Task Title
              </label>
              <input
                placeholder="Create App UI"
                className="form-input"
                value={taskData.title}
                onChange={({ target }) =>
                  handleValueChange("title", target.value)
                }
              />
            </div>

            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Description
              </label>
              <textarea
                placeholder="Task description"
                className="form-input"
                rows={4}
                value={taskData.description}
                onChange={({ target }) =>
                  handleValueChange("description", target.value)
                }
              />
            </div>

            <div className="grid grid-cols-12 gap-4 mt-2">
              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Priority
                </label>
                <SelectDropdown
                  options={PRIORITY_DATA}
                  value={taskData.priority}
                  onChange={(value) => handleValueChange("priority", value)}
                  placeholder="Select Priority"
                />
              </div>

              <div className="col-span-6 md:col-span-4">
                <label className="text-xs font-medium text-slate-600">
                  Due Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={taskData.dueDate || ""}
                  onChange={({ target }) =>
                    handleValueChange("dueDate", target.value)
                  }
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="text-xs font-medium text-slate-600">
                  Assign To
                </label>
                <SelectUsers
                  selectedUsers={taskData.assignedTo}
                  setSelectedUsers={(value) =>
                    handleValueChange("assignedTo", value)
                  }
                />
              </div>
            </div>

            {/* TODO List */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                TODO Checklist
              </label>
              <TodoListInput
                todoList={taskData.todoChecklist}
                setTodoList={(value) =>
                  handleValueChange("todoChecklist", value)
                }
              />
            </div>

            {/* Attachments */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-600">
                Add Attachments
              </label>
              <AddAttachmentsInput
                attachments={taskData.attachments}
                setAttachments={(value) =>
                  handleValueChange("attachments", value)
                }
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500 mt-5">{error}</p>
            )}

            <div className="mt-7 flex justify-between">
              <button
                className="add-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {taskId ? "UPDATE TASK" : "CREATE TASK"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Delete confirmation modal */}
      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Task"
      >
        <DeleteAlert
          content="Are you sure you want to delete this task?"
          onDelete={deleteTask}
        />
      </Modal>
    </DashboardLayout>
  );
};

export default CreateTask;