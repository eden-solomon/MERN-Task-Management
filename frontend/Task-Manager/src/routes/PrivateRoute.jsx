import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/userContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <div>Loading...</div>; // optional spinner

  if (!user) return <Navigate to="/login" replace />;

  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
