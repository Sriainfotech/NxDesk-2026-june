import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils/axiosInstance";


const ResolutionInfo = ({ ticketId, formData, setFormData, activityLog, setActivityLog }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const resolutionChoices = [
    { id: "fixed", name: "Fixed" },
    { id: "cannot_reproduce", name: "Cannot Reproduce" },
    { id: "not_a_bug", name: "Not a Bug" },
    { id: "solved_by_workaround", name: "Solved by Workaround" },
    { id: "user_instruction_provided", name: "User Instruction Provided" },
    { id: "withdrawn_by_user", name: "Withdrawn by User" },
    { id: "no_solution_availabale", name: "No Solution Available" },
    { id: "rejected", name: "Rejected" },
    { id: "expired", name: "Expired" },
    { id: "known_error", name: "Known Error" },
    { id: "hardware_failure", name: "Hardware Failure" },
    { id: "software_failure", name: "Software Failure" },
    { id: "network_failure", name: "Network Failure" },
    { id: "implemented", name: "Implemented" },
    { id: "other", name: "Other" },
  ];
  
  const incidentChoices = [
    { id: "none", name: "None" },
    { id: "access_issues", name: "Access Issues" },
    { id: "configuration", name: "Configuration" },
    { id: "data_quality", name: "Data Quality" },
    { id: "development", name: "Development" },
    { id: "infrastructure", name: "Infrastructure" },
    { id: "missing_user_knowledge", name: "Missing User Knowledge" },
    { id: "mistake", name: "Mistake" },
    { id: "short_dump", name: "Short Dump" },
    { id: "work_flow_issue", name: "Work Flow Issue" },
    { id: "others", name: "Others" },
  ];
  
  const incidentCategoryChoices = [
    { id: "none", name: "None" },
    { id: "development_activities_needed", name: "Development Activities Needed" },
    { id: "incident_of_sr_category", name: "Incident of SR Category" },
    { id: "dependency_with_third_part_service_provider", name: "Dependency with Third Party Service Provider" },
    { id: "inappropriate_incidents", name: "Inappropriate Incidents(Incident not Reproduceable, Withdrawl Requests)" },
    { id: "other", name: "Other" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const accessToken = localStorage.getItem("access_token");
      await axiosInstance.post(
        `/resolution/resolutions/`,
        {
          ticket_id: ticketId,
          state: "Resolved",
          resolution_type: formData.resolutionCode,
          incident_based_on: formData.incidentBasedOn,
          incident_category: formData.incidentCategory,
          resolution_description: formData.resolutionNotes,
          resolution_summary: formData.resolutionSummary,
          resolved_by: formData.requestor,
          resolved_date: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      setFormData({
        ...formData,
        state: "Resolved",
        resolvedBy: formData.requestor,
        resolvedDate: new Date().toLocaleString(),
      });
      
      toast.success("Incident resolved successfully");
      setActivityLog([
        {
          user: formData.requestor,
          timestamp: new Date().toLocaleString(),
          type: "Resolution",
          changes: [
            { field: "State", value: "Resolved" },
            { field: "Resolution Code", value: formData.resolutionCode },
            { field: "Incident Type", value: formData.incidentBasedOn },
            { field: "Incident Category", value: formData.incidentCategory },
          ],
        },
        ...activityLog,
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("There was an error resolving the incident.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="font-medium text-lg mb-4">Resolution Information</h3>
      
      {formData.state === "Resolved" ? (
        <div className="space-y-4">
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Resolution Code:</div>
            <div className="w-2/3">{formData.resolutionCode}</div>
          </div>
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Incident Based On:</div>
            <div className="w-2/3">{formData.incidentBasedOn}</div>
          </div>
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Incident Category:</div>
            <div className="w-2/3">{formData.incidentCategory}</div>
          </div>
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Resolution Notes:</div>
            <div className="w-2/3 whitespace-pre-wrap">{formData.resolutionNotes}</div>
          </div>
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Resolution Summary:</div>
            <div className="w-2/3 whitespace-pre-wrap">{formData.resolutionSummary}</div>
          </div>
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Resolved By:</div>
            <div className="w-2/3">{formData.resolvedBy}</div>
          </div>
          <div className="flex">
            <div className="w-1/3 font-medium text-gray-600">Resolved Date:</div>
            <div className="w-2/3">{formData.resolvedDate}</div>
          </div>
        </div>
      ) : (
        <div>
          <form onSubmit={handleResolve}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Resolution Code:</label>
              <select
                name="resolutionCode"
                value={formData.resolutionCode || ""}
                onChange={handleInputChange}
                className="border rounded w-full px-3 py-2"
                required
              >
                <option value="">Select Resolution Code</option>
                {resolutionChoices.map((code) => (
                  <option key={code.id} value={code.id}>
                    {code.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Incident Based On:</label>
              <select
                name="incidentBasedOn"
                value={formData.incidentBasedOn || ""}
                onChange={handleInputChange}
                className="border rounded w-full px-3 py-2"
                required
              >
                <option value="">Select Incident Type</option>
                {incidentChoices.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {incident.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Incident Category:</label>
              <select
                name="incidentCategory"
                value={formData.incidentCategory || ""}
                onChange={handleInputChange}
                className="border rounded w-full px-3 py-2"
                required
              >
                <option value="">Select Incident Category</option>
                {incidentCategoryChoices.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Resolution Notes:</label>
              <textarea
                name="resolutionNotes"
                value={formData.resolutionNotes || ""}
                onChange={handleInputChange}
                className="border rounded w-full px-3 py-2 h-32"
                placeholder="Provide detailed resolution notes..."
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Resolution Summary:</label>
              <textarea
                name="resolutionSummary"
                value={formData.resolutionSummary || ""}
                onChange={handleInputChange}
                className="border rounded w-full px-3 py-2 h-24"
                placeholder="Provide a brief summary of the resolution..."
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Attachment (optional):</label>
              <input
                type="file"
                name="attachment"
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    attachment: e.target.files[0],
                  });
                }}
                className="border rounded w-full px-3 py-2"
              />
            </div>
            
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? "Resolving..." : "Resolve Issue"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ResolutionInfo;