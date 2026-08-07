import React, { createContext, useState, useContext, useEffect } from "react";

const AdminProgressContext = createContext();

export const AdminProgressProvider = ({ children }) => {
  const [adminProgress, setAdminProgress] = useState({
    currentUser: null,
    currentStep: 0,
    lastRegisteredUser: null,
  });

  const [loadings, setLoading] = useState(true); // Loading state

  // Load from localStorage on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem("adminProgress");
    if (savedProgress) {
      setAdminProgress(JSON.parse(savedProgress));
    }
    setLoading(false); // Mark as done loading
  }, []);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    if (!loadings) {
      localStorage.setItem("adminProgress", JSON.stringify(adminProgress));
    }
  }, [adminProgress, loadings]);

  // Start a new user setup - always at step 1 after registration
  const startUserSetup = (username, email) => {
    const userData = { username, email };
    const newProgress = {
      currentUser: userData,
      currentStep: 1, // Step 1: Registration complete, now need to assign role
      lastRegisteredUser: userData,
    };

    // Update state
    setAdminProgress(newProgress);

    // Force localStorage update immediately
    localStorage.setItem("adminProgress", JSON.stringify(newProgress));

    console.log(`User setup started for ${username} at step 1`);
  };

  // Advance to a specific step
  const advanceToStep = (step) => {
    // Validate step number is between 1-3
    const validStep = Math.min(Math.max(1, step), 3);

    // Directly update the state and force localStorage update
    const updatedProgress = {
      ...adminProgress,
      currentStep: validStep,
    };

    // Update state
    setAdminProgress(updatedProgress);

    // Force localStorage update immediately
    localStorage.setItem("adminProgress", JSON.stringify(updatedProgress));

    console.log(`Step advanced to ${validStep}`);
    return validStep; // Return the new step for confirmation
  };

  // Complete the setup process
  const completeSetup = () => {
    setAdminProgress((prev) => ({
      ...prev,
      currentStep: 0,
      currentUser: null,
    }));

    // Force localStorage update immediately
    localStorage.removeItem("adminProgress");
  };

  // Reset all progress
  const resetProgress = () => {
    setAdminProgress({
      currentUser: null,
      currentStep: 0,
      lastRegisteredUser: null,
    });
    localStorage.removeItem("adminProgress");
  };

  return (
    <AdminProgressContext.Provider
      value={{
        adminProgress,
        loadings,
        startUserSetup,
        advanceToStep,
        completeSetup,
        resetProgress,
      }}
    >
      {children}
    </AdminProgressContext.Provider>
  );
};

export const useAdminProgress = () => useContext(AdminProgressContext);
