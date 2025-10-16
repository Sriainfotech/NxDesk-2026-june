import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/Sidebar";
import { FiSearch, FiEdit2, FiEye, FiPlus } from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { setRootOrganisation } from "../../store/Slices/organisationSlice";
import { formatDate } from "../../utils/formatDate";

export default function Organisations() {
  const dispatch = useDispatch();
  const rootOrganisation = useSelector(
    (state) => state.organisation.rootOrganisation
  );

  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [organisations, setOrganisations] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationMail: "",
    isActive: true,
    organisationType: "root", // Default to root
  });
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit" or "view"
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);

  const searchInputRef = useRef(null);

  // Filter organisations based on search term
  const filteredOrganisations = organisations.filter((org) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      org.organisation_name.toLowerCase().includes(searchTermLower) ||
      org.organisation_mail.toLowerCase().includes(searchTermLower) ||
      org.organisation_id.toString().includes(searchTermLower)
    );
  });

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const response = await axiosInstance.get("project/members/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`, // or from cookies
          },
        });
        console.log("Project members:", response.data);
      } catch (err) {
        console.error("Error fetching project members:", err);
      }
    };

    fetchProjectMembers();
  }, []);

  // Calculate pagination values
  const pageCount = Math.max(
    1,
    Math.ceil(filteredOrganisations.length / pageSize)
  );
  const offset = currentPage * pageSize;
  const currentItems = filteredOrganisations.slice(offset, offset + pageSize);

  // Check if root organisation exists
  const hasRootOrganisation = organisations.some(
    (org) => org.parent_organisation === null
  );

  // Fetch organisations on component mount
  useEffect(() => {
    fetchOrganisations();
  }, []);

  // Update current entries information when filteredOrganisations changes
  useEffect(() => {
    const start = filteredOrganisations.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredOrganisations.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredOrganisations.length);
  }, [filteredOrganisations.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredOrganisations.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredOrganisations.length, pageCount, currentPage]);

  // Scroll to top when changing to the last page with fewer items
  useEffect(() => {
    if (currentPage === pageCount - 1 && currentItems.length < pageSize) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  }, [currentPage, pageCount, currentItems.length, pageSize]);

  const fetchOrganisations = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/org/organisation/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        // Process organisations with default is_active if not provided
        const processedOrganisations = response.data.map((org) => ({
          ...org,
          is_active: org.is_active !== undefined ? org.is_active : true,
        }));

        console.log("Fetched organisations:", processedOrganisations);
        setOrganisations(processedOrganisations);

        // Find and set root organisation in Redux if it exists
        const rootOrg = processedOrganisations.find(
          (org) => org.parent_organisation === null
        );

        if (rootOrg) {
          // Set root organisation in Redux
          const { support_organisations, ...filteredRootOrg } = rootOrg || {};
          dispatch(setRootOrganisation(filteredRootOrg));
        }

        // Reset to first page when data changes significantly
        setCurrentPage(0);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to fetch organisations"
      );
      setOrganisations([]);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.organizationName || !formData.organizationMail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage organisations.");
      setLoading(false);
      return;
    }

    const parseFormData = (data) => {
      const parsedData = {
        organisation_name: data.organizationName,
        organisation_mail: data.organizationMail,
        is_active: data.isActive,
      };

      // Add parent organisation reference for support organisations
      if (data.organisationType === "support" && rootOrganisation) {
        parsedData.parent_organisation = rootOrganisation.organisation_id;
      }

      return parsedData;
    };

    try {
      const parsedData = parseFormData(formData);
      let response;

      if (modalMode === "add") {
        response = await axiosInstance.post("/org/organisation/", parsedData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 201 || response.status === 200) {
          // Store root organisation in Redux if adding a root org
          if (formData.organisationType === "root" && response.data) {
            dispatch(setRootOrganisation(response.data));
          }

          toast.success(
            response?.data?.message || "Organisation added successfully"
          );
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `/org/organisation/${selectedOrganizationId}/`,
          parsedData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          // Update root organisation in Redux if editing the root org
          if (
            rootOrganisation &&
            rootOrganisation.organisation_id === selectedOrganizationId
          ) {
            dispatch(setRootOrganisation(response.data));
          }

          toast.success(
            response?.data?.message || "Organisation updated successfully"
          );
        }
      }

      setShowOrganizationModal(false);
      resetForm();
      // Refresh the data after adding/editing organisation
      await fetchOrganisations();
    } catch (error) {
      console.error("Error managing organisation:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.organisation_name?.[0] ||
        error.response?.data?.organisation_mail?.[0] ||
        `Failed to ${modalMode} organisation`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (org) => {
    setSelectedOrganizationId(org.organisation_id);
    setFormData({
      organizationName: org.organisation_name,
      organizationMail: org.organisation_mail || "",
      isActive: org.is_active !== undefined ? org.is_active : true,
      organisationType: org.parent_organisation === null ? "root" : "support",
    });
    setModalMode("view");
    setShowOrganizationModal(true);
  };

  const handleEdit = (org) => {
    setSelectedOrganizationId(org.organisation_id);
    setFormData({
      organizationName: org.organisation_name,
      organizationMail: org.organisation_mail || "",
      isActive: org.is_active !== undefined ? org.is_active : true,
      organisationType: org.parent_organisation === null ? "root" : "support",
    });
    setModalMode("edit");
    setShowOrganizationModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowOrganizationModal(true);
  };

  const resetForm = () => {
    setFormData({
      organizationName: "",
      organizationMail: "",
      isActive: true,
      organisationType: hasRootOrganisation ? "support" : "root", // Default to support if root exists
    });
    setSelectedOrganizationId(null);
  };

  // Function to get organisation type display label
  const getOrganisationType = (org) => {
    return org.parent_organisation === null ? "Root" : "Support";
  };

  // Function to get parent organisation name
  const getParentOrganisationName = (org) => {
    if (org.parent_organisation === null) {
      return "-";
    }

    const parentOrg = organisations.find(
      (parent) => parent.organisation_id === org.parent_organisation
    );

    return parentOrg ? parentOrg.organisation_name : "-";
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Condensed Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Organisations
              </h1>
              <p className="text-gray-500 text-sm">
                Add, search, and manage your organisations
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Add Organisation"
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
                placeholder="Search organisations..."
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

          {/* Organisations Table - More compact */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading organisations...
                </p>
              </div>
            ) : !filteredOrganisations.length ? (
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
                    ? "No matching organisations found"
                    : "No organisations found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                >
                  <FiPlus size={16} />
                  Add Organisation
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
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Parent Org
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
                    {currentItems.map((org, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {org.organisation_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {org.organisation_name}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                          {org.organisation_mail || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              org.parent_organisation === null
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {getOrganisationType(org)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {getParentOrganisationName(org)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              org.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {org.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(org.created_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {org.created_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(org.modified_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {org.modified_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleView(org)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(org)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Organisation"
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
          {filteredOrganisations.length > 0 && (
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

          {/* Organisation Modal - With radio buttons for org type */}
          {showOrganizationModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Organisation"
                      : modalMode === "edit"
                      ? "Edit Organisation"
                      : "Organisation Details"}
                  </h2>
                  <button
                    onClick={() => setShowOrganizationModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="organizationId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Organisation ID
                      </label>
                      <input
                        id="organizationId"
                        value={selectedOrganizationId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  {/* Organisation Type Selection */}
                  {modalMode === "add" && (
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <p className="block text-xs font-medium text-gray-700 mb-2">
                        Organisation Type
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="rootOrg"
                            name="organisationType"
                            type="radio"
                            value="root"
                            checked={formData.organisationType === "root"}
                            onChange={handleFormChange}
                            disabled={hasRootOrganisation} // Disable if root already exists
                            className="h-4 w-4 text-blue-600"
                          />
                          <label
                            htmlFor="rootOrg"
                            className={`ml-2 text-sm font-medium ${
                              hasRootOrganisation
                                ? "text-gray-400"
                                : "text-gray-700"
                            }`}
                          >
                            Add Root Organisation
                            {hasRootOrganisation && (
                              <span className="text-xs text-red-500 ml-1">
                                (Root organisation already exists)
                              </span>
                            )}
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="supportOrg"
                            name="organisationType"
                            type="radio"
                            value="support"
                            checked={formData.organisationType === "support"}
                            onChange={handleFormChange}
                            disabled={!rootOrganisation} // Disable if no root exists
                            className="h-4 w-4 text-blue-600"
                          />
                          <label
                            htmlFor="supportOrg"
                            className={`ml-2 text-sm font-medium ${
                              !rootOrganisation
                                ? "text-gray-400"
                                : "text-gray-700"
                            }`}
                          >
                            Add Support Organisation
                            {!rootOrganisation && (
                              <span className="text-xs text-red-500 ml-1">
                                (No root organisation selected)
                              </span>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="organizationName"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Organisation Name{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      value={formData.organizationName}
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
                      htmlFor="organizationMail"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Organisation Mail{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="organizationMail"
                      name="organizationMail"
                      value={formData.organizationMail}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  {/* Display parent organization if in view mode for support orgs */}
                  {modalMode === "view" &&
                    formData.organisationType === "support" && (
                      <div>
                        <label
                          htmlFor="parentOrganisation"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Parent Organisation
                        </label>
                        <input
                          id="parentOrganisation"
                          value={rootOrganisation?.organisation_name || "-"}
                          disabled
                          className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                        />
                      </div>
                    )}

                  <div className="flex items-center">
                    <div
                      onClick={handleToggleActive}
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
                          onClick={() => setShowOrganizationModal(false)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowOrganizationModal(false)}
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
                            ? "Add Organisation"
                            : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Chatbot Popup Component */}
          <ChatbotPopup />
        </div>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
