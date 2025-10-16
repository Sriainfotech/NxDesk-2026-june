import React from "react";
import RichTextViewer from "../common/RichTextViewer";
import { Tag, Clock, User, Box, FileText, Bookmark, Flag, Activity } from "lucide-react";

export default function TicketDetails({ ticket, ticketFields }) {
  // Group fields by category for better organization
  const groupedFields = {
    "Basic Information": ["ticket_id", "summary", "description"],
    "Status Information": ["status", "priority", "impact", "issue_type"],
    "Team & Assignment": ["assignee", "support_team", "solution_grp"],
    "Project Details": ["project", "product", "developer_organization"],
    "Customer Information": ["customer_number", "customer_country", "contact_mode"],
    "References": ["reference_tickets"],
    "Metadata": ["created_by", "modified_by", "created_at", "modified_at"]
  };

  // Map field keys to icons
  const fieldIcons = {
    ticket_id: <Tag className="w-4 h-4" />,
    status: <Activity className="w-4 h-4" />,
    priority: <Flag className="w-4 h-4" />,
    assignee: <User className="w-4 h-4" />,
    created_at: <Clock className="w-4 h-4" />,
    modified_at: <Clock className="w-4 h-4" />,
    project: <Box className="w-4 h-4" />,
    description: <FileText className="w-4 h-4" />,
    reference_tickets: <Bookmark className="w-4 h-4" />
  };

  const getFieldLabel = (key) => {
    const field = ticketFields.find(f => f.key === key);
    return field ? field.label : key;
  };
  
  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([category, keys]) => (
        <div key={category} className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {keys.map(key => {
              const label = getFieldLabel(key);
              const value = ticket?.[key];
              const icon = fieldIcons[key];
              
              return (
                <div key={key} className="bg-white rounded-md p-3 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    {icon || <div className="w-4 h-4" />}
                    <h3 className="font-medium text-sm">{label}</h3>
                  </div>
                  <div className="mt-1 pl-6">
                    {key === "description" ? (
                      <div className="prose prose-sm max-w-none">
                        <RichTextViewer content={value || ""} />
                      </div>
                    ) : (
                      <span className="text-gray-800">
                        {Array.isArray(value)
                          ? value.length > 0
                            ? value.join(", ")
                            : "None"
                          : value || "N/A"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}