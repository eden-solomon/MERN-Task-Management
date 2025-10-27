import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { LuFileSpreadsheet } from "react-icons/lu";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/cards/TaskCard";
import toast from "react-hot-toast";
const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");

  const navigate = useNavigate();

  const getAllTasks = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
        },
      });

      // Safe tasks array
      const tasks = Array.isArray(response.data?.tasks) ? response.data.tasks : [];
      setAllTasks(tasks);

      // Safe status summary
      const statusSummary = response.data?.statusSummary || {};
      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "Pending", count: statusSummary.pendingTasks || 0 },
        { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
        { label: "Completed", count: statusSummary.completedTasks || 0 },
      ];
      setTabs(statusArray);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setAllTasks([]);
      setTabs([]);
    }
  };

  const handleClick = (taskData) => {
    navigate("/admin/create-task", { state: { taskId: taskData._id } });
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
        responseType: "blob",
      });

      // Create a Blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "task_details.xlsx"); // File name
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading task report:", error);
      toast.error("Failed to download task report. Please try again.");
    }
  };
  useEffect(() => {
    getAllTasks();
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <div className="my-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          {/* Header + mobile download button */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl md:text-xl font-medium">My Tasks</h2>
            <button
              className="flex lg:hidden download-btn"
              onClick={handleDownloadReport}
            >
              <LuFileSpreadsheet className="text-lg" />
              Download Report
            </button>
          </div>

          {/* Tabs + desktop download button */}
          {tabs?.length > 0 && tabs.some((tab) => tab.count > 0) && (
            <div className="flex items-center gap-3 mt-4 lg:mt-0">
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />
              <button
                className="hidden lg:flex download-btn"
                onClick={handleDownloadReport}
              >
                <LuFileSpreadsheet className="text-lg" />
                Download Report
              </button>
            </div>
          )}
        </div>

        {/* Task cards */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
          {allTasks?.map((item) => (
            <TaskCard
              key={item._id}
              title={item.title || "Untitled Task"}
              description={item.description || ""}
              priority={item.priority || "Normal"}
              status={item.status || "Pending"}
              progress={item.progress || 0}
              createdAt={item.createdAt || null}
              dueDate={item.dueDate || null}
              assignedTo={Array.isArray(item.assignedTo) ? item.assignedTo.map(u => u.profileImageUrl) : []}
              attachmentCount={Array.isArray(item.attachments) ? item.attachments.length : 0}
              completedTodoCount={item.completedTodoCount || 0}
              todoChecklist={Array.isArray(item.todoChecklist) ? item.todoChecklist : []}
              onClick={() => handleClick(item)}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageTasks;
