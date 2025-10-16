import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../utils/axiosInstance";
import { Eye, EyeOff } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password validation
  const [passwordErrors, setPasswordErrors] = useState([]);

  const userProfile = useSelector((state) => state.userProfile.user);

  // Get user email from localStorage or any other source you use
  const userEmail = userProfile?.email || "";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Clear error when input changes
    
    // Validate password if the newPassword field is being updated
    if (name === "newPassword") {
      validatePassword(value);
    }
  };

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    let missingFields = [];

    if (!formData.oldPassword) {
      missingFields.push("old password");
    }
    if (!formData.newPassword) {
      missingFields.push("new password");
    }
    if (!formData.confirmNewPassword) {
      missingFields.push("confirm new password");
    }

    if (missingFields.length > 0) {
      const message =
        missingFields.length === 1
          ? `${missingFields[0]} cannot be empty`
          : `${missingFields.slice(0, -1).join(", ")} and ${missingFields.at(-1)} cannot be empty`;

      setError(message);
      setIsLoading(false);
      return;
    }

    // Password validation
    const isPasswordValid = validatePassword(formData.newPassword);
    if (!isPasswordValid) {
      setError("Please fix the password requirements");
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("New password and confirm password do not match");
      setIsLoading(false);
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError("New password and old password should not be same");
      setIsLoading(false);
      return;
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Access token is missing. Please login again.");
      setIsLoading(false);
      navigate("/login");
      return;
    }

    const resetPasswordAPI = "user/resetpassword/";

    try {
      const response = await axiosInstance.post(
        resetPasswordAPI,
        {
          old_password: formData.oldPassword,
          new_password: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        // Display success message in the error field (similar to ForgotPassword component)
        setError("Password reset successful! Redirecting to home page...");
        
        // Cancel any existing toast if present
        toast.dismiss();
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.data && error.response.data.error) {
          setError(error.response.data.error);
        } else if (error.response.status === 401) {
          setError("Invalid old password");
        } else if (error.response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Password reset failed. Please try again.");
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

  const toggleOldPasswordVisibility = () => {
    setShowOldPassword(!showOldPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="w-full min-h-screen">
      {/* <header className="text-center px-4 mb-5">
        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold">
          WELCOME TO NxDesk
        </h1>
        <p className="text-base md:text-xl text-blue-900 font-semibold mt-3">
          The Ultimate Ticketing Tool for all your issues
        </p>
      </header> */}
      <div className="bg-blue-50 p-8 mt-2 md:p-8 rounded-3xl shadow-2xl w-full sm:w-10/12 md:w-7/12 lg:w-10/12 xl:w-8/12 mb-4 md:mb-6 mx-auto">
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">Reset Password</h2>
          <div className="mt-1 flex items-center justify-center">
            <div className="h-1 w-16 bg-blue-500 rounded"></div>
          </div>
          <p className="text-gray-600 mt-3">
            Please enter your current password and new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field (Disabled) */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={userEmail}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
              disabled
            />
          </div>

          {/* Old Password Field */}
          <div>
            <label
              htmlFor="oldPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Old Password
            </label>
            <div className="relative">
              <input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleOldPasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showOldPassword ? "Hide password" : "Show password"}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {passwordErrors.length > 0 && (
            <div className="text-xs text-red-500 space-y-1">
              {passwordErrors.map((err, index) => (
                <p key={index}>{err}</p>
              ))}
            </div>
          )}

          {/* Confirm New Password Field */}
          <div>
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between text-left">
            <a
              href="/"
              className="text-gray-600 hover:text-gray-800 underline transition-colors"
            >
              Back to Home Page
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
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>

          {error && (
            <div
              className={`text-center p-1.5 rounded-md ${
                error.includes("successful") 
                  ? "text-green-500 bg-green-50" 
                  : "text-red-500 bg-red-50"
              }`}
              role="alert"
            >
              {error}
            </div>
          )}
        </form>
      </div>
      <ToastContainer
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default ResetPassword;