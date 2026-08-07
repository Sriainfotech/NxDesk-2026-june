import { AlertTriangle, FileText } from "lucide-react";

export default function TicketHeader({ ticketData, formatImpact }) {
    if (!ticketData) return null;

    const getPriorityColor = () => {
        if (!ticketData.priority) return "bg-gray-100 text-gray-600";
        
        switch (ticketData.priority.toLowerCase()) {
            case "critical":
                return "bg-red-100 text-red-700";
            case "high":
                return "bg-orange-100 text-orange-700";
            case "medium":
                return "bg-yellow-100 text-yellow-700";
            case "low":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    const getImpactColor = () => {
        const impact = formatImpact(ticketData.impact);
        
        switch (impact.toLowerCase()) {
            case "high":
                return "bg-red-100 text-red-700";
            case "medium":
                return "bg-yellow-100 text-yellow-700";
            case "low":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200">
            <div className="flex-1">
                <div className="flex items-center">
                    <FileText className="text-blue-600 mr-2" size={24} />
                    <h1 className="text-2xl font-bold text-gray-800">
                        {ticketData.summary || "Ticket Details"}
                    </h1>
                </div>
                <div className="flex items-center mt-2 text-gray-500">
                    <span className="mr-4">ID: {ticketData.ticket_id}</span>
                    {ticketData.issue_type && (
                        <span className="mr-4">Type: {ticketData.issue_type}</span>
                    )}
                    {ticketData.created_by && (
                        <span>Created by: {ticketData.created_by}</span>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                {ticketData.priority && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor()}`}>
                        {ticketData.priority}
                    </span>
                )}
                
                {ticketData.impact && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImpactColor()}`}>
                        Impact: {formatImpact(ticketData.impact)}
                    </span>
                )}
                
                {ticketData.status && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        ticketData.status === "Open" ? "bg-blue-100 text-blue-700" :
                        ticketData.status === "Working in Progress" ? "bg-indigo-100 text-indigo-700" :
                        ticketData.status === "Waiting for User" ? "bg-purple-100 text-purple-700" :
                        ticketData.status === "Resolved" ? "bg-green-100 text-green-700" :
                        ticketData.status === "Closed" ? "bg-gray-100 text-gray-700" :
                        "bg-orange-100 text-orange-700"
                    }`}>
                        {ticketData.status}
                    </span>
                )}
            </div>
        </div>
    );
}