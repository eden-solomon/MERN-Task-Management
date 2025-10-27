import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";

export const useUserAuth = () => {
  const { user, loading, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait until loading finishes

    if (!user) {
      clearUser(); // Clear any stale data
      navigate("/login"); // Redirect to login
    }
  }, [user, loading, clearUser, navigate]);
};
