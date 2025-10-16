import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import AdminProgressTracker from "../../components/common/AdminProgressTracker";
import Sidebar from "../../components/Sidebar";
import {
  FiSearch,
  FiEdit2,
  FiEye,
  FiPlus,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";

import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { formatDate } from "../../utils/formatDate";
import { useAdminProgress } from "../../context/AdminProgressContext";

export default function UserRoles() {
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [userRoles, setUserRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const { adminProgress, loadings, advanceToStep, completeSetup } =
    useAdminProgress();
  const [formData, setFormData] = useState({
    userId: "",
    roleId: "",
    isActive: true,
  });
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit" or "view"
  const [selectedUserRoleId, setSelectedUserRoleId] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dataLoaded, setDataLoaded] = useState({
    users: false,
    roles: false,
  });

  const searchInputRef = useRef(null);

  // Filter user roles based on search term
  const filteredUserRoles = userRoles.filter((userRole) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      userRole.user.toLowerCase().includes(searchTermLower) ||
      userRole.role.toLowerCase().includes(searchTermLower) ||
      userRole.user_role_id.toString().includes(searchTermLower)
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(1, Math.ceil(filteredUserRoles.length / pageSize));
  const offset = currentPage * pageSize;
  const currentItems = filteredUserRoles.slice(offset, offset + pageSize);

  useEffect(() => {
    // If there's no progress tracking active, allow normal access
    if (!adminProgress.currentUser) return;

    // If the user has already assigned roles (step > 1), allow access
    if (adminProgress.currentStep > 1) return;

    // If we reach this point, the user should be at step 1 (assigning roles)
    if (adminProgress.currentStep !== 1) {
      navigate("/register");
    }
  }, [adminProgress]);

  // Fetch user roles on component mount
  useEffect(() => {
    fetchUserRoles();
    // Pre-fetch user and role data to ensure it's available when needed
    fetchUsers();
    fetchRoles();
  }, []);

  // Update current entries information when filteredUserRoles changes
  useEffect(() => {
    const start = filteredUserRoles.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredUserRoles.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredUserRoles.length);
  }, [filteredUserRoles.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredUserRoles.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredUserRoles.length, pageCount, currentPage]);

  // Scroll to top when changing to the last page with fewer items
  useEffect(() => {
    if (currentPage === pageCount - 1 && currentItems.length < pageSize) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  }, [currentPage, pageCount, currentItems.length, pageSize]);

  const fetchUserRoles = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/roles/user_role/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        setUserRoles(response.data);
        // Reset to first page when data changes significantly
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Failed to load user roles");
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    try {
      const response = await axiosInstance.get("/user/api/assignee/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        const allUsers = response.data;

        const assignedUsernames = userRoles.map((role) => role.user);

        const unassignedUsers = allUsers.filter(
          (user) => !assignedUsernames.includes(user.username)
        );

        setUsers(unassignedUsers);
        setDataLoaded((prev) => ({ ...prev, users: true }));
      }
      console.log("Users fetched successfully let us see:", response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  // const fetchUsers = async () => {
  //   const accessToken = localStorage.getItem("access_token");
  //   if (!accessToken) return;

  //   try {
  //     const response = await axiosInstance.get("/user/api/assignee/", {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //     });
  //     if (response.status === 200) {
  //       setUsers(response.data);
  //       setDataLoaded((prev) => ({ ...prev, users: true }));
  //     }
  //   } catch (error) {
  //     console.error("Error fetching users:", error);
  //     toast.error("Failed to load users");
  //   }
  // };

  const fetchRoles = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    try {
      const response = await axiosInstance.get("/roles/create/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        setRoles(response.data);
        setDataLoaded((prev) => ({ ...prev, roles: true }));
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
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

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Standardized function to prepare user role data
  const prepareUserRoleData = (data) => {
    return {
      user: parseInt(data.userId),
      role: parseInt(data.roleId),
      is_active: data.isActive,
    };
  };

  // Modify the handleSubmit function in your UserRole component
  // This goes in your User Role component to automatically advance to employee page

  // Modify the handleSubmit function in your UserRole component
  // This goes in your User Role component to automatically advance to employee page

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId || !formData.roleId) {
      toast.error("Please select both user and role");
      return;
    }

    setSubmitting(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage user roles.");
      setSubmitting(false);
      return;
    }

    try {
      const parsedData = prepareUserRoleData(formData);
      let response;

      if (modalMode === "add") {
        response = await axiosInstance.post("/roles/user_role/", parsedData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 201 || response.status === 200) {
          toast.success(
            response?.data?.message || "User role assigned successfully"
          );

          // Check if this assignment is for our tracked user
          if (adminProgress.currentUser) {
            const assignedUser = users.find(
              (u) => u.id.toString() === formData.userId
            );

            // If this role assignment matches our in-progress user, advance to step 1
            if (
              assignedUser &&
              assignedUser.username === adminProgress.currentUser.username
            ) {
              // First, make sure we're at step 0 (just registered) or 1 (currently at role assignment)
              if (adminProgress.currentStep <= 1) {
                // Now advance to step 2 (meaning role assignment is complete)
                advanceToStep(2);

                // Show a toast notification prompting the user to continue
                toast.success("Role assigned successfully!", {
                  autoClose: 3000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });

                // Show another toast about next steps
                setTimeout(() => {
                  toast.info("Please continue to assign organization", {
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                  });
                }, 1000);

                // Give the user option to continue rather than auto-navigating
                // Display a button or let them use the progress tracker to navigate
              }
            }
          }
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `/roles/user_role/${selectedUserRoleId}/`,
          parsedData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success(
            response?.data?.message || "User role updated successfully"
          );
        }
      }

      setShowUserRoleModal(false);
      resetForm();
      // Refresh the data after adding/editing user role
      await fetchUserRoles();
    } catch (error) {
      console.error("Error submitting user role:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        `Failed to ${modalMode} user role`;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (userRole) => {
    // Make sure users and roles are loaded before opening view modal
    if (!dataLoaded.users || !dataLoaded.roles) {
      await Promise.all([fetchUsers(), fetchRoles()]);
    }

    // Find the user and role IDs from the names
    const user = users.find((u) => u.username === userRole.user);
    const role = roles.find((r) => r.name === userRole.role);

    if (!user || !role) {
      toast.error("Could not find user or role details. Please try again.");
      return;
    }

    setSelectedUserRoleId(userRole.user_role_id);
    setFormData({
      userId: user?.id || "",
      roleId: role?.role_id || "",
      isActive: userRole.is_active,
    });
    setModalMode("view");
    setShowUserRoleModal(true);
  };

  const handleEdit = async (userRole) => {
    // Make sure users and roles are loaded before opening edit modal
    if (!dataLoaded.users || !dataLoaded.roles) {
      await Promise.all([fetchUsers(), fetchRoles()]);
    }

    // Find the user and role IDs from the names
    const user = users.find((u) => u.username === userRole.user);
    const role = roles.find((r) => r.name === userRole.role);

    if (!user || !role) {
      toast.error("Could not find user or role details. Please try again.");
      return;
    }

    setSelectedUserRoleId(userRole.user_role_id);
    setFormData({
      userId: user?.id || "",
      roleId: role?.role_id || "",
      isActive: userRole.is_active,
    });
    setModalMode("edit");
    setShowUserRoleModal(true);
  };

  const openAddModal = async () => {
    // Make sure users and roles are loaded before opening add modal
    if (!dataLoaded.users || !dataLoaded.roles) {
      await Promise.all([fetchUsers(), fetchRoles()]);
    }

    resetForm();
    setModalMode("add");
    setShowUserRoleModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      roleId: "",
      isActive: true,
    });
    setSelectedUserRoleId(null);
  };

  const toggleStatus = async (userRole) => {
    setSubmitting(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage user roles.");
      setSubmitting(false);
      return;
    }

    try {
      // Make sure users and roles are loaded before toggling status
      if (!dataLoaded.users || !dataLoaded.roles) {
        await Promise.all([fetchUsers(), fetchRoles()]);
      }

      const user = users.find((u) => u.username === userRole.user);
      const role = roles.find((r) => r.name === userRole.role);

      if (!user || !role) {
        toast.error("Could not find user or role details. Please try again.");
        setSubmitting(false);
        return;
      }

      // Use the same data structure and endpoint as the handleSubmit function
      const response = await axiosInstance.put(
        `/roles/user_role/${userRole.user_role_id}/`,
        {
          user: parseInt(user.id),
          role: parseInt(role.role_id),
          is_active: !userRole.is_active,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success(
          `User role ${
            userRole.is_active ? "deactivated" : "activated"
          } successfully`
        );
        await fetchUserRoles();
      }
    } catch (error) {
      console.error("Error toggling user role status:", error);
      toast.error(
        error?.response?.data?.error || "Failed to update the user role"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Condensed Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">User Roles</h1>
              <p className="text-gray-500 text-sm">
                Assign, manage, and monitor user roles
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Assign Role"
              icon={<FiPlus size={16} />}
              primary={true}
              disabled={submitting}
            />
          </div>

          {/* Search bar in a row with other controls */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-64">
              <input
                ref={searchInputRef}
                type="text"
                className="border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Search user roles..."
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

          {/* User Roles Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading user roles...
                </p>
              </div>
            ) : !filteredUserRoles.length ? (
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
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "No matching user roles found"
                    : "No user roles found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                  disabled={submitting}
                >
                  <FiPlus size={16} />
                  Assign Role
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
                        User
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Assigned at
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
                    {currentItems.map((userRole, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {userRole.user_role_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {userRole.user}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {userRole.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(userRole.assigned_at)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userRole.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {userRole.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(userRole.created_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {userRole.created_by || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(userRole.modified_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {userRole.modified_by || "-"}{" "}
                          {/* Fixed typo: modifies_by → modified_by */}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleView(userRole)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                              disabled={submitting}
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(userRole)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit User Role"
                              disabled={submitting}
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => toggleStatus(userRole)}
                              className={`${
                                userRole.is_active
                                  ? "text-red-600 hover:text-red-900 hover:bg-red-50"
                                  : "text-green-600 hover:text-green-900 hover:bg-green-50"
                              } p-1 rounded transition-colors`}
                              title={
                                userRole.is_active ? "Deactivate" : "Activate"
                              }
                              disabled={submitting}
                            >
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
          {filteredUserRoles.length > 0 && (
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

          {/* User Role Modal */}
          {showUserRoleModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Assign New Role"
                      : modalMode === "edit"
                      ? "Edit User Role"
                      : "User Role Details"}
                  </h2>
                  <button
                    onClick={() => setShowUserRoleModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={submitting}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="userRoleId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        User Role ID
                      </label>
                      <input
                        id="userRoleId"
                        value={selectedUserRoleId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="userId"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      User{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      id="userId"
                      name="userId"
                      value={formData.userId}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view" || submitting}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" || submitting
                          ? "bg-gray-50 text-gray-500"
                          : ""
                      }`}
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="roleId"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Role{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <select
                      id="roleId"
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view" || submitting}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" || submitting
                          ? "bg-gray-50 text-gray-500"
                          : ""
                      }`}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.role_id} value={role.role_id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                      disabled={modalMode === "view" || submitting}
                      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        modalMode === "view" || submitting ? "bg-gray-100" : ""
                      }`}
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Active Status
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUserRoleModal(false)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                      disabled={submitting}
                    >
                      {modalMode === "view" ? "Close" : "Cancel"}
                    </button>
                    {modalMode !== "view" && (
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>
                              {modalMode === "add"
                                ? "Assigning..."
                                : "Updating..."}
                            </span>
                          </>
                        ) : (
                          <span>
                            {modalMode === "add"
                              ? "Assign Role"
                              : "Update Role"}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />

          {/* Chatbot Popup */}
          <ChatbotPopup />
        </div>
        {!loadings &&
          adminProgress.currentUser &&
          adminProgress.currentStep > 0 &&
          adminProgress.currentStep <= 3 && (
            <div className="fixed bottom-20 right-6 w-96 z-40">
              <AdminProgressTracker />
            </div>
          )}
      </main>
    </div>
  );
}
