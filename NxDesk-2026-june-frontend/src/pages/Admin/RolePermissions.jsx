import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { FiSearch, FiEdit2, FiEye, FiPlus, FiSave, FiChevronDown, FiChevronUp } from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { formatDate } from "../../utils/formatDate";

export default function RolePermissions() {
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);

  const searchInputRef = useRef(null);

  // Filter roles based on search term
  const filteredRoles = roles.filter((role) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      role.name.toLowerCase().includes(searchTermLower) ||
      role.role_id.toString().includes(searchTermLower)
    );
  });

  // Filter permissions based on search term
  const filteredPermissions = permissions.filter((permission) => {
    if (!permissionSearchTerm.trim()) return true;

    const searchTermLower = permissionSearchTerm.toLowerCase().trim();
    return (
      permission.name.toLowerCase().includes(searchTermLower) ||
      permission.permission_id.toString().includes(searchTermLower)
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const offset = currentPage * pageSize;
  const currentItems = filteredRoles.slice(offset, offset + pageSize);

  // Fetch roles and permissions on component mount
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get("/roles/create/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        setRoles(response.data);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      return;
    }
    try {
      const response = await axiosInstance.get("/role/permissions/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch permissions");
      setPermissions([]);
    }
  };

  // Fetch role permissions
  const fetchRolePermissions = async (roleId) => {
    setPermissionsLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setPermissionsLoading(false);
      return;
    }
    try {
      const response = await axiosInstance.get(`/roles/assign-permissions/${roleId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200) {
        // Expect an array of permission IDs or permission objects
        const permissionIds = response.data.map(p => 
          typeof p === 'object' ? p.permission_id : p
        );
        setSelectedPermissions(permissionIds);
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      toast.error(error?.response?.data?.error || "Failed to fetch role permissions");
      setSelectedPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Handle pagination
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle permission search input change
  const handlePermissionSearchChange = (e) => {
    setPermissionSearchTerm(e.target.value);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Handle permission checkbox change
  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  // Handle opening permissions modal
  const handleOpenPermissionsModal = (role) => {
    setSelectedRoleId(role.role_id);
    setSelectedRoleName(role.name);
    fetchRolePermissions(role.role_id);
    setShowPermissionsModal(true);
  };

  // Handle expand/collapse role permissions
  const toggleExpandRole = (roleId) => {
    if (expandedRole === roleId) {
      setExpandedRole(null);
    } else {
      setExpandedRole(roleId);
      fetchRolePermissions(roleId);
    }
  };

  // Handle save permissions
  const handleSavePermissions = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage permissions.");
      return;
    }

    try {
      const response = await axiosInstance.put(
        `/roles/assign-permissions/${selectedRoleId}/`,
        { permissions: selectedPermissions },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Permissions updated successfully");
        setShowPermissionsModal(false);
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error(error?.response?.data?.error || "Failed to update permissions");
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Role Permissions</h1>
              <p className="text-gray-500 text-sm">
                Manage role permissions and access control
              </p>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-64">
              <input
                ref={searchInputRef}
                type="text"
                className="border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Search roles..."
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
                {filteredRoles.length > 0 ? `${offset + 1}-${Math.min(offset + pageSize, filteredRoles.length)} of ${filteredRoles.length}` : "0-0 of 0"}
              </span>
            </div>
          </div>

          {/* Roles Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading roles...</p>
              </div>
            ) : !filteredRoles.length ? (
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
                  {searchTerm ? "No matching roles found" : "No roles found"}
                </p>
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role Name
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
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((role, index) => (
                      <>
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 transition-colors duration-150 ${
                            expandedRole === role.role_id ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                            {role.role_id}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                            {role.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                role.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {role.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                            {role.created_at
                              ? formatDate(role.created_at)
                              : "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                            {role.created_by || "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-center">
                            <div className="flex space-x-1 justify-center">
                              <button
                                onClick={() => toggleExpandRole(role.role_id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors flex items-center"
                                title={expandedRole === role.role_id ? "Hide Permissions" : "Show Permissions"}
                              >
                                {expandedRole === role.role_id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                              </button>
                              <button
                                onClick={() => handleOpenPermissionsModal(role)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                title="Edit Permissions"
                              >
                                <FiEdit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRole === role.role_id && (
                          <tr>
                            <td colSpan="6" className="px-3 py-2 bg-gray-50">
                              <div className="p-2">
                                <div className="text-sm font-medium mb-2">Permissions for {role.name}</div>
                                {permissionsLoading ? (
                                  <div className="py-2 text-center">
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                    <span className="ml-2 text-xs text-gray-600">Loading permissions...</span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-2">
                                    {permissions
                                      .filter(p => selectedPermissions.includes(p.permission_id))
                                      .map(permission => (
                                        <div
                                          key={permission.permission_id}
                                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center"
                                        >
                                          <span className="truncate">{permission.name}</span>
                                        </div>
                                      ))}
                                    {selectedPermissions.length === 0 && (
                                      <div className="text-xs text-gray-500 col-span-3">No permissions assigned to this role</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredRoles.length > 0 && (
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

          {/* Permissions Modal */}
          {showPermissionsModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Manage Permissions for {selectedRoleName}
                  </h2>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4">
                  {/* Search Permissions */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      placeholder="Search permissions..."
                      value={permissionSearchTerm}
                      onChange={handlePermissionSearchChange}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" size={16} />
                    </div>
                  </div>

                  {/* Permissions List */}
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {permissionsLoading ? (
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-600 text-sm">Loading permissions...</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredPermissions.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No permissions found
                          </div>
                        ) : (
                          filteredPermissions.map((permission) => (
                            <div
                              key={permission.permission_id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                id={`permission-${permission.permission_id}`}
                                checked={selectedPermissions.includes(permission.permission_id)}
                                onChange={() => handlePermissionChange(permission.permission_id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`permission-${permission.permission_id}`}
                                className="ml-2 text-sm text-gray-700 cursor-pointer flex-grow"
                              >
                                {permission.name}
                              </label>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  permission.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {permission.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => setShowPermissionsModal(false)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                      disabled={permissionsLoading}
                    >
                      {permissionsLoading ? (
                        <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                      ) : (
                        <FiSave size={14} />
                      )}
                      Save Permissions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <ChatbotPopup />
      <ToastContainer
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}