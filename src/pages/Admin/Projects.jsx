import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiPlus,
  FiDownload,
  FiX,
  FiPaperclip,
  FiTrash2,
} from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { formatDate } from "../../utils/formatDate";
import { useSelector } from "react-redux"; // Make sure useSelector is imported

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [projects, setProjects] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    projectName: "",
    organisation: "",
    productMail: "",
    isActive: true,
    files: [],
  });
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add", "edit", or "view"
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get root organization from Redux store
  const rootOrganisation = useSelector(
    (state) => state.organisation.rootOrganisation
  );

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      project.project_name?.toLowerCase().includes(searchTermLower) ||
      project.project_id?.toString().includes(searchTermLower) ||
      project.org_name?.toLowerCase().includes(searchTermLower) ||
      project.product_mail?.toLowerCase().includes(searchTermLower)
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const offset = currentPage * pageSize;
  const currentItems = filteredProjects.slice(offset, offset + pageSize);

  // Fetch projects and organisations on component mount
  useEffect(() => {
    fetchProjects();
    fetchOrganisations();
  }, []);

  // Update current entries information when filteredProjects changes
  useEffect(() => {
    const start = filteredProjects.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredProjects.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredProjects.length);
  }, [filteredProjects.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredProjects.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredProjects.length, pageCount, currentPage]);

  // Set organization to root organization when modal is opened
  useEffect(() => {
    if (showProjectModal && modalMode === "add" && rootOrganisation) {
      setFormData(prev => ({
        ...prev,
        organisation: rootOrganisation.organisation_id
      }));
    }
  }, [showProjectModal, modalMode, rootOrganisation]);

  const fetchProjects = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("project/projectdetails/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        // Map the attachments array to files property for compatibility with existing code
        const projectsWithFiles = response.data.map((project) => ({
          ...project,
          files: project.attachments
            ? project.attachments.map((attachment) => ({
                id: attachment.id,
                file: attachment.files,
                file_name: attachment.files.split("/").pop(),
                uploaded_at: attachment.uploaded_at,
              }))
            : [],
        }));
        setProjects(projectsWithFiles);
        setCurrentPage(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganisations = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return;
    }
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
      toast.error(error.response?.data?.error || "Failed to load organisations");
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      if (files.length > 0) {
        const newFiles = Array.from(files);

        // Create file previews
        const newPreviews = newFiles.map((file) => ({
          name: file.name,
          size: (file.size / 1024).toFixed(2), // Convert to KB
          type: file.type,
          file: file,
          isNew: true,
        }));

        setFilePreviews((prev) => [...prev, ...newPreviews]);
        setFormData((prev) => ({
          ...prev,
          files: [...prev.files, ...newFiles],
        }));
      }
      // Clear the file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
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

    if (
      !formData.projectName ||
      !formData.organisation ||
      !formData.productMail
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage projects.");
      setSubmitting(false);
      return;
    }

    // Create FormData object for file upload
    const formDataToSend = new FormData();
    formDataToSend.append("project_name", formData.projectName);
    formDataToSend.append("organisation", formData.organisation);
    formDataToSend.append("product_mail", formData.productMail);
    formDataToSend.append("is_active", formData.isActive);

    // Append all new files
    formData.files.forEach((file) => {
      formDataToSend.append("files", file);
    });

    // For edit mode, include existing files that weren't removed
    if (modalMode === "edit" && existingFiles.length > 0) {
      existingFiles.forEach((fileObj) => {
        formDataToSend.append("existing_files", fileObj.id);
      });
    }

    try {
      let response;

      if (modalMode === "add") {
        response = await axiosInstance.post(
          "/project/details/",
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success(response?.data?.message || "Project added successfully");
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `/project/details/${selectedProjectId}/`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 200) {
          toast.success(response?.data?.message || "Project updated successfully");
        }
      }

      setShowProjectModal(false);
      resetForm();
      // Refresh the data after adding/editing project
      await fetchProjects();
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error.response?.data?.error ||
        `Failed to ${modalMode} project`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      projectName: "",
      organisation: rootOrganisation?.organisation_id || "",
      productMail: "",
      isActive: true,
      files: [],
    });
    setFilePreviews([]);
    setExistingFiles([]);
    setSelectedProjectId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleView = (project) => {
    setSelectedProjectId(project.project_id);

    setFormData({
      projectName: project.project_name,
      organisation: project.organisation || "",
      productMail: project.product_mail || "",
      isActive: project.is_active !== false,
      files: [],
    });

    // Reset file previews
    setFilePreviews([]);
    setExistingFiles([]);

    // If project has files, set the previews
    if (project.files && project.files.length > 0) {
      const existingFilesData = project.files.map((file) => ({
        id: file.id,
        name: file.file_name || file.file.split("/").pop(),
        url: file.file,
        isExisting: true,
      }));
      setExistingFiles(existingFilesData);
    }

    setModalMode("view");
    setShowProjectModal(true);
  };

  const handleEdit = (project) => {
    setSelectedProjectId(project.project_id);

    setFormData({
      projectName: project.project_name,
      organisation: project.organisation || rootOrganisation?.organisation_id || "",
      productMail: project.product_mail || "",
      isActive: project.is_active !== false,
      files: [],
    });

    // Reset file previews
    setFilePreviews([]);
    setExistingFiles([]);

    // If project has files, set the previews
    if (project.files && project.files.length > 0) {
      const existingFilesData = project.files.map((file) => ({
        id: file.id,
        name: file.file_name || file.file.split("/").pop(),
        url: file.file,
        isExisting: true,
      }));
      setExistingFiles(existingFilesData);
    }

    setModalMode("edit");
    setShowProjectModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowProjectModal(true);
  };

  const removeFilePreview = (index) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const removeExistingFile = (index) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleActive = () => {
    if (modalMode !== "view") {
      setFormData({
        ...formData,
        isActive: !formData.isActive,
      });
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      // Check if fileUrl is valid
      if (!fileUrl) {
        toast.error("File URL is missing");
        return;
      }

      // Create a temporary anchor element
      const link = document.createElement("a");

      // Try to fetch the file first to check if it exists
      const response = await fetch(fileUrl, { method: "HEAD" });

      if (!response.ok) {
        toast.error(`File wasn't available on site: ${fileName}`);
        return;
      }

      link.href = fileUrl;
      link.download = fileName || "download";

      // Append to body, trigger click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error(`Failed to download ${fileName || "file"}`);
    }
  };

  // Get the organization name for display in the table or form
  const getOrganizationName = (orgId) => {
    const org = organisations.find(
      (o) => o.organisation_id === orgId || o.id === orgId
    );
    return org ? org.organisation_name : "-";
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
              <p className="text-gray-500 text-sm">
                Add, search, and manage your projects
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Add Project"
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
                placeholder="Search projects..."
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

          {/* Projects Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading projects...
                </p>
              </div>
            ) : !filteredProjects.length ? (
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
                    ? "No matching projects found"
                    : "No projects found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                >
                  <FiPlus size={16} />
                  Add Project
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
                        Project Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Organisation
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product Mail
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Files
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
                    {currentItems.map((project, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {project.project_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {project.project_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {getOrganizationName(project.organisation) ||
                            project.org_name ||
                            "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {project.product_mail || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              project.is_active !== false
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {project.is_active !== false
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {project.files && project.files.length > 0 ? (
                            <span className="flex items-center">
                              <FiPaperclip className="mr-1" size={12} />
                              {project.files.length}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(project.created_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {project.created_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(project.modified_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {project.modified_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleView(project)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(project)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Project"
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
          {filteredProjects.length > 0 && (
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

          {/* Project Modal (Add/Edit/View) */}
          {showProjectModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Project"
                      : modalMode === "edit"
                      ? "Edit Project"
                      : "Project Details"}
                  </h2>
                  <button
                    onClick={() => setShowProjectModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="projectId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Project ID
                      </label>
                      <input
                        id="projectId"
                        value={selectedProjectId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="projectName"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Project Name{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="projectName"
                      name="projectName"
                      value={formData.projectName}
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
                      htmlFor="organisation"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Organisation{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={rootOrganisation ? rootOrganisation.organisation_name : getOrganizationName(formData.organisation)}
                      disabled
                      className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                    />
                    {/* We're keeping this hidden input to maintain the form data structure */}
                    <input
                      type="hidden"
                      id="organisation"
                      name="organisation"
                      value={rootOrganisation ? rootOrganisation.organisation_id : formData.organisation}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="productMail"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Product Mail{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="productMail"
                      name="productMail"
                      type="email"
                      value={formData.productMail}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      className={`relative inline-flex flex-shrink-0 ${
                        modalMode === "view" ? "cursor-not-allowed" : "cursor-pointer"
                      } h-5 w-10 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none ${
                        formData.isActive
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      }`}
                      disabled={modalMode === "view"}
                    >
                      <span
                        className={`${
                          formData.isActive ? "translate-x-5" : "translate-x-0"
                        } pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      ></span>
                    </button>
                    <span className="ml-2 text-sm text-gray-700">
                      {formData.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Attachments
                    </label>

                    {/* Show existing files from the database */}
                    {existingFiles.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">
                          {modalMode === "view"
                            ? "Attached files:"
                            : "Existing files:"}
                        </p>
                        <div className="space-y-1">
                          {existingFiles.map((file, index) => (
                            <div
                              key={`existing-${index}`}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-2"
                            >
                              <div className="flex items-center space-x-1">
                                <FiPaperclip
                                  size={12}
                                  className="text-gray-500"
                                />
                                <span className="text-xs truncate max-w-[150px]">
                                  {file.name}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFile(file.url, file.name)
                                  }
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Download"
                                >
                                  <FiDownload size={14} />
                                </button>
                                {modalMode !== "view" && (
                                  <button
                                    type="button"
                                    onClick={() => removeExistingFile(index)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove"
                                  >
                                    <FiTrash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Show newly added files (not yet saved) */}
                    {filePreviews.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">New files:</p>
                        <div className="space-y-1">
                          {filePreviews.map((file, index) => (
                            <div
                              key={`new-${index}`}
                              className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-2"
                            >
                              <div className="flex items-center space-x-1">
                                <FiPaperclip
                                  size={12}
                                  className="text-blue-500"
                                />
                                <span className="text-xs truncate max-w-[150px]">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({file.size} KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFilePreview(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* File upload input (only show in add/edit modes) */}
                    {modalMode !== "view" && (
                      <div className="mt-1">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white font-medium text-blue-600 hover:text-blue-500 text-xs flex items-center justify-center py-2 border border-gray-300 rounded-md shadow-sm"
                        >
                          <FiPaperclip className="mr-1" size={14} />
                          <span>Attach files</span>
                          <input
                            id="file-upload"
                            name="files"
                            type="file"
                            multiple
                            className="sr-only"
                            onChange={handleFormChange}
                            ref={fileInputRef}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Footer/Buttons */}
                  <div className="flex justify-end pt-2 space-x-2 border-t border-gray-200 mt-4">
                    <Button
                      greyBackground
                      onClick={() => setShowProjectModal(false)}
                      label="Cancel"
                    />
                    {modalMode !== "view" && (
                      <Button
                        blueBackground
                        type="submit"
                        label={modalMode === "add" ? "Add Project" : "Save Changes"}
                        loading={submitting}
                        disabled={submitting}
                      />
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          <ToastContainer position="bottom-right" />
        </div>

        {/* Chatbot */}
        <ChatbotPopup />
      </main>
    </div>
  );
}