import { useState, useEffect } from "react";
import { axiosInstance } from "../../../utils/axiosInstance";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function AssignmentModal({
  isOpen,
  onClose,
  ticket,
  onAssignmentSuccess,
}) {
  const navigate = useNavigate();
  const [supportStaff, setSupportStaff] = useState([]);
  const [solutionGroups, setSolutionGroups] = useState([]);
   const [roleBasedAssignee, setRoleBasedAssignee] = useState([]);
  const [assignmentType, setAssignmentType] = useState("dispatcher");
  const [assignmentData, setAssignmentData] = useState({
    assigneeId: "",
    solutionGroupId: "",
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const userProfile = useSelector((state) => state.userProfile.user);
  const accessToken = localStorage.getItem("access_token");

  useEffect(() => {
    if (isOpen) {
      fetchSupportData();
      resetAssignmentData();
    }
  }, [isOpen]);

  const resetAssignmentData = () => {
    setAssignmentData({
      assigneeId: "",
      solutionGroupId: "",
    });
    setAssignmentType("dispatcher");
  };

  const fetchSupportData = async () => {
    setDataLoading(true);
    try {
      const [staffRes, solutionsRes,userRole] = await Promise.all([
        axiosInstance.get("/user/api/assignee/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axiosInstance.get("/solution_grp/create/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axiosInstance.get("roles/user_role/",{
          headers: { Authorization: `Bearer ${accessToken}` },
        
        })
      ]);
      setRoleBasedAssignee(userRole.data || []);
         // Filter developers from role-based data
const developers = (userRole.data || []).filter(
  (user) => user.role && user.role.toLowerCase() === "developer"
);

console.log("developers ar", developers)
// If we have role-based developers, merge with staff data to get employee_id
if (developers.length > 0) {
  const staffData = staffRes.data || [];
  const developersWithEmployeeId = developers.map(developer => {
    // Find matching staff member by username
    const matchingStaff = staffData.find(staff => staff.username === developer.user);
    return {
      ...developer,
      id: matchingStaff?.employee_id || developer.user_role_id, // Use employee_id if found, fallback to user_role_id
      employee_id: matchingStaff?.employee_id,
      username: developer.user // Map user field to username for consistency
    };
  });
  setSupportStaff(developersWithEmployeeId);
} else {
  // Fallback to original assignee API data
  setSupportStaff(staffRes.data || []);
}
      setSolutionGroups(solutionsRes.data || []);
    } catch (error) {
      console.error("Error fetching support data:", error);
      toast.error("Failed to load support data");
      setSupportStaff([]);
      setSolutionGroups([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    setAssignmentData({
      assigneeId: "",
      solutionGroupId: "",
    });
  };

  const handleAssigneeChange = (e) => {
    setAssignmentData((prev) => ({
      ...prev,
      assigneeId: e.target.value,
    }));
  };

  const handleSolutionGroupChange = (e) => {
    setAssignmentData((prev) => ({
      ...prev,
      solutionGroupId: e.target.value,
    }));
  };

  const handleAssignTicket = async (e) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    if (assignmentType === "direct") {
      if (!assignmentData.assigneeId) {
        toast.error("Assignee is required");
        return;
      }
      if (!assignmentData.solutionGroupId) {
        toast.error("Solution group is required");
        return;
      }
    }

    setAssignLoading(true);

    try {
      let requestData;

      if (assignmentType === "dispatcher") {
        requestData = {
          assignee: "",
          developer_organization: "",
          solution_grp: "",
          status: "Delegated",
        };
      } else {
        requestData = {
          assignee: parseInt(assignmentData.assigneeId),
          solution_grp: parseInt(assignmentData.solutionGroupId),
          status: "Delegated",
        };
      }

      const response = await axiosInstance.put(
        `/ticket/tickets/${ticket.ticket_id}/`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const successMessage =
        assignmentType === "dispatcher"
          ? `Ticket ${ticket.ticket_id} routed to dispatcher. Redirecting to home page...`
          : `Ticket ${ticket.ticket_id} assigned successfully. Redirecting to home page...`;

      toast.success(successMessage);

      if (onAssignmentSuccess) {
        onAssignmentSuccess(response.data);
      }

      onClose();
      setTimeout(() => {
        navigate("/", { replace: true }); // This replaces the current entry in history
      }, 3000);
    } catch (error) {
      console.error("Assignment error:", error);
      const errorMessage =
        assignmentType === "dispatcher"
          ? "Failed to route ticket"
          : "Assignment failed";
      toast.error(errorMessage);
    } finally {
      setAssignLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return "text-gray-600 bg-gray-100";
    const p = priority.toLowerCase();
    if (p === "critical") return "text-red-700 bg-red-100 border-red-200";
    if (p === "high") return "text-orange-700 bg-orange-100 border-orange-200";
    if (p === "medium")
      return "text-yellow-700 bg-yellow-100 border-yellow-200";
    return "text-green-700 bg-green-100 border-green-200";
  };

  const getImpactColor = (impact) => {
    if (!impact) return "text-gray-600 bg-gray-100";
    const i = impact.toLowerCase();
    if (i === "critical") return "text-red-700 bg-red-100 border-red-200";
    if (i === "high") return "text-orange-700 bg-orange-100 border-orange-200";
    if (i === "medium")
      return "text-yellow-700 bg-yellow-100 border-yellow-200";
    return "text-green-700 bg-green-100 border-green-200";
  };

  const getStatusColor = (status) => {
    if (!status) return "text-gray-600 bg-gray-100";
    const s = status.toLowerCase();
    if (s === "open") return "text-blue-700 bg-blue-100 border-blue-200";
    if (s === "working in progress")
      return "text-orange-700 bg-orange-100 border-orange-200";
    if (s === "waiting for user response")
      return "text-purple-700 bg-purple-100 border-purple-200";
    if (s === "resolved") return "text-green-700 bg-green-100 border-green-200";
    if (s === "closed") return "text-gray-700 bg-gray-100 border-gray-200";
    if (s === "breached") return "text-red-700 bg-red-100 border-red-200";
    if (s === "canceled") return "text-slate-700 bg-slate-100 border-slate-200";
    if (s === "delegated")
      return "text-indigo-700 bg-indigo-100 border-indigo-200";
    return "text-gray-700 bg-gray-100 border-gray-200";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h1 className="text-lg font-semibold text-gray-900">
                Assign Ticket
              </h1>
            </div>
            <div className="text-sm font-mono text-gray-600 bg-gray-200 px-2 py-1 rounded">
              {ticket?.ticket_id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Ticket Details */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Ticket Details
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Status Row */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </label>
                  <div
                    className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      ticket?.status
                    )}`}
                  >
                    {ticket?.status}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Priority
                  </label>
                  <div
                    className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                      ticket?.priority
                    )}`}
                  >
                    {ticket?.priority}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Impact
                  </label>
                  <div
                    className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(
                      ticket?.impact
                    )}`}
                  >
                    {ticket?.impact}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Summary
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium leading-tight">
                  {ticket?.summary}
                </p>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Service Domain
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {ticket?.service_domain}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Service Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {ticket?.service_type}
                  </p>
                </div>
              </div>

              {/* Current Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Requestor
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {ticket?.created_by}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Current Assignee
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {ticket?.assignee || "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Reporter & Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Developer Organization
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {ticket?.developer_organization || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Created
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {ticket?.created_at
                      ? new Date(ticket.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {ticket?.description && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Description
                  </label>
                  <div className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded border max-h-24 overflow-y-auto">
                    <div
                      dangerouslySetInnerHTML={{ __html: ticket.description }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Assignment Form */}
          <div className="w-1/2 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Assignment Configuration
              </h2>
            </div>

            {dataLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-3"></div>
                  <p className="text-sm text-gray-600">
                    Loading assignment options...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 px-6 py-6 space-y-6">
                  {/* Assignment Type */}
                  <div>
                    <label className="text-sm font-semibold text-gray-900 mb-3 block">
                      Assignment Method
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="assignmentType"
                          value="dispatcher"
                          checked={assignmentType === "dispatcher"}
                          onChange={() =>
                            handleAssignmentTypeChange("dispatcher")
                          }
                          className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Route to Dispatcher
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Send to dispatcher queue for review and assignment
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="assignmentType"
                          value="direct"
                          checked={assignmentType === "direct"}
                          onChange={() => handleAssignmentTypeChange("direct")}
                          className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            Direct Assignment
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Assign directly to a specific team member
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Direct Assignment Fields */}
                  {assignmentType === "direct" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Assignee <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={assignmentData.assigneeId}
                          onChange={handleAssigneeChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="">Select assignee...</option>
                          {supportStaff.map((staff) => (
                            <option
                              key={staff.id || staff.employee_id}
                              value={staff.id || staff.employee_id}
                            >
                              {staff.username}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-gray-900 mb-2 block">
                          Solution Group <span className="text-red-500">*</span>
                        </label>
                        {solutionGroups.length > 0 ? (
                          <select
                            value={assignmentData.solutionGroupId}
                            onChange={handleSolutionGroupChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="">Select solution group...</option>
                            {solutionGroups.map((group) => (
                              <option
                                key={group.solution_id}
                                value={group.solution_id}
                              >
                                {group.group_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500">
                            No solution groups available
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dispatcher Info */}
                  {assignmentType === "dispatcher" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900">
                            Dispatcher Assignment
                          </h3>
                          <p className="text-xs text-blue-800 mt-1">
                            The ticket will be routed to the dispatcher queue
                            where it will be reviewed and assigned to the
                            appropriate team member and solution group based on
                            priority and expertise.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading}
                    onClick={handleAssignTicket}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {assignLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : assignmentType === "dispatcher" ? (
                      "Route to Dispatcher"
                    ) : (
                      "Assign Ticket"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
