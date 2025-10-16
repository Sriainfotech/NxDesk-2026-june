import { CheckCircle } from "lucide-react";

export default function StatusProgressBar({ currentStatus, statuses, activeColor, inactiveColor, height }) {
    console.log("Current Status:", currentStatus, "Type:", typeof currentStatus);
    
    // Convert currentStatus to string if it's a number or any other type
    const currentStatusString = currentStatus ? String(currentStatus) : "";
    
    // Find the index of the current status
    const currentIndex = statuses.findIndex(
        status => status.toLowerCase() === currentStatusString.toLowerCase()
    );

    return (
        <div className="my-8">
            <div className="flex justify-between mb-2">
                {statuses.map((status, index) => (
                    <div 
                        key={index}
                        className={`flex-1 text-center text-sm font-medium ${
                            index <= currentIndex ? "text-blue-700" : "text-gray-500"
                        }`}
                    >
                        {status}
                    </div>
                ))}
            </div>
            
            <div className={`relative ${height || "h-2"} flex bg-gray-200 rounded-full overflow-hidden`}>
                {statuses.map((_, index) => (
                    <div
                        key={index}
                        className={`flex-1 ${
                            index <= currentIndex ? activeColor || "bg-blue-600" : inactiveColor || "bg-gray-200"
                        } ${index < statuses.length - 1 ? "border-r border-white" : ""}`}
                    >
                    </div>
                ))}
                
                {/* Render check icons separately from the progress segments for better positioning */}
                {statuses.map((_, index) => (
                    index <= currentIndex && (
                        <div 
                            key={`check-${index}`}
                            className="absolute top-1/2 transform -translate-y-1/2"
                            style={{ 
                                left: `calc(${(100 / statuses.length) * (index + 0.5)}% - 12px)` 
                            }}
                        >
                            <CheckCircle 
                                size={24} 
                                className="text-white bg-blue-600 rounded-full"
                            />
                        </div>
                    )
                ))}
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                {statuses.map((_, index) => {
                    // Calculate the approximate time for each status
                    const daysAgo = (statuses.length - index) * 2;
                    return (
                        <div key={index} className="text-center">
                            {index <= currentIndex && (
                                <span>{daysAgo === 0 ? "Today" : `${daysAgo} days ago`}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}