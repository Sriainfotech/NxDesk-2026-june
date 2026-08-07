import { User, Tag, Building, Clipboard,AlertCircle, FileText, Calendar, Flag, PhoneCall } from "lucide-react";

export default function TicketInfoSection({ ticketData, formatDate, formatImpact }) {
    if (!ticketData) return null;

    const infoItems = [
        { 
            icon: <Clipboard size={18} className="text-blue-600" />, 
            label: "Ticket ID", 
            value: ticketData.ticket_id 
        },
        { 
            icon: <Tag size={18} className="text-blue-600" />, 
            label: "Issue Type", 
            value: ticketData.issue_type 
        },
        { 
            icon: <Building size={18} className="text-blue-600" />, 
            label: "Project", 
            value: ticketData.project 
        },
        { 
            icon: <User size={18} className="text-blue-600" />, 
            label: "Assignee", 
            value: ticketData.assignee || "Unassigned" 
        },
        { 
            icon: <FileText size={18} className="text-blue-600" />, 
            label: "Product", 
            value: ticketData.product 
        },
        { 
            icon: <Flag size={18} className="text-blue-600" />, 
            label: "Priority", 
            value: ticketData.priority,
            className: 
                ticketData.priority === "Critical" ? "text-red-600 font-medium" : 
                ticketData.priority === "High" ? "text-orange-600 font-medium" : 
                ticketData.priority === "Medium" ? "text-yellow-600 font-medium" : 
                "text-green-600 font-medium"
        },
        { 
            icon: <AlertCircle size={18} className="text-blue-600" />, 
            label: "Impact", 
            value: formatImpact(ticketData.impact),
            className: 
                formatImpact(ticketData.impact) === "High" ? "text-red-600 font-medium" : 
                formatImpact(ticketData.impact) === "Medium" ? "text-yellow-600 font-medium" : 
                "text-green-600 font-medium"
        },
        { 
            icon: <PhoneCall size={18} className="text-blue-600" />, 
            label: "Contact Mode", 
            value: ticketData.contact_mode 
        },
        { 
            icon: <Calendar size={18} className="text-blue-600" />, 
            label: "Created At", 
            value: formatDate(ticketData.created_at) 
        },
        { 
            icon: <Calendar size={18} className="text-blue-600" />, 
            label: "Modified At", 
            value: formatDate(ticketData.modified_at) 
        },
    ];

    return (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-bold text-xl mb-4 text-gray-800 flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Ticket Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {infoItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                        <div className="flex items-center gap-2 mb-1 text-gray-500 font-medium">
                            {item.icon}
                            {item.label}
                        </div>
                        <div className={`ml-6 font-semibold ${item.className || "text-gray-800"}`}>
                            {item.value || "N/A"}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}