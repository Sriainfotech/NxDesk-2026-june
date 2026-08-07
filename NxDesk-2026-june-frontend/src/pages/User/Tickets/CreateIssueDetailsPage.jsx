"use client";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatUI from "../../../pages/ResolveIssue/ChatUI";
import ResolutionInfo from "../../../pages/ResolutionInfo";

import { Search, ChevronLeft, Paperclip, Clock } from "lucide-react";

import Sidebar from "../../../components/Sidebar";
import ChatbotPopup from "../../../components/ChatBot";
import { axiosInstance } from "../../../utils/axiosInstance";

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("Details");
  const [activityLog, setActivityLog] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [relatedRecords, setRelatedRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [attachments, setAttachments] = useState([]);
  const [customerVisible, setCustomerVisible] = useState([]);
  // Fetch ticket details
  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `ticket/tickets/${ticketId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        setTicket(response.data);

        // Mock activity log based on the ticket data
        if (response.data) {
          setActivityLog([
            {
              user: response.data.created_by || "System User",
              timestamp: new Date(response.data.created_at).toLocaleString(),
              type: "Issue Creation",
              changes: [
                { field: "Issue Number", value: response.data.ticket_id },
                { field: "Created by", value: response.data.created_by },
              ],
            },
          ]);

          // Mock related records if reference tickets exist
          if (
            response.data.reference_tickets &&
            response.data.reference_tickets.length > 0
          ) {
            const mockRelated = response.data.reference_tickets.map((ref) => ({
              id: ref,
              type: Math.random() > 0.5 ? "Incident" : "Problem",
              summary: `Related to ${
                response.data.summary?.substring(0, 25) || "issue"
              }`,
            }));
            setRelatedRecords(mockRelated);
          }

          // Mock history data
          const mockHistory = [
            {
              id: 1,
              type: "Create Ticket",
              timestamp: new Date(response.data.created_at).toLocaleString(),
              user: response.data.created_by || "System User",
              changes: [
                {
                  field: "Priority",
                  originalValue: "",
                  newValue: response.data.priority,
                },
                { field: "Status", originalValue: "", newValue: "Open" },
                {
                  field: "Summary",
                  originalValue: "",
                  newValue: response.data.summary,
                },
              ],
            },
            {
              id: 2,
              type: "Update Ticket",
              timestamp: new Date(
                new Date(response.data.created_at).getTime() + 86400000
              ).toLocaleString(),
              user: response.data.assignee || "Support Agent",
              changes: [
                {
                  field: "Status",
                  originalValue: "open",
                  newValue: "In Progress",
                },
                {
                  field: "Assignee",
                  originalValue: "",
                  newValue: response.data.assignee,
                },
              ],
            },
            {
              id: 3,
              type: "Automation Rule Triggered",
              timestamp: new Date(
                new Date(response.data.created_at).getTime() + 172800000
              ).toLocaleString(),
              user: "System",
              changes: [
                {
                  field: "Solution Group",
                  originalValue: "",
                  newValue: response.data.solution_grp,
                },
              ],
            },
          ];
          setHistoryData(mockHistory);
        }
      } catch (error) {
        console.error("Error fetching ticket details:", error);
        toast.error("Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!ticketId) return;

      try {
        const response = await axiosInstance.get("ticket/attachments/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          params: { ticket: ticketId },
        });

        // Filter attachments for the current ticket
        const ticketAttachments = response.data.filter(
          (attachment) => attachment.ticket === ticket?.ticket_id
        );

        setAttachments(ticketAttachments);
      } catch (error) {
        console.error("Error fetching attachments:", error);
        toast.error("Failed to load attachments");
      }
    };

    if (ticket) {
      fetchAttachments();
    }
  }, [ticket, ticketId]);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const addNote = () => {
    if (!newNote.trim()) return;

    setActivityLog([
      {
        user: ticket?.created_by || "Current User",
        timestamp: new Date().toLocaleString(),
        type: "Work Note",
        changes: [{ field: "Note", value: newNote }],
      },
      ...activityLog,
    ]);

    setNewNote("");
    toast.success("Note added successfully");
  };

  // Filter history records
  const getFilteredHistory = () => {
    if (historyFilter === "all") return historyData;
    return historyData.filter((item) =>
      item.type.toLowerCase().includes(historyFilter.toLowerCase())
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div
          className={`fixed md:static top-0 left-0 h-full z-30 transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <Sidebar />
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-xl font-semibold">Loading ticket details...</div>
        </div>
      </div>
    );
  }

  // Helper function to render read-only field
  const renderField = (label, value, additionalClasses = "") => {
    const displayValue = value || "N/A";
    const fieldClasses = `border rounded px-3 py-2 w-64 bg-gray-50 text-gray-700 ${
      !value ? "italic text-gray-400" : ""
    } ${additionalClasses}`;

    return (
      <div className="flex items-center mb-3">
        <label className="w-44 text-gray-600 font-medium">{label}</label>
        <div className={fieldClasses}>{displayValue}</div>
      </div>
    );
  };

  // Helper function to determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-yellow-100 border-yellow-300";
      case "Closed":
        return "bg-gray-100 border-gray-300";
      case "Resolved":
        return "bg-green-100 border-green-300";
      case "In Progress":
        return "bg-blue-100 border-blue-300";
      default:
        return "bg-gray-50";
    }
  };

  // Helper function to determine priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 border-red-300 font-medium";
      case "High":
        return "bg-orange-100 border-orange-300 font-medium";
      case "Medium":
        return "bg-yellow-100 border-yellow-300";
      case "Low":
        return "bg-green-100 border-green-300";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <div
        className={`fixed md:static top-0 left-0 h-full z-30 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1">
        {/* Sub Header */}
        <div className="bg-white border-b flex items-center justify-between p-3 shadow-sm">
          <div className="flex items-center">
            <button
              className="p-1 border rounded mr-3 hover:bg-gray-100"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-2 text-gray-500">≡</span>
            <div>
              <div className="font-bold text-lg"></div>
              <div className="text-gray-600 text-sm">{ticket?.ticket_id}</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Ticket Details Grid */}
          <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-3">
                {renderField("Number", ticket?.ticket_id)}
                {renderField("Requestor", ticket?.created_by)}
                {renderField("Project", ticket?.project)}
                {renderField("Issue Type", ticket?.issue_type)}

                {renderField("Impact", ticket?.impact)}

                <div className="flex items-center mb-3">
                  <label className="w-44 text-gray-600 font-medium">
                    Status
                  </label>
                  <div
                    className={`border rounded px-3 py-2 w-64 ${getStatusColor(
                      ticket?.status
                    )}`}
                  >
                    {ticket?.status || "N/A"}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="flex items-center mb-3">
                  <label className="w-44 text-gray-600 font-medium">
                    Priority
                  </label>
                  <div
                    className={`border rounded px-3 py-2 w-64 ${getPriorityColor(
                      ticket?.priority
                    )}`}
                  >
                    {ticket?.priority || "N/A"}
                  </div>
                </div>

                {renderField("Product", ticket.product)}
                {renderField("Assignee", ticket?.assignee)}
                {renderField("Solution Group", ticket?.solution_grp)}
                {renderField("Organization", ticket?.developer_organization)}
                {renderField(
                  "Created On",
                  ticket?.created_at
                    ? new Date(ticket.created_at).toLocaleString()
                    : null
                )}
              </div>
            </div>

            {/* Reference Ticket */}
            {ticket?.reference_tickets &&
              ticket.reference_tickets.length > 0 && (
                <div className="flex items-center mt-4">
                  <label className="w-44 text-gray-600 font-medium">
                    Reference Ticket
                  </label>
                  <div className="border rounded px-3 py-2 w-64 bg-gray-50">
                    {ticket.reference_tickets.join(", ")}
                  </div>
                </div>
              )}

            {/* Full-width fields */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center">
                <label className="w-44 text-gray-600 font-medium">
                  Summary
                </label>
                <div className="border rounded px-3 py-2 flex-1 bg-gray-50 min-h-[42px]">
                  {ticket?.summary || "No summary provided"}
                </div>
              </div>

              <div className="flex">
                <label className="w-44 text-gray-600 font-medium pt-3">
                  Description
                </label>
                <div
                  className="border rounded px-3 py-2 flex-1 bg-gray-50 min-h-[120px]"
                  dangerouslySetInnerHTML={{
                    __html: ticket?.description || "No description provided",
                  }}
                ></div>
              </div>
            </div>
          </div>
          {/* Tabs Section */}
          <div className="mt-4 border-b">
            <div className="flex">
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === "Details"
                    ? "bg-green-100 border-t border-l border-r text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentTab("Details")}
              >
                Details
              </button>
              {/* <button
                className={`px-4 py-2 font-medium ${currentTab === "Notes" ? "bg-green-100 border-t border-l border-r text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                onClick={() => setCurrentTab("Notes")}
              >
                Notes
              </button> */}
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === "Chat"
                    ? "bg-green-100 border-t border-l border-r text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentTab("Chat")}
              >
                Chat
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === "History"
                    ? "bg-green-100 border-t border-l border-r text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentTab("History")}
              >
                History
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === "RelatedRecords"
                    ? "bg-green-100 border-t border-l border-r text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentTab("RelatedRecords")}
              >
                Related Records
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  currentTab === "ResolutionInfo"
                    ? "bg-green-100 border-t border-l border-r text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setCurrentTab("ResolutionInfo")}
              >
                Resolution Info
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 border-x border-b bg-white">
            {currentTab === "Details" && (
              <div className="space-y-4">
                <h3 className="font-medium text-lg mb-4">Additional Details</h3>

                {renderField("Created By", ticket?.created_by)}
                {renderField(
                  "Created At",
                  ticket?.created_at
                    ? new Date(ticket.created_at).toLocaleString()
                    : null
                )}
                {renderField("Modified By", ticket?.modified_by)}
                {renderField(
                  "Modified At",
                  ticket?.modified_at
                    ? new Date(ticket.modified_at).toLocaleString()
                    : null
                )}
                {renderField("Customer Country", ticket?.customer_country)}
              </div>
            )}

            {currentTab === "Notes" && (
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="flex shadow-sm rounded-md overflow-hidden">
                    <div className="w-24 p-2 bg-gray-100 border-l border-t border-b font-medium text-gray-700 flex items-center">
                      Work notes
                    </div>
                    <input
                      type="text"
                      placeholder="Add work notes"
                      className="border flex-1 p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button
                      className="bg-gray-100 border-t border-r border-b p-2 hover:bg-gray-200 transition-colors"
                      onClick={addNote}
                    >
                      📝
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex justify-end items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={customerVisible}
                    onChange={(e) => setCustomerVisible(e.target.checked)}
                    id="customerVisible"
                  />
                  <label
                    htmlFor="customerVisible"
                    className="text-gray-700 cursor-pointer"
                  >
                    Additional comments (Customer visible)
                  </label>
                  <button
                    className="bg-blue-500 text-white rounded px-4 py-1 ml-2 hover:bg-blue-600 transition-colors"
                    onClick={addNote}
                  >
                    Post
                  </button>
                </div>

                {/* Activity Log */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3 sticky top-0 bg-white p-2 z-10 border-b">
                    <div className="font-medium">
                      Activities: {activityLog?.length || 0}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Search activities..."
                        className="border rounded p-1 mr-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button className="p-1 border rounded hover:bg-gray-100">
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  {activityLog && activityLog.length > 0 ? (
                    <div className="space-y-4">
                      {activityLog.map((activity, index) => (
                        <div
                          key={index}
                          className="border p-3 my-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                              👤
                            </div>
                            <div className="ml-2">
                              <div className="font-medium">{activity.user}</div>
                            </div>
                            <div className="ml-auto flex items-center text-sm text-gray-600">
                              <span className="font-medium">
                                {activity.type}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{activity.timestamp}</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-2">
                            {activity.changes &&
                              activity.changes.map((change, changeIndex) => (
                                <div
                                  key={changeIndex}
                                  className="flex justify-between py-1 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="text-right w-1/3 text-gray-600 font-medium">
                                    {change.field}:
                                  </div>
                                  <div className="w-2/3 pl-4">
                                    {change.value}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No activity records found
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "Chat" && <ChatUI />}

            {currentTab === "History" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">Ticket History</h3>
                  <div className="flex items-center">
                    <label className="mr-2 text-gray-600">Filter:</label>
                    <select
                      className="border rounded px-2 py-1"
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                    >
                      <option value="all">All Changes</option>
                      <option value="create">Create</option>
                      <option value="update">Updates</option>
                      <option value="automation">Automation</option>
                    </select>

                    <button className="ml-2 p-1 border rounded hover:bg-gray-100">
                      <Clock size={16} />
                    </button>
                  </div>
                </div>

                <div className="border-t mt-2">
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : getFilteredHistory().length > 0 ? (
                    getFilteredHistory().map((item) => (
                      <div key={item.id} className="py-3 border-b">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                            {item.type.includes("Automation") ? (
                              <span className="text-xs">⚙️</span>
                            ) : item.type.includes("Create") ? (
                              <span className="text-xs">➕</span>
                            ) : item.type.includes("Update") ? (
                              <span className="text-xs">✏️</span>
                            ) : (
                              <span className="text-xs">📝</span>
                            )}
                          </div>
                          <span className="font-medium">{item.type}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            - {item.timestamp}
                          </span>
                          <span className="text-gray-500 text-sm ml-auto">
                            by {item.user}
                          </span>
                        </div>

                        {item.changes.length > 0 && (
                          <div className="ml-8">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left py-1 px-2 w-1/3">
                                    Field
                                  </th>
                                  <th className="text-left py-1 px-2 w-1/3">
                                    Original Value
                                  </th>
                                  <th className="text-left py-1 px-2 w-1/3">
                                    New Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.changes.map((change, index) => (
                                  <tr key={index} className="hover:bg-gray-100">
                                    <td className="py-1 px-2">
                                      {change.field}
                                    </td>
                                    <td className="py-1 px-2">
                                      {change.originalValue}
                                    </td>
                                    <td className="py-1 px-2">
                                      {change.newValue}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No history records found
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "RelatedRecords" && (
              <div className="p-2">
                {/* <div className="mb-6">
                  <h3 className="font-medium text-lg mb-3">Related Records</h3>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex space-x-2">
                      <button className="border rounded px-3 py-1 text-sm hover:bg-gray-100">Add Existing</button>
                      <button className="border rounded px-3 py-1 text-sm hover:bg-gray-100">Create New</button>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Search related records"
                        className="border rounded px-3 py-1 text-sm"
                      />
                      <button className="ml-1 border rounded p-1 hover:bg-gray-100">
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  {relatedRecords.length > 0 ? (
                    <table className="w-full border">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2 text-left">Number</th>
                          <th className="border p-2 text-left">Type</th>
                          <th className="border p-2 text-left">Summary</th>
                          <th className="border p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedRecords.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border p-2 font-medium text-blue-600">{record.id}</td>
                            <td className="border p-2">{record.type}</td>
                            <td className="border p-2">{record.summary}</td>
                            <td className="border p-2">
                              <button className="text-blue-500 hover:underline mr-3">View</button>
                              <button className="text-red-500 hover:underline">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-gray-500 text-center p-6 border rounded bg-gray-50">No related records found</div>
                  )}
                </div> */}

                {/* <div className="mb-6">
                  <h3 className="font-medium text-lg mb-3">Reference Tickets</h3>

                  {ticket?.reference_tickets && ticket.reference_tickets.length > 0 ? (
                    <ul className="border rounded p-3 bg-gray-50">
                      {ticket.reference_tickets.map((refTicket, index) => (
                        <li key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <span className="font-medium text-blue-600">{refTicket}</span>
                          <button className="text-red-500 hover:text-red-700">✕</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 text-center p-6 border rounded bg-gray-50">No reference tickets added</div>
                  )}
                </div> */}

                {/* Attachments Section */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-lg">Attachments</h3>

                    {/* <button className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">
                      <Paperclip size={16} className="mr-1" />
                      <span>Upload File</span>
                      
                    </button> */}
                  </div>

                  <div className="border rounded">
                    {/* Attachments Table */}
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border-b p-2 text-left">File</th>
                          <th className="border-b p-2 text-left">
                            Uploaded At
                          </th>
                          <th className="border-b p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* We'll fetch attachments in useEffect */}
                        {attachments && attachments.length > 0 ? (
                          attachments.map((attachment) => (
                            <tr
                              key={attachment.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="border-b p-2">
                                <a
                                  href={attachment.file_url}
                                  className="flex items-center text-blue-600 hover:underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Paperclip size={16} className="mr-2" />
                                  {/* {attachment.file_url}(
                                  {attachment.file_url.split('/').pop()}||" ") */}
                                </a>
                              </td>
                              <td className="border-b p-2">
                                {new Date(
                                  attachment.uploaded_at
                                ).toLocaleString()}
                              </td>
                              <td className="border-b p-2">
                                <div className="flex space-x-2">
                                  <button
                                    className="text-blue-500 hover:underline"
                                    onClick={() =>
                                      window.open(attachment.file_url, "_blank")
                                    }
                                  >
                                    View
                                  </button>
                                  {/* <button className="text-red-500 hover:underline">
                                    Delete
                                  </button> */}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="p-4 text-center text-gray-500"
                            >
                              No attachments found for this ticket
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentTab === "ResolutionInfo" && <ResolutionInfo />}
          </div>
        </div>

        {/* Toast Container and Chatbot */}
        <ChatbotPopup />
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
    </div>
  );
}
