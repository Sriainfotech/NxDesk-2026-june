import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { FiSearch, FiEdit2, FiEye, FiPlus } from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
const { formatDate } = require("../../utils/formatDate");

export default function IssueTypes() {
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [issueTypes, setIssueTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon_url: null,
    isActive: true,
    category: "", // Add category field
  });
  const [showIssueTypeModal, setShowIssueTypeModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit" or "view"
  const [selectedIssueTypeId, setSelectedIssueTypeId] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);

  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filter issue types based on search term
  const filteredIssueTypes = issueTypes.filter((issueType) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      issueType.name.toLowerCase().includes(searchTermLower) ||
      issueType.issue_type_id.toString().includes(searchTermLower) ||
      (issueType.description &&
        issueType.description.toLowerCase().includes(searchTermLower))
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(
    1,
    Math.ceil(filteredIssueTypes.length / pageSize)
  );
  const offset = currentPage * pageSize;
  const currentItems = filteredIssueTypes.slice(offset, offset + pageSize);

  // Fetch issue types and categories on component mount
  useEffect(() => {
    fetchIssueTypes();
    fetchCategories();
  }, []);

  // Update current entries information when filteredIssueTypes changes
  useEffect(() => {
    const start = filteredIssueTypes.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredIssueTypes.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredIssueTypes.length);
  }, [filteredIssueTypes.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredIssueTypes.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredIssueTypes.length, pageCount, currentPage]);

  // Scroll to top when changing to the last page with fewer items
  useEffect(() => {
    if (currentPage === pageCount - 1 && currentItems.length < pageSize) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  }, [currentPage, pageCount, currentItems.length, pageSize]);

  // Fetch categories from the API
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setCategoriesLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/services/categories/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        // Filter only active categories
        const activeCategories = response.data.filter(
          (category) => category.is_active
        );
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error.response?.data?.error || "Failed to fetch categories");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchIssueTypes = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/services/issue-types/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        // Process issue types with default is_active if not provided
        const processedIssueTypes = response.data.map((issueType) => ({
          ...issueType,
          is_active:
            issueType.is_active !== undefined ? issueType.is_active : true,
        }));
        setIssueTypes(processedIssueTypes);
        // Reset to first page when data changes significantly
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching issue types:", error);
      toast.error(error.response?.data?.error || "Failed to fetch issue types");
      setIssueTypes([]);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        icon_url: file,
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target.result);
      };
      reader.readAsDataURL(file);
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

    if (!formData.name || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage issue types.");
      setLoading(false);
      return;
    }

    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("is_active", formData.isActive);
      formDataToSend.append("category", formData.category);

      if (formData.icon_url && typeof formData.icon_url !== "string") {
        formDataToSend.append("icon_url", formData.icon_url);
      }

      let response;
      if (modalMode === "add") {
        response = await axiosInstance.post(
          "/services/issue-types/",
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success(
            response?.data?.message || "Issue type added successfully"
          );
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `/services/issue-types/${selectedIssueTypeId}/`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          toast.success(
            response?.data?.message || "Issue type updated successfully"
          );
        }
      }

      setShowIssueTypeModal(false);
      resetForm();
      // Refresh the data after adding/editing issue type
      await fetchIssueTypes();
    } catch (error) {
      console.error("Error managing issue type:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.name?.[0] ||
        `Failed to ${modalMode} issue type`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (issueType) => {
    setSelectedIssueTypeId(issueType.issue_type_id);
    setFormData({
      name: issueType.name,
      description: issueType.description || "",
      icon_url: issueType.icon_url || null,
      isActive: issueType.is_active !== undefined ? issueType.is_active : true,
      category: issueType.category || "",
    });
    setIconPreview(issueType.icon_url);
    setModalMode("view");
    setShowIssueTypeModal(true);
  };

  const handleEdit = (issueType) => {
    setSelectedIssueTypeId(issueType.issue_type_id);
    setFormData({
      name: issueType.name,
      description: issueType.description || "",
      icon_url: issueType.icon_url || null,
      isActive: issueType.is_active !== undefined ? issueType.is_active : true,
      category: issueType.category || "",
    });
    setIconPreview(issueType.icon_url);
    setModalMode("edit");
    setShowIssueTypeModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowIssueTypeModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon_url: null,
      isActive: true,
      category: "",
    });
    setIconPreview(null);
    setSelectedIssueTypeId(null);
  };

  // Find category name by id
  const getCategoryNameById = (categoryId) => {
    const category = categories.find((c) => c.issue_category_id === categoryId);
    return category ? category.name : "Unknown";
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Condensed Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Issue Types</h1>
              <p className="text-gray-500 text-sm">
                Add, search, and manage your support issue types
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Add Issue Type"
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
                placeholder="Search issue types..."
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

          {/* Issue Types Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading issue types...
                </p>
              </div>
            ) : !filteredIssueTypes.length ? (
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
                    ? "No matching issue types found"
                    : "No issue types found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                >
                  <FiPlus size={16} />
                  Add Issue Type
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
                        Icon
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
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
                    {currentItems.map((issueType, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {issueType.issue_type_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {issueType.icon_url ? (
                            <img
                              src={issueType.icon_url}
                              alt={issueType.name}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <div className="h-6 w-6 bg-gray-200 rounded"></div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {issueType.name}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                          {issueType.description || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {getCategoryNameById(issueType.category) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              issueType.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {issueType.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(issueType.created_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {issueType.created_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(issueType.modified_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {issueType.modified_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleView(issueType)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(issueType)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Issue Type"
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

          {/* Pagination */}
          {filteredIssueTypes.length > 0 && (
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

          {/* Issue Type Modal */}
          {showIssueTypeModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Issue Type"
                      : modalMode === "edit"
                      ? "Edit Issue Type"
                      : "Issue Type Details"}
                  </h2>
                  <button
                    onClick={() => setShowIssueTypeModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="issueTypeId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Issue Type ID
                      </label>
                      <input
                        id="issueTypeId"
                        value={selectedIssueTypeId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Issue Type Name{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Category{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {categoriesLoading ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                        Loading categories...
                      </div>
                    ) : (
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        required={modalMode !== "view"}
                        disabled={modalMode === "view"}
                        className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                          modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                        }`}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option
                            key={category.issue_category_id}
                            value={category.issue_category_id}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Description{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      rows="3"
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    ></textarea>
                  </div>

                  <div>
                    <label
                      htmlFor="icon"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Icon
                    </label>
                    {modalMode !== "view" && (
                      <input
                        id="icon"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="text-sm p-1"
                      />
                    )}
                    {iconPreview && (
                      <div className="mt-2">
                        <img
                          src={iconPreview}
                          alt="Icon Preview"
                          className="h-16 w-16 object-contain border rounded p-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.isActive}
                          onChange={handleToggleActive}
                          disabled={modalMode === "view"}
                          name="isActive"
                        />
                        <div
                          className={`relative w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 ${
                            modalMode === "view" ? "opacity-70" : ""
                          }`}
                        ></div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {formData.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t mt-4">
                    <button
                      type="button"
                      onClick={() => setShowIssueTypeModal(false)}
                      className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {modalMode === "view" ? "Close" : "Cancel"}
                    </button>
                    {modalMode !== "view" && (
                      <button
                        type="submit"
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          loading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            <span>
                              {modalMode === "add"
                                ? "Adding..."
                                : "Updating..."}
                            </span>
                          </div>
                        ) : modalMode === "add" ? (
                          "Add Issue Type"
                        ) : (
                          "Update Issue Type"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Chat Support */}
          <ChatbotPopup />

          {/* Toast Container */}
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </main>
    </div>
  );
}
