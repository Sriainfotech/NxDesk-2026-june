import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { axiosInstance } from "../../utils/axiosInstance";

const ForgotPassword = () => {
  // Local state for form inputs
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI state
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("email"); // "email", "otp", "reset"
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendEnabled, setResendEnabled] = useState(false);
  
  // Password validation
  const [passwordErrors, setPasswordErrors] = useState([]);

  const forgotPasswordUrl = process.env.REACT_APP_FORGOT_PASSWORD_API;
  const verifyOtpUrl = process.env.REACT_APP_VERIFY_OTP_API;
  const resetPasswordUrl = process.env.REACT_APP_RESET_PASSWORD_API;

  // Email change handler
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  // OTP change handler with number and length validation
  const handleOtpChange = (e) => {
    const value = e.target.value;
    
    // Only allow numbers and maximum 6 digits
    if (value === '' || (/^\d+$/.test(value) && value.length <= 6)) {
      setOtp(value);
      setError("");
    }
  };

  // Password change handler with validation
  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
    setError("");
  };

  // Confirm password change handler
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
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

  // Send OTP request
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim()) {
      setError("Email cannot be empty");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post(forgotPasswordUrl, { email });
      if (response.status === 200) {
        setCurrentStep("otp");
        setResendEnabled(false);
        setResendTimer(30);
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data?.error || "Error sending OTP");
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP request
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!otp.trim()) {
      setError("OTP cannot be empty");
      return;
    }

    // Validate OTP length
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post(verifyOtpUrl, { 
        email: email.trim(), 
        otp: otp.trim() 
      });
      
      if (response.status === 200) {
        setCurrentStep("reset");
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data?.error || "Invalid OTP");
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password request
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");

    // Password validation
    const isPasswordValid = validatePassword(newPassword);
    if (!isPasswordValid) {
      setError("Please fix the password requirements");
      return;
    }

    // Password match validation
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post(resetPasswordUrl, {
        email: email.trim(),
        new_password: newPassword
      });
      
      if (response.status === 200) {
        // Success - could redirect to login
        // For now we'll just display a success message in the error field
        setError("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data?.error || "Failed to reset password");
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (currentStep === "otp" && !resendEnabled && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setResendEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendEnabled, resendTimer]);

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
          <h2 className="text-xl font-bold text-gray-800">Reset Your Password</h2>
          <div className="mt-1 flex items-center justify-center">
            <div className="h-1 w-16 bg-blue-500 rounded"></div>
          </div>
          <p className="text-gray-600 mt-3">
            {currentStep === "email" && "Please enter your email to receive a reset code"}
            {currentStep === "otp" && "Enter the verification code sent to your email"}
            {currentStep === "reset" && "Create a new strong password for your account"}
          </p>
        </div>

        {/* Email Step */}
        {currentStep === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                placeholder="Enter your registered email"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 text-white bg-blue-500 rounded-md transition-colors w-full font-medium
                ${isLoading ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-600"}`}
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </button>
            </div>
          </form>
        )}

        {/* OTP Step */}
        {currentStep === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                name="otp"
                value={otp}
                onChange={handleOtpChange}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
                placeholder="Enter 6-digit code"
              />
              <p className="text-gray-600 text-sm mt-2">
                6-digit code sent to your email. Please check your inbox or spam folder.
              </p>
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 text-white bg-blue-500 rounded-md transition-colors w-full font-medium
                ${isLoading ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-600"}`}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
            
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={resendEnabled ? handleEmailSubmit : null}
                disabled={!resendEnabled || isLoading}
                className={`text-sm ${
                  resendEnabled && !isLoading
                    ? "text-blue-600 hover:text-blue-800"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                {resendEnabled ? "Resend Code" : `Resend code in ${resendTimer}s`}
              </button>
            </div>
          </form>
        )}

        {/* Password Reset Step */}
        {currentStep === "reset" && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  name="new_password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  disabled={isLoading}
                  placeholder="Enter new password"
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

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  disabled={isLoading}
                  placeholder="Confirm new password"
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

            <div className="text-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 py-2 text-white bg-blue-500 rounded-md transition-colors w-full font-medium
                ${isLoading ? "bg-blue-400 cursor-not-allowed" : "hover:bg-blue-600"}`}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <div 
            className={`text-center p-1.5 rounded-md mt-4 ${
              error.includes("successful") 
                ? "text-green-500 bg-green-50" 
                : "text-red-500 bg-red-50"
            }`}
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-gray-600 hover:text-gray-800 underline transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;