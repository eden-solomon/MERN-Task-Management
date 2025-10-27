import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance"; // make sure this path is correct
import { API_PATHS } from "../../utils/apiPaths"; // make sure this path is correct
import { UserContext } from "../../context/userContext";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
   const {updateUser}=useContext(UserContext)
   const navigate = useNavigate(); // ✅ useNavigate hook
  const handleLogin = async (e) => {
    e.preventDefault();

    // ✅ Email validation
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // ✅ Password validation
    if (!password) {
      setError("Please enter the password.");
      return;
    }

    // Minimum length check
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setError(""); // Clear previous error

    // ✅ Login API Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role } = response.data;

      if (token) {
        localStorage.setItem("token", token);
         updateUser(response.data)
        // Redirect based on role
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Welcome Back!</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to log in.
        </p>

        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />

          {/* Password Input */}
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            placeholder="Min 8 Characters"
            type="password"
          />

          {/* Error Message */}
          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          {/* Login Button */}
          <button type="submit" className="btn-primary">
            LOGIN
          </button>

          {/* Signup Redirect */}
          <p className="text-[13px] text-slate-800 mt-3">
            Don't have an account?{" "}
            <Link className="font-medium text-primary underline" to="/signup">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </>
  );
};

export default Login;
