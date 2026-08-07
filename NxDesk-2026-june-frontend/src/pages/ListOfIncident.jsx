import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  ArrowRight,
  ChevronsUp,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  User,
  Building,
  Tag,
  FileText,
} from "lucide-react";
import ChatbotPopup from "../components/ChatBot";
import { axiosInstance } from "../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../utils/formatDate";

const IncidentTrackingSystem = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [slaData, setSlaData] = useState({});
  const [slaTimers, setSlaTimers] = useState({});

  const [statusChoices, setStatusChoices] = useState([]);
  const [priorityChoices, setPriorityChoices] = useState([]);
  const [impactChoices, setImpactChoices] = useState([]);

  const navigate = useNavigate();

  // Color mapping based on provided specifications
  const statusColors = {
    Open: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    "In Progress": {
      bg: "bg-orange-50",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    "Waiting for User Response": {
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    Resolved: {
      bg: "bg-green-50",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    Delegate: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  };

  const priorityColors = {
    Critical: { bg: "bg-red-50", text: "text-red-700", icon: "🔴" },
    High: { bg: "bg-orange-50", text: "text-orange-700", icon: "🟠" },
    Medium: { bg: "bg-yellow-50", text: "text-yellow-700", icon: "🟡" },
    Low: { bg: "bg-green-50", text: "text-green-700", icon: "🟢" },
  };

  const impactColors = {
    High: { bg: "bg-red-50", text: "text-red-700" },
    Medium: { bg: "bg-yellow-50", text: "text-yellow-700" },
    Low: { bg: "bg-green-50", text: "text-green-700" },
  };

  // Simplified status choices
  const allowedStatuses = [
    ["Open", "Open"],
    ['Working in Progress', 'Working in Progress'],
    ["Waiting for User Response", "Waiting for User Response"],
    ["Resolved", "Resolved"],
    ["Delegate", "Delegate"],
  ];

  const fetchChoices = async () => {
    try {
      const response = await axiosInstance.get(`ticket/ticket/choices/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      setStatusChoices(allowedStatuses);
      setPriorityChoices(response.data.priority_choices || []);
      setImpactChoices(response.data.impact_choices || []);
    } catch (error) {
      console.error("Error fetching choices:", error);
      setStatusChoices(allowedStatuses);
      setPriorityChoices([
        { priority_id: 22, urgency_name: "Critical" },
        { priority_id: 23, urgency_name: "High" },
        { priority_id: 24, urgency_name: "Medium" },
        { priority_id: 25, urgency_name: "Low" },
      ]);
    }
  };

  const fetchSlaData = async (ticketId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axiosInstance.get(
        `/ticket/sla-timers/${ticketId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching SLA data for ticket ${ticketId}:`, error);
      return null;
    }
  };

  const calculateTimeRemaining = (dueDate) => {
    if (!dueDate) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };

    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;

    if (diffMs <= 0)
      return {
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        breached: true,
      };

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds, totalSeconds, breached: false };
  };

  const formatTimeRemaining = (timeObj) => {
    if (timeObj.breached) return "SLA Breached";
    return `${timeObj.hours}h ${timeObj.minutes}m ${timeObj.seconds}s`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};

      Object.keys(slaData).forEach((ticketId) => {
        const data = slaData[ticketId];
        if (data && data.sla_timer && data.sla_timer.sla_due_date) {
          updatedTimers[ticketId] = calculateTimeRemaining(
            data.sla_timer.sla_due_date
          );
        }
      });

      setSlaTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [slaData]);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await axiosInstance.get(
          "ticket/all/?limit=100&offset=0",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const enhancedData = response.data.results.all_tickets.map(
          (incident) => ({
            ...incident,
            priority:
              incident.priority ||
              ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
            assignee:
              incident.assignee ||
              ["John Doe", "Jane Smith", "Alex Wilson"][
                Math.floor(Math.random() * 3)
              ],
            impact:
              incident.impact ||
              ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
          })
        );

// Sort incidents by created_at in descending order (most recent first)
const sortedIncidents = enhancedData.sort((a, b) => 
  new Date(b.created_at) - new Date(a.created_at)
);
setIncidents(sortedIncidents);

        // const slaPromises = enhancedData.map((incident) =>
        //   fetchSlaData(incident.ticket_id)
        // );
        // const slaResults = await Promise.all(slaPromises);

        // const newSlaData = {};
        // slaResults.forEach((data, index) => {
        //   if (data) {
        //     newSlaData[enhancedData[index].ticket_id] = { sla_timer: data };
        //   }
        // });

        // setSlaData(newSlaData);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChoices();
    fetchIncidents();
  }, []);

  const getStatusStyling = (status) => {
    return (
      statusColors[status] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
      }
    );
  };

  const getPriorityStyling = (priority) => {
    return (
      priorityColors[priority] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
      }
    );
  };

  const getImpactStyling = (impact) => {
    return impactColors[impact] || { bg: "bg-gray-50", text: "text-gray-700" };
  };

  // Helper functions for counting tickets by status
  const getTotalTickets = () => filteredIncidents.length;

  const getTicketsByStatus = (status) => {
    return filteredIncidents.filter((incident) => incident.status === status)
      .length;
  };


  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.ticket_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || incident.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleIncidentClick = (incident) => {
    navigate(
      `/request-issue/application-support/sap/resolve-issue/${incident.ticket_id}`
    );
  };

  const handleClick = () => {
    navigate("/request-issue/");
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="bg-white border-b px-6 py-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Incident Management
            </h1>
            <button
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              onClick={handleClick}
            >
              <AlertCircle size={14} />
              New Incident
            </button>
          </div>
        </div>

        {/* Compact Search and Filter Bar */}
        <div className="bg-white border-b-neutral-50 px-6 py-4 pb-0 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search incidents..."
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              {allowedStatuses.map(([value, label]) => (
                <option key={value} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white border-b px-6 py-2 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-3 text-xs font-medium">
              <span className="px-2 py-1 bg-white border rounded shadow-sm">
                Total: {getTotalTickets()}
                {searchTerm && " (filtered)"}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm">
                Open: {getTicketsByStatus("Open")}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm">
                In Progress: {getTicketsByStatus("Working in Progress")}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm">
                Waiting for User:{" "}
                {getTicketsByStatus("Waiting for User Response")}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm">
                Resolved: {getTicketsByStatus("Resolved")}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm">
                Delegate: {getTicketsByStatus("Delegated")}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No incidents found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredIncidents.map((incident) => {
                  const statusStyle = getStatusStyling(incident.status);
                  const priorityStyle = getPriorityStyling(incident.priority);
                  const impactStyle = getImpactStyling(incident.impact);

                  return (
                    <div
                      key={incident.ticket_id}
                      className="bg-white border border-gray-100 hover:shadow-sm p-3"
                      onClick={() => handleIncidentClick(incident)}
                    >
                      {/* Main Content Row */}
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Side - Summary and ID */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs text-gray-500 font-medium px-1.5 py-0.5 cursor-pointer hover:text-blue-600">
  {incident.ticket_id}
</span>
                            <h3 className="text-sm text-gray-900 font-medium">
                              {incident.summary}
                            </h3>
                          </div>

                          {/* First Info Row */}
                          {/* <div className="flex items-center gap-4 text-xs text-gray-600 mb-1">
                            <div className="flex items-center gap-1">
                              <Building size={12} />
                              <span>{incident.service_domain}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tag size={12} />
                              <span>{incident.service_type}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={12} />
                              <span>
                                Requestor: {incident.created_by || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={12} />
                              <span className="font-medium">
                                {incident.assignee || "Unassigned"}
                              </span>
                            </div>

                            {incident.solution_group && (
                              <div className="flex items-center gap-1">
                                <Tag size={12} />
                                <span>Group: {incident.solution_group}</span>
                              </div>
                            )}
                            {incident.project && (
                              <div className="flex items-center gap-1">
                                <FileText size={12} />
                                <span>Project: {incident.project}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>{formatDate(incident.created_at)}</span>
                            </div>
                          </div> */}
                        </div>

                        {/* Right Side - Status, Priority, Impact in same line */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {incident.status}
                          </span>

                          {/* Priority Badge */}
                          {/* <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${priorityStyle.bg} ${priorityStyle.text}`}
                          >
                            {incident.priority}
                          </span> */}

                          {/* Impact Badge */}
                          {/* <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${impactStyle.bg} ${impactStyle.text}`}
                          >
                            {incident.impact} Impact
                          </span> */}

                          {/* Action Arrow */}
                          <ExternalLink
                            size={14}
                            className="text-gray-400 ml-2"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatbotPopup />
    </div>
  );
};

export default IncidentTrackingSystem;
