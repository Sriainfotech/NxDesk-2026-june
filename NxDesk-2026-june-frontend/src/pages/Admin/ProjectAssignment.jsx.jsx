import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiPlus,
  FiX,
  FiCheck,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import ProjectAssignmentUserSelection from "./ProjectAssignmentUserSelection";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { formatDate } from "../../utils/formatDate";
import { useSelector } from "react-redux";

export default function ProjectAssignment() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [projectAssignments, setProjectAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    project_name: "",
    project_asignee: [],
    organisation: "",
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add", "edit", or "view"
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const searchInputRef = useRef(null);
  const userSearchInputRef = useRef(null);

  // Get root organization from Redux store
  const rootOrganisation = useSelector(
    (state) => state.organisation.rootOrganisation
  );

  // Filter assignments based on search term
  const filteredAssignments = projectAssignments.filter((project) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      project.project_name?.toLowerCase().includes(searchTermLower) ||
      project.project_id?.toString().includes(searchTermLower) ||
      (project.assignees &&
        project.assignees.some(
          (user) =>
            user.username?.toLowerCase().includes(searchTermLower) ||
            user.email?.toLowerCase().includes(searchTermLower)
        ))
    );
  });

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!userSearchTerm.trim()) return true;

    const searchTermLower = userSearchTerm.toLowerCase().trim();
    return (
      user.username?.toLowerCase().includes(searchTermLower) ||
      user.email?.toLowerCase().includes(searchTermLower) ||
      user.first_name?.toLowerCase().includes(searchTermLower) ||
      user.last_name?.toLowerCase().includes(searchTermLower)
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(
    1,
    Math.ceil(filteredAssignments.length / pageSize)
  );
  const offset = currentPage * pageSize;
  const currentItems = filteredAssignments.slice(offset, offset + pageSize);

  // Fetch assignments, projects and users on component mount
  useEffect(() => {
    fetchProjectAssignments();
    fetchProjects();
    fetchUsers();
  }, []);

  // Update current entries information when filteredAssignments changes
  useEffect(() => {
    const start = filteredAssignments.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredAssignments.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredAssignments.length);
  }, [filteredAssignments.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredAssignments.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredAssignments.length, pageCount, currentPage]);

  // Set organization to root organization when modal is opened
  useEffect(() => {
    if (showAssignmentModal && modalMode === "add" && rootOrganisation) {
      setFormData((prev) => ({
        ...prev,
        organisation: rootOrganisation.organisation_id,
      }));
    }
  }, [showAssignmentModal, modalMode, rootOrganisation]);

  const fetchProjectAssignments = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("project/members/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("Project Assignments Response:", response.data);
      if (response.status === 200) {
        setProjectAssignments(response.data);
        setCurrentPage(0);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to load project assignments"
      );
      setProjectAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return;
    }
    try {
      const response = await axiosInstance.get("project/projectdetails/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        setProjects(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load projects");
    }
  };

  const fetchUsers = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return;
    }
    try {
      // Updated endpoint as per requirement
      const response = await axiosInstance.get("user/api/assignee/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load users");
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUserToggle = (userId) => {
    const currentAssignees = [...formData.project_asignee];

    if (currentAssignees.includes(userId)) {
      // Remove user if already selected
      setFormData({
        ...formData,
        project_asignee: currentAssignees.filter((id) => id !== userId),
      });
    } else {
      // Add user if not already selected
      setFormData({
        ...formData,
        project_asignee: [...currentAssignees, userId],
      });
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserSearchInputChange = (e) => {
    setUserSearchTerm(e.target.value);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.project_name || formData.project_asignee.length === 0) {
      toast.error("Please select a project and at least one user");
      return;
    }

    setSubmitting(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage project assignments.");
      setSubmitting(false);
      return;
    }

    // Prepare data for submission
    // Make sure project_name is correctly formatted as a number/ID
    const projectId = parseInt(formData.project_name);

    // Ensure all project_asignee values are numbers
    const assigneeIds = formData.project_asignee
      .map((id) => (typeof id === "string" ? parseInt(id) : id))
      .filter((id) => !isNaN(id)); // Filter out any NaN values

    const dataToSend = {
      project_name: projectId,
      project_asignee: assigneeIds,
      organisation: parseInt(formData.organisation),
    };

    console.log("Data being sent:", dataToSend); // Add this for debugging

    try {
      let response;

      if (modalMode === "add") {
        response = await axiosInstance.post("/project/members/", dataToSend, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 201 || response.status === 200) {
          toast.success(
            response?.data?.message || "Project assignment added successfully"
          );
        }
      } else if (modalMode === "edit") {
        // Use the correct assignment ID for editing
        response = await axiosInstance.put(
          `/project/members/${selectedAssignmentId}/`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(
            response?.data?.message || "Project assignment updated successfully"
          );
        }
      }

      setShowAssignmentModal(false);
      resetForm();
      // Refresh the data after adding/editing assignment
      await fetchProjectAssignments();
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error.response?.data?.error ||
        `Failed to ${modalMode} project assignment`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_name: "",
      project_asignee: [],
      organisation: rootOrganisation?.organisation_id || "",
    });
    setUserSearchTerm("");
    setSelectedAssignmentId(null);
  };
  // Updated handleView function to properly set selected assignees
const handleView = (project) => {
  console.log("View project data:", project);

  // Set the assignment ID
  setSelectedAssignmentId(project.assigned_project_id);

  // Apply project selection logic
  let projectIdToUse;

  if (project.project_name && typeof project.project_name === "string") {
    const matchingProject = projects.find(
      (p) => p.project_name === project.project_name
    );
    if (matchingProject) {
      projectIdToUse = matchingProject.project_id;
    }
  }

  if (!projectIdToUse) {
    projectIdToUse = project.project_id;
    if (projectIdToUse !== undefined && projectIdToUse !== null) {
      projectIdToUse = String(projectIdToUse);
    } else {
      projectIdToUse = "";
    }
  }

  // Extract assignee IDs
  let assigneeIds = [];

  // Check if assignees are present as objects with id properties
  if (project.assignees && Array.isArray(project.assignees)) {
    assigneeIds = project.assignees.map((user) => user.id);
    console.log("Extracted assignee IDs from assignees:", assigneeIds);
  } 
  // Check if project_asignee is an array of IDs
  else if (project.project_asignee && Array.isArray(project.project_asignee)) {
    assigneeIds = project.project_asignee;
    console.log("Using project_asignee array:", assigneeIds);
  } 
  // Check if project_asignees exists (could be string or array)
  else if (project.project_asignees) {
    try {
      if (Array.isArray(project.project_asignees)) {
        assigneeIds = project.project_asignees;
        console.log("Using project_asignees array:", assigneeIds);
      } else if (typeof project.project_asignees === "string") {
        const asigneesArray = project.project_asignees
          .split(",")
          .map((id) => id.trim());
        assigneeIds = asigneesArray.map((id) =>
          !isNaN(Number(id)) ? Number(id) : id
        );
        console.log("Parsed project_asignees string:", assigneeIds);
      }
    } catch (e) {
      console.error("Error parsing project assignees:", e);
    }
  }

  // Ensure all assigneeIds are properly converted to numbers
  assigneeIds = assigneeIds.map(id => 
    typeof id === 'string' && !isNaN(Number(id)) ? Number(id) : id
  );

  console.log("Final assignee IDs:", assigneeIds);

  setFormData({
    project_name: projectIdToUse,
    project_asignee: assigneeIds,
    organisation:
      project.organisation || rootOrganisation?.organisation_id || "",
  });

  setModalMode("view");
  setShowAssignmentModal(true);
};

  // const handleView = (project) => {
  //   console.log("View project data:", project);

  //   // Correctly set the assignment ID (this is what was missing)
  //   setSelectedAssignmentId(project.assigned_project_id);

  //   // Apply project selection logic
  //   let projectIdToUse;

  //   if (project.project_name && typeof project.project_name === "string") {
  //     const matchingProject = projects.find(
  //       (p) => p.project_name === project.project_name
  //     );
  //     if (matchingProject) {
  //       projectIdToUse = matchingProject.project_id;
  //     }
  //   }

  //   if (!projectIdToUse) {
  //     projectIdToUse = project.project_id;
  //     if (projectIdToUse !== undefined && projectIdToUse !== null) {
  //       projectIdToUse = String(projectIdToUse);
  //     } else {
  //       projectIdToUse = "";
  //     }
  //   }

  //   // Extract assignee IDs
  //   let assigneeIds = [];

  //   if (project.assignees && Array.isArray(project.assignees)) {
  //     assigneeIds = project.assignees.map((user) => user.id);
  //   } else if (
  //     project.project_asignee &&
  //     Array.isArray(project.project_asignee)
  //   ) {
  //     assigneeIds = project.project_asignee;
  //   } else if (project.project_asignees) {
  //     try {
  //       if (Array.isArray(project.project_asignees)) {
  //         assigneeIds = project.project_asignees;
  //       } else if (typeof project.project_asignees === "string") {
  //         const asigneesArray = project.project_asignees
  //           .split(",")
  //           .map((id) => id.trim());
  //         assigneeIds = asigneesArray.map((id) =>
  //           !isNaN(id) ? Number(id) : id
  //         );
  //       }
  //     } catch (e) {
  //       console.error("Error parsing project assignees:", e);
  //     }
  //   }

  //   setFormData({
  //     project_name: projectIdToUse,
  //     project_asignee: assigneeIds,
  //     organisation:
  //       project.organisation || rootOrganisation?.organisation_id || "",
  //   });

  //   setModalMode("view");
  //   setShowAssignmentModal(true);
  // };

  const handleEdit = (project) => {
    // Add extensive debugging to understand the structure
    console.log("Edit project data:", project);
    console.log("Project ID type:", typeof project.project_id);
    console.log("Current projects list:", projects);

    // Correctly set the assignment ID (this is what was missing)
    setSelectedAssignmentId(project.assigned_project_id);

    // The issue might be related to type mismatches (string vs number)
    // First determine what value we need
    let projectIdToUse;

    // If project_name exists and is a string that might be the project name displayed in table
    if (project.project_name && typeof project.project_name === "string") {
      // Find the corresponding project ID from the projects array
      const matchingProject = projects.find(
        (p) => p.project_name === project.project_name
      );
      if (matchingProject) {
        projectIdToUse = matchingProject.project_id;
        console.log("Found matching project by name:", projectIdToUse);
      }
    }

    // If we couldn't find by name, try direct ID reference
    if (!projectIdToUse) {
      projectIdToUse = project.project_id;
      // Ensure it's the correct type (string or number) based on what select expects
      if (projectIdToUse !== undefined && projectIdToUse !== null) {
        // Convert to string if it isn't already (for select comparison)
        projectIdToUse = String(projectIdToUse);
      } else {
        // Last resort fallback
        projectIdToUse = "";
      }
    }

    // Extract assignee IDs - Check both possible data structures
    let assigneeIds = [];

    // Check project.assignees (object array structure)
    if (project.assignees && Array.isArray(project.assignees)) {
      assigneeIds = project.assignees.map((user) => user.id);
    }
    // Check project.project_asignee (id array structure)
    else if (
      project.project_asignee &&
      Array.isArray(project.project_asignee)
    ) {
      assigneeIds = project.project_asignee;
    }
    // Check project.project_asignees (may be a string list that needs parsing)
    else if (project.project_asignees) {
      try {
        if (Array.isArray(project.project_asignees)) {
          assigneeIds = project.project_asignees;
        } else if (typeof project.project_asignees === "string") {
          // If it's a comma-separated string, try to parse it
          const asigneesArray = project.project_asignees
            .split(",")
            .map((id) => id.trim());
          // Convert to numbers if they look like numbers
          assigneeIds = asigneesArray.map((id) =>
            !isNaN(id) ? Number(id) : id
          );
        }
      } catch (e) {
        console.error("Error parsing project assignees:", e);
      }
    }

    // Log what we're setting in the form
    console.log("Setting form data with project_name:", projectIdToUse);

    setFormData({
      project_name: projectIdToUse,
      project_asignee: assigneeIds,
      organisation:
        project.organisation || rootOrganisation?.organisation_id || "",
    });

    setModalMode("edit");
    setShowAssignmentModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowAssignmentModal(true);
  };

  // Get the project name for display
  const getProjectName = (projectId) => {
    if (!projectId) return "-";
    const project = projects.find((p) => p.project_id === projectId);
    return project ? project.project_name : "-";
  };

  // Get the organization name
  const getOrganizationName = () => {
    return rootOrganisation ? rootOrganisation.organisation_name : "-";
  };

  // Format the list of assignees for display in the table
  const formatAssignees = (assignees) => {
    if (!assignees || !Array.isArray(assignees) || assignees.length === 0)
      return "-";

    // If assignees are objects with username/email properties
    if (typeof assignees[0] === "object") {
      const assigneeNames = assignees.map(
        (user) => user.username || user.email
      );
      if (assigneeNames.length > 2) {
        return `${assigneeNames.slice(0, 2).join(", ")} +${
          assigneeNames.length - 2
        } more`;
      }
      return assigneeNames.join(", ");
    }

    // If assignees are just IDs, we need to look up the names
    const assigneeNames = assignees.map((id) => {
      const user = users.find((u) => u.id === id);
      return user ? user.username || user.email : id;
    });

    if (assigneeNames.length > 2) {
      return `${assigneeNames.slice(0, 2).join(", ")} +${
        assigneeNames.length - 2
      } more`;
    }
    return assigneeNames.join(", ");
  };

  // Create a hover tooltip to display all assignees
  const getAssigneesTooltip = (assignees) => {
    if (!assignees || !Array.isArray(assignees) || assignees.length <= 2)
      return null;

    return (
      <div className="group relative inline-block">
        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-2 hidden group-hover:block z-10">
          <div className="text-xs text-gray-700 font-medium mb-1">
            All assignees:
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            {assignees.map((user, idx) => (
              <li key={idx} className="flex items-center">
                <FiUser className="mr-1 text-gray-400" size={10} />
                <span>{user.username || user.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Project Assignment
              </h1>
              <p className="text-gray-500 text-sm">
                Assign users to projects and manage existing assignments
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Add Assignment"
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
                placeholder="Search assignments..."
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
          {/* Assignments Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading assignments...
                </p>
              </div>
            ) : !filteredAssignments.length ? (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                  <FiUsers size={20} stroke="#9CA3AF" />
                </div>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "No matching assignments found"
                    : "No project assignments found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                >
                  <FiPlus size={16} />
                  Add Assignment
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
                        Project
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Organisation
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assignees
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
                          {project.assigned_project_id || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {project.project_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {getOrganizationName()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 group relative">
                          <div className="flex items-center">
                            <FiUsers className="mr-1 text-gray-400" size={12} />
                            {project.assignees &&
                            Array.isArray(project.assignees)
                              ? formatAssignees(project.assignees)
                              : project.project_asignees
                              ? formatAssignees(
                                  Array.isArray(project.project_asignees)
                                    ? project.project_asignees
                                    : [project.project_asignees]
                                )
                              : "-"}
                          </div>
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
                              title="Edit Assignment"
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
          {filteredAssignments.length > 0 && (
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
          {/* Assignment Modal (Add/Edit/View) */}

          {/* Assignment Modal (Add/Edit/View) */}
          {/* {showAssignmentModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Assignment"
                      : modalMode === "edit"
                      ? "Edit Assignment"
                      : "Assignment Details"}
                  </h2>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="assignmentId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Project ID
                      </label>
                      <input
                        id="assignmentId"
                        value={selectedAssignmentId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="project_name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Project{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      id="project_name"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option
                          key={project.project_id}
                          value={project.project_id}
                        >
                          {project.project_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="organisation"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Organisation
                    </label>
                    <input
                      id="organisation"
                      name="organisation"
                      value={getOrganizationName()}
                      disabled
                      className="border rounded-lg p-2 w-full text-sm bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="project_asignee"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Assignees{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>

                    {modalMode === "view" ? (
                      <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                        {formData.project_asignee.length > 0 ? (
                          <ul className="space-y-1">
                            {formData.project_asignee.map((userId) => {
                              const user = users.find((u) => u.id === userId);
                              return (
                                <li
                                  key={userId}
                                  className="flex items-center text-sm text-gray-600"
                                >
                                  <FiUser
                                    className="mr-1 text-gray-400"
                                    size={12}
                                  />
                                  {user
                                    ? user.username ||
                                      user.email ||
                                      user.first_name
                                    : `User ID: ${userId}`}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No assignees selected
                          </p>
                        )}
                      </div>
                    ) : (
                      <ProjectAssignmentUserSelection
                        users={users}
                        selectedUserIds={formData.project_asignee}
                        onUserToggle={handleUserToggle}
                      />
                    )}
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
                          onClick={() => setShowAssignmentModal(false)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowAssignmentModal(false)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                          disabled={submitting}
                        >
                          {submitting && (
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
                            ? "Add Assignment"
                            : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )} */}
          {/* Assignment Modal (Add/Edit/View) */}
          {showAssignmentModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Assignment"
                      : modalMode === "edit"
                      ? "Edit Assignment"
                      : "Assignment Details"}
                  </h2>
                  <button
                    onClick={() => setShowAssignmentModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="assignmentId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Project ID
                      </label>
                      <input
                        id="assignmentId"
                        value={selectedAssignmentId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="project_name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Project{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      id="project_name"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option
                          key={project.project_id}
                          value={project.project_id}
                        >
                          {project.project_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="organisation"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Organisation
                    </label>
                    <input
                      id="organisation"
                      name="organisation"
                      value={getOrganizationName()}
                      disabled
                      className="border rounded-lg p-2 w-full text-sm bg-gray-50 text-gray-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="project_asignee"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Assignees{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>

                    {modalMode === "view" ? (
                      <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                        {formData.project_asignee &&
                        formData.project_asignee.length > 0 ? (
                          <ul className="space-y-1">
                            {formData.project_asignee.map((userId) => {
                              const user = users.find((u) => u.id === userId);
                              return (
                                <li
                                  key={userId}
                                  className="flex items-center text-sm text-gray-600"
                                >
                                  <FiUser
                                    className="mr-1 text-gray-400"
                                    size={12}
                                  />
                                  {user
                                    ? user.username ||
                                      user.email ||
                                      user.first_name ||
                                      `User ID: ${userId}`
                                    : `User ID: ${userId}`}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No assignees selected
                          </p>
                        )}
                      </div>
                    ) : (
                      <ProjectAssignmentUserSelection
                        users={users}
                        selectedUserIds={formData.project_asignee || []}
                        onUserToggle={handleUserToggle}
                      />
                    )}
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
                          onClick={() => setShowAssignmentModal(false)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          Close
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowAssignmentModal(false)}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                          disabled={submitting}
                        >
                          {submitting && (
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
                            ? "Add Assignment"
                            : "Save Changes"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
          <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
      </main>
      <ChatbotPopup />
    </div>
  );
}
