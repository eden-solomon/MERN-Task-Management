import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { UserProvider, UserContext } from "./context/userContext"
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Dashboard from "./pages/Admin/Dashboard";
import ManageTasks from "./pages/Admin/ManageTasks";
import CreateTask from "./pages/Admin/CreateTask";
import ManageUsers from "./pages/Admin/ManageUsers";
import MyTasks from "./pages/User/MyTasks"
import ViewTaskDetails from "./pages/User/ViewTaskDetails";
import PrivateRoute from "./routes/PrivateRoute";
import AuthLayout from "./components/layouts/AuthLayout";
import { Toaster } from "react-hot-toast";
import UserDashboard from "./pages/User/UserDashboard";
function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/signup" element={<SignUp />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>

          {/* Member/User Routes */}
          <Route element={<PrivateRoute allowedRoles={["member"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
          </Route>
        </Routes>
      </Router>

      <Toaster toastOptions={{ style: { fontSize: "13px" } }} />
    </UserProvider>
  );
}

export default App;

// Root route to redirect users based on role
const Root = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return user.role === "admin" ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/user/dashboard" replace />
  );
};
