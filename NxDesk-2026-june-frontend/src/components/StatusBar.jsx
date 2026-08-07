import React from 'react';

const StatusProgressBar = ({ 
  currentStatus, 
  statuses = ["Open", "Working in progress", "Waiting for users", "Resolved", "Closed", "Cancelled"],
  activeColor = "bg-blue-600",
  inactiveColor = "bg-gray-200",
  activeTextColor = "text-white",
  inactiveTextColor = "text-gray-700",
  height = "h-1"
}) => {
  
  const currentIndex = statuses.indexOf(currentStatus);
  
  if (currentIndex === -1) {
    console.warn(`Status "${currentStatus}" not found in provided status list.`);
  }
  
  return (
    <div className="w-full">
      <div className={`flex w-full ${height} ${inactiveColor} rounded-3xl overflow-hidden`}>
        {statuses.map((status, index) => {
          const isActive = index <= currentIndex;
          const width = `${100 / statuses.length}%`;
          
          return (
            <div 
              key={index} 
              className={`flex items-center justify-center 
                ${isActive ? `${activeColor} ${activeTextColor}` : `${inactiveColor} ${inactiveTextColor}`} 
               `}
              style={{ width }}
            >
              <span className="text-sm font-medium px-1 truncate">{status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusProgressBar;