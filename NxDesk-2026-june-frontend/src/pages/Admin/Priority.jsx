import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { FiSearch, FiEdit2, FiEye, FiPlus } from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { formatDate } from "../../utils/formatDate";
import { useSelector } from "react-redux";

export default function Priority() {
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [priorities, setPriorities] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    urgencyName: "",
    description: "",
    responseTargetTime: "",
    isActive: true,
  });
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit" or "view"
  const [selectedPriorityId, setSelectedPriorityId] = useState(null);
  const [organisations, setOrganisations] = useState([]); // Keep this for display purposes

  const searchInputRef = useRef(null);
  const formRef = useRef(null);

  const rootOrganisation = useSelector(
    (state) => state.organisation.rootOrganisation
  );
  console.log("Root Organisation:", rootOrganisation);

  // Filter priorities based on search term
  const filteredPriorities = priorities.filter((priority) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      priority.urgency_name.toLowerCase().includes(searchTermLower) ||
      (priority.description &&
        priority.description.toLowerCase().includes(searchTermLower)) ||
      priority.priority_id.toString().includes(searchTermLower) ||
      (priority.organisation &&
        priority.organisation.toLowerCase().includes(searchTermLower)) ||
      (priority.response_target_time &&
        priority.response_target_time.toString().includes(searchTermLower))
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(
    1,
    Math.ceil(filteredPriorities.length / pageSize)
  );
  const offset = currentPage * pageSize;
  const currentItems = filteredPriorities.slice(offset, offset + pageSize);

  // Fetch priorities and organisations on component mount
  useEffect(() => {
    fetchPriorities();
    fetchOrganisations();
  }, []);

  // Update current entries information when filteredPriorities changes
  useEffect(() => {
    const start = filteredPriorities.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredPriorities.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredPriorities.length);
  }, [filteredPriorities.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredPriorities.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredPriorities.length, pageCount, currentPage]);

  // Scroll to top when changing to the last page with fewer items
  useEffect(() => {
    if (currentPage === pageCount - 1 && currentItems.length < pageSize) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  }, [currentPage, pageCount, currentItems.length, pageSize]);

  const fetchPriorities = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/priority/priority/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        setPriorities(response.data);
        // Reset to first page when data changes significantly
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching priorities:", error);
      toast.error(error.response?.data?.error || "Failed to load priorities");
      setPriorities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganisations = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    try {
      const response = await axiosInstance.get("/org/organisation/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        setOrganisations(response.data);
      }
    } catch (error) {
      console.error("Error fetching organisations:", error);
      toast.error("Failed to load organisations");
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Toggle active status
  const handleToggleActive = () => {
    if (modalMode !== "view") {
      setFormData({
        ...formData,
        isActive: !formData.isActive,
      });
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Validate time format (Days Hours:Minutes:Seconds)
  const validateTimeFormat = (timeStr) => {
    if (!timeStr) return true;

    // Check time format using regex - must follow the format [DD] [HH:[MM:]]ss[.uuuuuu]
    // This allows formats like "5 08:30:00", "5 08:30:00.000", etc.
    const timeFormatRegex = /^(\d+)\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/;
    return timeFormatRegex.test(timeStr);
  };

  // Format the target time for display
  const formatTargetTime = (timeValue) => {
    if (!timeValue) return "-";

    try {
      // First normalize the format if it contains "days"
      let normalizedValue = timeValue;
      if (timeValue.includes(".")) {
        normalizedValue = timeValue.split(".")[0];
      }

      // Expected format: "D HH:MM:SS"
      const parts = normalizedValue.split(" ");
      if (parts.length !== 2) return timeValue; // Return as-is if not in expected format

      const days = parseInt(parts[0]);
      const timeParts = parts[1].split(":");

      if (timeParts.length !== 3) return timeValue; // Return as-is if not in expected format

      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const seconds = parseInt(timeParts[2]);

      let result = [];

      if (days > 0) {
        result.push(`${days} day${days !== 1 ? "s" : ""}`);
      }

      if (hours > 0) {
        result.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
      }

      if (minutes > 0) {
        result.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
      }

      if (seconds > 0) {
        result.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
      }

      if (result.length === 0) {
        return "0 seconds";
      }

      return result.join(" ");
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeValue; // Return as-is if there's an error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.urgencyName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate time format if provided
    if (
      formData.responseTargetTime &&
      !validateTimeFormat(formData.responseTargetTime)
    ) {
      toast.error("Response target time must be in format 'Xdays HH:MM:SS'");
      return;
    }

    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage priorities.");
      setLoading(false);
      return;
    }

    const parseFormData = (data) => ({
      urgency_name: data.urgencyName,
      description: data.description || "",
      input_response_target_time: data.responseTargetTime || "0 00:00:00",
      is_active: data.isActive,
      organisation: rootOrganisation ? rootOrganisation.organisation_id : null, // Use root organisation ID
    });

    try {
      const parsedData = parseFormData(formData);
      let response;
      console.log("parsed Data", parsedData);
      console.log("parsed Data", parsedData);
      if (modalMode === "add") {
        response = await axiosInstance.post("/priority/priority/", parsedData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 201 || response.status === 200) {
          toast.success(
            response?.data?.message || "Priority added successfully"
          );
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `/priority/priority/${selectedPriorityId}/`,
          parsedData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(
            response?.data?.message || "Priority updated successfully"
          );
        }
      }

      setShowPriorityModal(false);
      resetForm();
      // Refresh the data after adding/editing priority
      await fetchPriorities();
    } catch (error) {
      console.error("Error submitting form:", error.response?.data);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.urgency_name?.[0] ||
          `Failed to ${modalMode} priority`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleView = (priority) => {
    setSelectedPriorityId(priority.priority_id);

    // Format the response_target_time to match expected input format (DD HH:MM:SS)
    let formattedTime = priority.response_target_time || "";

    // If time is in old format with "days", convert it
    if (formattedTime.includes("days")) {
      const match = formattedTime.match(/^(\d+)days\s+(\d{2}:\d{2}:\d{2})$/);
      if (match) {
        formattedTime = `${match[1]} ${match[2]}`;
      }
    }

    // If there are microseconds, remove them
    if (formattedTime.includes(".")) {
      formattedTime = formattedTime.split(".")[0];
    }

    setFormData({
      urgencyName: priority.urgency_name,
      description: priority.description || "",
      responseTargetTime: formattedTime,
      isActive: priority.is_active,
    });
    setModalMode("view");
    setShowPriorityModal(true);
  };

  const handleEdit = (priority) => {
    setSelectedPriorityId(priority.priority_id);

    // Format the response_target_time to match expected input format (DD HH:MM:SS)
    let formattedTime = priority.response_target_time || "";

    // If time is in old format with "days", convert it
    if (formattedTime.includes("days")) {
      const match = formattedTime.match(/^(\d+)days\s+(\d{2}:\d{2}:\d{2})$/);
      if (match) {
        formattedTime = `${match[1]} ${match[2]}`;
      }
    }

    // If there are microseconds, remove them
    if (formattedTime.includes(".")) {
      formattedTime = formattedTime.split(".")[0];
    }

    setFormData({
      urgencyName: priority.urgency_name,
      description: priority.description || "",
      responseTargetTime: formattedTime,
      isActive: priority.is_active,
    });
    setModalMode("edit");
    setShowPriorityModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowPriorityModal(true);
  };

  const resetForm = () => {
    setFormData({
      urgencyName: "",
      description: "",
      responseTargetTime: "",
      isActive: true,
    });
    setSelectedPriorityId(null);
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Condensed Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Priorities</h1>
              <p className="text-gray-500 text-sm">
                Add, search, and manage your priorities
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Add Priority"
              icon={<FiPlus size={16} />}
              primary={true}
            />
          </div>

          {/* Search bar in a row with other controls */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-64">
              <input
                ref={searchInputRef}
                type="text"
                className="border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Search priorities..."
                value={searchTerm}
                onChange={handleSearchInputChange}
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" size={16} />
              </div>
            </div>

            <div className="flex items-center text-sm ml-auto">
              <label htmlFor="pageSize" className="text-gray-600 mr-1">
                Show:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>

              <span className="ml-2 text-sm text-gray-600">
                {currentEntries.start}-{currentEntries.end} of {totalEntries}
              </span>
            </div>
          </div>

          {/* Priorities Table - More compact */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading priorities...
                </p>
              </div>
            ) : !filteredPriorities.length ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                  >
                    <path d="M10 21h4M19 12V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C17.48 5 16.92 5 15.8 5H8.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C5 6.52 5 7.08 5 8.2V12" />
                    <path d="M15 17H9c-.93 0-1.395 0-1.776.102a3 3 0 00-2.122 2.122C5 19.605 5 20.07 5 21v0M7 10h.01M12 10h.01M17 10h.01" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "No matching priorities found"
                    : "No priorities found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                >
                  <FiPlus size={16} />
                  Add Priority
                </button>
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Urgency Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Organisation
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Target Time
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Created at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Created by
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Updated at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Updated by
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((priority, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {priority.priority_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {priority.urgency_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {priority.organisation || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                          {priority.description || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatTargetTime(priority.response_target_time)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              priority.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {priority.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(priority.created_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {priority.created_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(priority.modified_at || "-")}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {priority.modified_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleView(priority)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(priority)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Priority"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Compact Pagination Controls */}
          {filteredPriorities.length > 0 && (
            <div className="mt-2 flex justify-start items-center">
              <ReactPaginate
                previousLabel={
                  <span className="flex items-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </span>
                }
                nextLabel={
                  <span className="flex items-center">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                }
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={1}
                pageRangeDisplayed={2}
                onPageChange={handlePageClick}
                forcePage={currentPage}
                containerClassName="flex space-x-1"
                pageClassName="w-6 h-6 flex items-center justify-center rounded text-xs"
                pageLinkClassName="w-full h-full flex items-center justify-center"
                activeClassName="bg-blue-600 text-white"
                activeLinkClassName="font-medium"
                previousClassName="px-1.5 py-1 rounded flex items-center text-xs text-gray-700 hover:bg-gray-100"
                nextClassName="px-1.5 py-1 rounded flex items-center text-xs text-gray-700 hover:bg-gray-100"
                disabledClassName="opacity-50 cursor-not-allowed"
                breakClassName="w-6 h-6 flex items-center justify-center"
              />
            </div>
          )}

          {/* Priority Modal */}
          {showPriorityModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Priority"
                      : modalMode === "edit"
                      ? "Edit Priority"
                      : "Priority Details"}
                  </h2>
                  <button
                    onClick={() => setShowPriorityModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="priorityId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Priority ID
                      </label>
                      <input
                        id="priorityId"
                        value={selectedPriorityId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  {/* Organisation Display - Non-editable */}
                  <div>
                    <label
                      htmlFor="organisation"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Organisation
                    </label>
                    <input
                      id="organisation"
                      value={rootOrganisation?.organisation_name || ""}
                      disabled
                      className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="urgencyName"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Urgency Name{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="urgencyName"
                      name="urgencyName"
                      value={formData.urgencyName}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="responseTargetTime"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Target Response Time
                    </label>
                    {modalMode !== "view" && (
                      <p className="text-xs text-gray-500 mb-1">
                        Enter time in format: "DD HH:MM:SS" (e.g. "5 08:30:00")
                      </p>
                    )}
                    <input
                      id="responseTargetTime"
                      name="responseTargetTime"
                      type="text"
                      value={formData.responseTargetTime}
                      onChange={handleFormChange}
                      placeholder="e.g., 5 08:30:00"
                      pattern="^\d+\s+\d{2}:\d{2}:\d{2}$"
                      title="Format must be: DD HH:MM:SS (e.g. 5 08:30:00)"
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows="3"
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    ></textarea>
                  </div>

                  <div className="flex items-center">
                    <div
                      onClick={
                        modalMode !== "view" ? handleToggleActive : undefined
                      }
                      className={`relative inline-block w-10 h-5 rounded-full transition-colors cursor-pointer ${
                        modalMode === "view"
                          ? "opacity-70 pointer-events-none"
                          : ""
                      } ${formData.isActive ? "bg-blue-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform transform ${
                          formData.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleFormChange}
                        className="sr-only"
                        disabled={modalMode === "view"}
                      />
                    </div>
                    <label
                      htmlFor="isActive"
                      className="text-xs font-medium text-gray-700 ml-2 cursor-pointer"
                      onClick={
                        modalMode !== "view" ? handleToggleActive : undefined
                      }
                    >
                      {formData.isActive ? "Active" : "Inactive"}
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    {modalMode === "view" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setModalMode("edit")}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPriorityModal(false)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowPriorityModal(false)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                          disabled={loading}
                        >
                          {loading && (
                            <svg
                              className="animate-spin h-3 w-3 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          )}
                          {modalMode === "add"
                            ? "Add Priority"
                            : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Toasts Container */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />

          {/* Chatbot Popup */}
          <ChatbotPopup />
        </div>
      </main>
    </div>
  );
}
