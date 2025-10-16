import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminProgress } from "../../context/AdminProgressContext";

const AdminProgressTracker = () => {
    const navigate = useNavigate();
    const { adminProgress, advanceToStep, completeSetup } = useAdminProgress();
    const currentStep = adminProgress.currentStep;
    const username = adminProgress.currentUser?.username;
  
  // Define the steps for the setup process
  const steps = [
    { 
      id: 0, 
      name: "Registration", 
      description: "User registration completed successfully", 
      path: null,
      // Registration is completed as soon as we're at step 1
      completed: currentStep >= 1
    },
    { 
      id: 1, 
      name: "Assign Role", 
      description: "Assign a role to the user", 
      path: "/user-role",
      // Role assignment is only completed when we're at step 2 or higher
      completed: currentStep >= 2
    },
    { 
      id: 2, 
      name: "Assign Organisation", 
      description: "Assign the employee's organisation", 
      path: "/employee",
      // Organization assignment is only completed when we're at step 3
      completed: currentStep >= 3
    }
  ];

  // Auto-redirect if setup is complete (step 3)
  useEffect(() => {
    if (currentStep >= 3) {
      // Set a timeout to display completion before clearing
      const timer = setTimeout(() => {
        // We don't actually navigate here - we'll show buttons instead
      }, 3000); // 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, navigate]);

  const handleStepClick = (step) => {
    // Only allow clicking on completed steps or the next step in sequence
    if (step.completed || step.id === currentStep) {
      if (step.path) {
        navigate(step.path);
      }
    }
  };

  // Calculate progress as a percentage
  // Step 1: Registration done = 33%
  // Step 2: User role assigned = 66%
  // Step 3: Employee org assigned = 100%
  let progressPercentage = 0;
  
  if (currentStep >= 1) progressPercentage = 33;
  if (currentStep >= 2) progressPercentage = 66;
  if (currentStep >= 3) progressPercentage = 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {currentStep === 0 
            ? "Registration" 
            : currentStep === 1
              ? "Registration Successful"
            : currentStep >= 3 
              ? "Setup Complete!" 
              : "Setup Progress"}
        </h3>
        <p className="text-sm text-gray-600">
          {currentStep === 0
            ? "Complete user registration"
            : currentStep === 1
              ? `Registration successful for ${username}. Please assign a role.`
            : currentStep === 2
              ? `Role assigned for ${username}. Please assign an organization.`
            : `Setup complete for user ${username}`
          }
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="relative pt-1 mb-6">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600">
              {progressPercentage}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-50">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
          ></div>
        </div>
      </div>
      
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            onClick={() => handleStepClick(step)}
            className={`flex items-start p-3 rounded-lg border transition-all ${
              step.completed
                ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
                : step.id === currentStep - 1
                ? "border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100"
                : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
              step.completed
                ? "bg-green-500 text-white"
                : step.id === currentStep - 1
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-500"
            }`}>
              {step.completed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                index // Use index for numbering
              )}
            </div>
            <div>
              <h4 className="font-medium text-sm">{step.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Action buttons based on current step */}
      {currentStep === 1 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              // Navigate without changing steps - they should be at step 1 already
              navigate('/user-role');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Continue with Assign Role
          </button>
        </div>
      )}
      
      {/* Show "Continue to Assign Organization" button when step 2 is active */}
      {currentStep === 2 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              navigate('/employee');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Continue with Assign Organisation
          </button>
        </div>
      )}
      
      {currentStep >= 3 && (
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={() => {
              completeSetup(); // Clear the progress tracking
              navigate("/register");
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
          >
            Register Another User
          </button>
          <button
            onClick={() => {
              completeSetup(); // Clear the progress tracking
              navigate("/dashboard");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProgressTracker;