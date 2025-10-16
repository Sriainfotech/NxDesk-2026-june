import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FieldsetInputField from "../common/FieldsetInputField";
import { axiosInstance } from "../../utils/axiosInstance";
import { Eye, EyeOff } from "lucide-react";
import { fetchUserDetails } from "../../store/actions/userActions";
import { useDispatch } from "react-redux";

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle email input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim() && !password.trim()) {
      setError("Email and Password cannot be empty");
      return;
    } else if (!email.trim()) {
      setError("Email cannot be empty");
      return;
    } else if (!password.trim()) {
      setError("Password cannot be empty");
      return;
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Prepare login data   th trimmed values
    const loginData = {
      email: email.trim(),
      password: password.trim(),
    };

    const userLoginAPI = process.env.REACT_APP_LOGIN_API;

    try {
      const response = await axiosInstance.post(userLoginAPI, loginData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        // Store tokens in localStorage
        const accessToken = response.data.access;
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", response.data.refresh);

        dispatch(fetchUserDetails(accessToken));

        // Navigate to home page on successful login
        navigate("/");
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setError(error?.response?.data?.error);
        } else if (error.response.status === 404) {
          setError("Email not registered");
        } else if (error.response.status >= 500) {
          setError("Server issue. Please try again later");
        } else if (error.response.data && error.response.data.error) {
          setError(error.response.data.error);
        } else {
          setError("Login failed. Please try again.");
        }
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      <header className="text-center px-4 mb-5">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold">
          WELCOME TO NxDesk
        </h1>
        <p className="text-base md:text-xl text-blue-900 font-semibold mt-3">
          The Ultimate Ticketing Tool for all your issues
        </p>
      </header>
      <div className="bg-blue-50 p-8 mt-3 md:p-8 rounded-3xl shadow-2xl w-full sm:w-10/12 md:w-7/12 lg:w-10/12 xl:w-8/12 mb-4 md:mb-6 mx-auto">
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Login</h2>
          <div className="mt-1 flex items-center justify-center">
            <div className="h-1 w-16 bg-blue-500 rounded"></div>
          </div>
          <p className="text-gray-600 mt-3">
            Please enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="text"
              name="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between text-left">
            <a
              href="/forgot-password"
              className="text-gray-600 hover:text-gray-800 underline transition-colors"
            >
              Forgot your password?
            </a>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 text-white bg-blue-500 rounded-md transition-colors w-full font-medium
              ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "hover:bg-blue-600"
              }`}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
          </div>

          {error && (
            <div
              className="text-red-500 text-center p-1.5 bg-red-50 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
