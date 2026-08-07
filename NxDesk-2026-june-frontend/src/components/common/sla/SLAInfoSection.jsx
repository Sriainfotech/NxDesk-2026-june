import { Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function SLAInfoSection({ sla, slaBreachStatus, status, ticketData }) {
    if (!sla) return null;

    // Calculate remaining time in hours
    const calculateRemainingTime = () => {
        if (!sla.sla_due_date) return "N/A";
        
        const dueDate = new Date(sla.sla_due_date);
        const now = new Date();
        
        // If already breached or completed
        if (sla.breached || ["Resolved", "Closed", "Cancelled"].includes(status)) {
            return "0h 0m";
        }
        
        const diffMs = dueDate - now;
        if (diffMs <= 0) return "0h 0m";
        
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${diffHrs}h ${diffMins}m`;
    };

    const getProgressPercentage = () => {
        if (!sla.start_time || !sla.sla_due_date) return 0;
        
        const startDate = new Date(sla.start_time);
        const dueDate = new Date(sla.sla_due_date);
        const now = new Date();
        
        // If already completed
        if (["Resolved", "Closed", "Cancelled"].includes(status)) {
            return 100;
        }
        
        const totalMs = dueDate - startDate;
        const elapsedMs = now - startDate;
        
        const percentage = Math.min(Math.floor((elapsedMs / totalMs) * 100), 100);
        return percentage;
    };

    const progressPercentage = getProgressPercentage();
    const remainingTime = calculateRemainingTime();
    
    const getStatusColor = () => {
        if (sla.breached) return "text-red-600";
        if (progressPercentage > 75) return "text-orange-600";
        if (["Resolved", "Closed"].includes(status)) return "text-green-600";
        return "text-blue-600";
    };

    const getSLAIndicator = () => {
        if (sla.breached) {
            return <AlertCircle className="text-red-600" size={24} />;
        } else if (["Resolved", "Closed"].includes(status)) {
            return <CheckCircle className="text-green-600" size={24} />;
        } else {
            return <Clock className={getStatusColor()} size={24} />;
        }
    };

    return (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl mb-4 text-gray-800 flex items-center">
                <Clock className="mr-2 text-blue-600" size={20} />
                SLA Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-500">SLA Status</div>
                        {getSLAIndicator()}
                    </div>
                    <div className={`text-xl font-semibold ${getStatusColor()}`}>
                        {sla.sla_status || "Unknown"}
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="font-medium text-gray-500">Due Date</div>
                    <div className="text-xl font-semibold text-gray-800">
                        {sla.sla_due_date ? new Date(sla.sla_due_date).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : "Not set"}
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="font-medium text-gray-500">Remaining Time</div>
                    <div className={`text-xl font-semibold ${getStatusColor()}`}>
                        {remainingTime}
                    </div>
                </div>
            </div>
            
            <div className="mt-4">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500">SLA Progress</span>
                    <span className={`text-sm font-medium ${getStatusColor()}`}>{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className={`h-2.5 rounded-full ${
                            sla.breached ? "bg-red-600" : 
                            progressPercentage > 75 ? "bg-orange-500" : 
                            ["Resolved", "Closed"].includes(status) ? "bg-green-600" : 
                            "bg-blue-600"
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}