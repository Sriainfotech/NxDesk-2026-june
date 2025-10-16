import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../utils/axiosInstance";
import { toast } from "react-toastify";

const ResolutionInfo = ({ ticketDetails, setActivityLog, activityLog }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingResolution, setIsFetchingResolution] = useState(false);
  const [errors, setErrors] = useState({});
  const userProfile = useSelector((state) => state.userProfile?.username);
  const accessToken = localStorage.getItem("access_token");
  const authHeaders = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [formData, setFormData] = useState({
    resolutionCode: "",
    incidentBasedOn: "",
    incidentCategory: "",
    resolutionNotes: "",
    resolutionSummary: "",
    status: "",
    ticket_id: "",
    resolvedBy: "",
    resolvedDate: "",
    effortsConsumed: "", // New field
  });
  const [resolutionChoices, setResolutionChoices] = useState([]);
  const [incidentChoices, setIncidentChoices] = useState([]);
  const [incidentCategoryChoices, setIncidentCategoryChoices] = useState([]);
  const [resolutionData, setResolutionData] = useState(null);

  useEffect(() => {
    if (ticketDetails) {
      setFormData((prev) => ({
        ...prev,
        ...ticketDetails,
      }));

      if (ticketDetails.status === "Resolved") {
        fetchResolutionInfo(ticketDetails.ticket_id);
      }
    }
  }, [ticketDetails]);

  const fetchResolutionInfo = async (ticketId) => {
    setIsFetchingResolution(true);
    try {
      const response = await axiosInstance.get(
        `resolution/resolutions/${ticketId}/`,
        authHeaders
      );

      if (response.data && response.data.length > 0) {
        const resolutionInfo = response.data[0];
        setResolutionData(resolutionInfo);

        setFormData((prev) => ({
          ...prev,
          status: "Resolved",
          resolutionCode: resolutionInfo.resolution_type,
          incidentBasedOn: resolutionInfo.incident_based_on,
          incidentCategory: resolutionInfo.incident_category,
          resolutionNotes: resolutionInfo.resolution_description,
          resolutionSummary: resolutionInfo.resolution_summary || "",
          resolvedBy: resolutionInfo.created_by,
          resolvedDate: new Date(resolutionInfo.created_at).toLocaleString(),
          effortsConsumed: resolutionInfo.efforts_consumed || "", // New field
        }));
      }
    } catch (error) {
      console.error("Error fetching resolution info:", error);
    } finally {
      setIsFetchingResolution(false);
    }
  };

  useEffect(() => {
    const fetchTicketChoices = async () => {
      try {
        const response = await axiosInstance.get(
          `resolution/resolution-choices/`,
          authHeaders
        );
        setResolutionChoices(response.data.resolution_type_choices);
        setIncidentChoices(response.data.incident_based_on_choices);
        setIncidentCategoryChoices(response.data.incident_category_choices);
      } catch (error) {
        console.error("Error fetching ticket choices:", error);
      }
    };

    fetchTicketChoices();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.resolutionCode)
      newErrors.resolutionCode = "Resolution Code is required";
    if (!formData.incidentBasedOn)
      newErrors.incidentBasedOn = "Incident Based On is required";
    if (!formData.incidentCategory)
      newErrors.incidentCategory = "Incident Category is required";
    if (!formData.resolutionNotes)
      newErrors.resolutionNotes = "Resolution Notes is required";

    // Validate efforts consumed format if provided
    if (formData.effortsConsumed && formData.effortsConsumed.trim()) {
      const timeRegex = /^([0-9]{1,2}):([0-5][0-9])$/;
      if (!timeRegex.test(formData.effortsConsumed)) {
        newErrors.effortsConsumed =
          "Please enter time in HH:MM format (e.g., 02:30)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const formatEffortsConsumed = (timeString) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":").map(Number);

    if (hours === 0 && minutes === 0) {
      return "0 minutes";
    } else if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
        minutes !== 1 ? "s" : ""
      }`;
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await axiosInstance.put(
        `ticket/tickets/${formData.ticket_id}/`,
        { status: "Resolved" },
        authHeaders
      );

      const resolutionPayload = {
        ticket_id: formData.ticket_id,
        status: "Resolved",
        resolution_type: formData.resolutionCode,
        incident_based_on: formData.incidentBasedOn,
        incident_category: formData.incidentCategory,
        resolution_description: formData.resolutionNotes,
        resolution_summary: formData.resolutionSummary,
        resolved_by: userProfile?.id || formData.requestor,
        resolved_date: new Date().toISOString(),
      };

      // Add efforts_consumed only if it's provided
      if (formData.effortsConsumed && formData.effortsConsumed.trim()) {
        resolutionPayload.efforts_consumed = formData.effortsConsumed;
      }

      await axiosInstance.post(
        `/resolution/resolutions/`,
        resolutionPayload,
        authHeaders
      );

      setFormData((prev) => ({
        ...prev,
        status: "Resolved",
        resolvedBy: userProfile?.username || prev.requestor,
        resolvedDate: new Date().toLocaleString(),
      }));

      toast.success("Incident resolved successfully");
      window.location.reload();

      if (setActivityLog && activityLog) {
        const changes = [
          { field: "status", value: "Resolved" },
          { field: "Resolution Code", value: formData.resolutionCode },
          { field: "Incident Type", value: formData.incidentBasedOn },
          { field: "Incident Category", value: formData.incidentCategory },
        ];

        // Add efforts consumed to activity log if provided
        if (formData.effortsConsumed && formData.effortsConsumed.trim()) {
          changes.push({
            field: "Efforts Consumed",
            value: formData.effortsConsumed,
          });
        }

        setActivityLog([
          {
            user: userProfile?.username || formData.requestor,
            timestamp: new Date().toLocaleString(),
            type: "Resolution",
            changes: changes,
          },
          ...activityLog,
        ]);
      }

      fetchResolutionInfo(formData.ticket_id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingResolution) {
    return (
      <div className="p-4">
        <h3 className="font-medium text-base mb-4">Resolution Information</h3>
        <div className="text-center text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-0">
      <h3 className="font-medium text-base mb-4">Resolution Information</h3>

      {formData.status === "Resolved" ? (
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-600">Resolution Code:</span>
            <div className="mt-1">
              {resolutionChoices.find(
                (choice) => choice[0] === formData.resolutionCode
              )?.[1] || formData.resolutionCode}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-600">
              Incident Based On:
            </span>
            <div className="mt-1">
              {incidentChoices.find(
                (choice) => choice[0] === formData.incidentBasedOn
              )?.[1] || formData.incidentBasedOn}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-600">
              Incident Category:
            </span>
            <div className="mt-1">
              {incidentCategoryChoices.find(
                (choice) => choice[0] === formData.incidentCategory
              )?.[1] || formData.incidentCategory}
            </div>
          </div>

          <div>
            <span className="font-medium text-gray-600">Resolved By:</span>
            <div className="mt-1">{formData.resolvedBy}</div>
          </div>

          <div>
            <span className="font-medium text-gray-600">Resolved Date:</span>
            <div className="mt-1">{formData.resolvedDate}</div>
          </div>

          {formData.effortsConsumed && (
            <div>
              <span className="font-medium text-gray-600">
                Efforts Consumed:
              </span>
              <div className="mt-1">{formatEffortsConsumed(formData.effortsConsumed)}</div>
            </div>
          )}

          <div>
            <div className="font-medium text-gray-600 mb-2">
              Resolution Notes:
            </div>
            <div className="text-sm bg-gray-50 p-3 rounded border max-h-24 overflow-y-auto">
              {formData.resolutionNotes}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResolve} className="space-y-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Resolution Code <span className="text-red-500">*</span>
            </label>
            <select
              name="resolutionCode"
              value={formData.resolutionCode || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-1 text-sm border rounded ${
                errors.resolutionCode ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select</option>
              {resolutionChoices.map((code) => (
                <option key={code[0]} value={code[0]}>
                  {code[1]}
                </option>
              ))}
            </select>
            {errors.resolutionCode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.resolutionCode}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Incident Based On <span className="text-red-500">*</span>
            </label>
            <select
              name="incidentBasedOn"
              value={formData.incidentBasedOn || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-1 text-sm border rounded ${
                errors.incidentBasedOn ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select</option>
              {incidentChoices.map((incident) => (
                <option key={incident[0]} value={incident[0]}>
                  {incident[1]}
                </option>
              ))}
            </select>
            {errors.incidentBasedOn && (
              <p className="text-red-500 text-sm mt-1">
                {errors.incidentBasedOn}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Incident Category <span className="text-red-500">*</span>
            </label>
            <select
              name="incidentCategory"
              value={formData.incidentCategory || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-1 text-sm border rounded ${
                errors.incidentCategory ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select</option>
              {incidentCategoryChoices.map((category) => (
                <option key={category[0]} value={category[0]}>
                  {category[1]}
                </option>
              ))}
            </select>
            {errors.incidentCategory && (
              <p className="text-red-500 text-sm mt-1">
                {errors.incidentCategory}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Efforts consumed in resolving this issue
            </label>
            <input
              type="text"
              name="effortsConsumed"
              value={formData.effortsConsumed || ""}
              onChange={handleInputChange}
              placeholder="Enter time in HH:MM format (e.g., 02:30 for 2 hours 30 minutes)"
              className={`w-full px-3 py-1 text-sm border rounded ${
                errors.effortsConsumed ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.effortsConsumed && (
              <p className="text-red-500 text-sm mt-1">
                {errors.effortsConsumed}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              name="resolutionNotes"
              value={formData.resolutionNotes || ""}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 text-sm border rounded h-24 resize-none ${
                errors.resolutionNotes ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Resolution details..."
            ></textarea>
            {errors.resolutionNotes && (
              <p className="text-red-500 text-sm mt-1">
                {errors.resolutionNotes}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Resolving..." : "Resolve Issue"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResolutionInfo;
