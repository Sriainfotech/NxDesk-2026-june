import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";
import { FiSearch, FiEdit2, FiEye, FiPlus, FiTrash2 } from "react-icons/fi";
import ChatbotPopup from "../../components/ChatBot";
import Button from "../../components/common/Button";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import { axiosInstance } from "../../utils/axiosInstance";
import { formatDate } from "../../utils/formatDate";
import { useSelector } from "react-redux";
import { useAdminProgress } from "../../context/AdminProgressContext";
import AdminProgressTracker from "../../components/common/AdminProgressTracker";

export default function Employee() {
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [employees, setEmployees] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [positions, setPositions] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [parent, setParent] = useState([]);
  const [userRolesForEdit, setUserRolesForEdit] = useState([]);
  const { adminProgress, advanceToStep, completeSetup, loadings } =
    useAdminProgress();

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    username: "",

    organisation: "",
    position_name: "",
    level: "",
    parent: 0,
    userRole: "", // Default to Employee role
    isActive: true,
  });
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit" or "view"
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  // Map user_role IDs to role names

  const searchInputRef = useRef(null);

  const userProfile = useSelector((state) => state.userProfile.user);
  // console.log("user profile of the user is ", userProfile);
  const isSuperUser= userProfile?.is_superuser || false;
  const ordId = userProfile?.organisation_id || null;
  console.log("the organisation id is", ordId);
  const currentUsername= userProfile?.username || null;
  // console.log(isSuperUser)

  // Filter employees based on search term
  const filteredEmployees = employees.filter((employee) => {
    if (!searchTerm.trim()) return true;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      employee.username.toLowerCase().includes(searchTermLower) ||
      employee.employee_id.toString().includes(searchTermLower) ||
      (employee.organisation_name &&
        employee.organisation_name.toLowerCase().includes(searchTermLower)) ||
      (employee.position_name &&
        employee.position_name.toLowerCase().includes(searchTermLower)) ||
      (employee.roleName &&
        employee.roleName.toLowerCase().includes(searchTermLower))
    );
  });

  // Calculate pagination values
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const offset = currentPage * pageSize;
  const currentItems = filteredEmployees.slice(offset, offset + pageSize);

  // Fetch employees and organisations on component mount
  useEffect(() => {
    fetchEmployees();
    fetchOrganisations();
    fetchUsers();
    fetchRoles();
    fetchOrgEmployees();
    testingUsers();
  }, []);

  // Update current entries information when filteredEmployees changes
  useEffect(() => {
    const start = filteredEmployees.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredEmployees.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredEmployees.length);
  }, [filteredEmployees.length, offset, pageSize]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredEmployees.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredEmployees.length, pageCount, currentPage]);

  // Scroll to top when changing to the last page with fewer items
  useEffect(() => {
    if (currentPage === pageCount - 1 && currentItems.length < pageSize) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 200);
    }
  }, [currentPage, pageCount, currentItems.length, pageSize]);

  const fetchOrgEmployees = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }

    const adminOrgId = userProfile?.organisation_id;
    // console.log("user profile is ", userProfile);
    // console.log("adminOrgId is", adminOrgId);
    if (!adminOrgId) {
      console.error("Invalid organisation ID");
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/org/organisation/${adminOrgId}/employee/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      // console.log("data of the same meployee is  ", response);
    } catch (error) {
      console.error("Error fetching of the sam eployees is :", error);
    }
  };

  const testingUsers = async () => {
    const accessToken = localStorage.getItem("access_token");

    try {
      const employeeResponse = await axiosInstance.get("/org/employee/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // console.log("Employee list fetched is as follows", employeeResponse);
    } catch (error) {
      // console.log("the error is as follows", error);
    }
  };

  const fetchUsers = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }

    try {
      // Fetch all user-role entries
      const userRolesResponse = await axiosInstance.get("/roles/user_role/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const allUserRoles = userRolesResponse.data;
      console.log("User Roles Response", userRolesResponse);

    let employeeResponse;

    if (isSuperUser === true) {
      // Fetch hierarchical employees for superuser
      employeeResponse = await axiosInstance.get("/org/superadmin-hierarchy/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      // Fetch employees for specific organisation
      employeeResponse = await axiosInstance.get(`/org/organisation/${ordId}/employee/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
      console.log("Employee list fetch", employeeResponse);

      // 🔄 Flatten the hierarchical data
      const assignedEmployeesRaw = employeeResponse.data;
      const assignedEmployees = flattenEmployees(assignedEmployeesRaw);
      console.log(allUserRoles.data  )
      // Extract usernames of assigned employees
      const assignedUsernames = new Set(
        assignedEmployees.map((emp) => emp.username)
      );

      // Filter out roles for users already assigned
    const unassignedUserRoles = allUserRoles.filter(
  (role) =>
    !assignedUsernames.has(role.user) &&
    role.created_by === currentUsername // Only roles created by current admin
);

      // 🔄 Filter roles for users already assigned (used for EDIT mode)
      const assignedRolesForEdit = allUserRoles.filter((role) =>
        assignedUsernames.has(role.user)
       
      );

      // ✅ These roles are safe to show in edit mode
      const processedRolesForEdit = assignedRolesForEdit.map((entry) => ({
        user_role_id: entry.user_role_id,
        user: entry.user,
        role: entry.role,
      }));
      setUserRolesForEdit(processedRolesForEdit);

      console.log("Unassigned User Roles", unassignedUserRoles);

      // Prepare unassigned roles for "Add" mode
      const processedRolesForAdd = unassignedUserRoles.map((entry) => ({
        user_role_id: entry.user_role_id,
        user: entry.user,
        role: entry.role,
      }));
      console.log(processedRolesForAdd, "the processed roles for add");

      setUserRoles(processedRolesForAdd);
    } catch (error) {
      console.error("Error fetching user roles or employees:", error);
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const flattenEmployees = (data, parentInfo = null) => {
    let result = [];

    data.forEach((entry) => {
      const { children, ...employeeData } = entry;

      result.push({
        ...employeeData,
        isChild: parentInfo !== null,
        parentUsername: parentInfo?.username || null,
        parentId: parentInfo?.employee_id || null,
      });

      if (children && Array.isArray(children) && children.length > 0) {
        const childEntries = flattenEmployees(children, {
          username: employeeData.username,
          employee_id: employeeData.employee_id,
        });
        result = result.concat(childEntries);
      }
    });

    return result;
  };

  const fetchEmployees = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }

    try {
        let employeeResponse;

    if (isSuperUser === true) {
      // Fetch hierarchical employees for superuser
      employeeResponse = await axiosInstance.get("/org/superadmin-hierarchy/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else {
      // Fetch employees for specific organisation
      employeeResponse = await axiosInstance.get(`/org/organisation/${ordId}/employee/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  
// console.log("the employee response is", employeeResponse);
      if (employeeResponse.status === 200) {
        // 🔄 Flatten nested employee structure first
        const flatEmployeeData = flattenEmployees(employeeResponse.data);
        console.log("the flattened employee data is", flatEmployeeData);

        // 🔄 Add is_active default
        const processedEmployees = flatEmployeeData.map((employee) => ({
          ...employee,
          is_active:
            employee.is_active !== undefined ? employee.is_active : true,
        }));

        // console.log("the processed employees are", processedEmployees);

        const processedRoles = flatEmployeeData.map((entry) => ({
          positionNam: entry.position_name,
          employeeId: entry.employee_id,
          username: entry.username,
        }));
        setParent(processedRoles);

        // 🔄 Map roles with name
        const employeesWithRoles = await Promise.all(
          processedEmployees.map(async (employee) => {
            let roleName = null;
            if (employee.user_role) {
              try {
                const roleResponse = await axiosInstance.get(
                  `/roles/user_role/${employee.user_role}/`,
                  {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  }
                );
                if (roleResponse.status === 200) {
                  roleName = roleResponse.data.role;
                }
              } catch (error) {
                console.error(
                  `Error fetching role for employee ${employee.employee_id}:`,
                  error
                );
              }
            }
            return { ...employee, roleName };
          })
        );

        setEmployees(employeesWithRoles);
        console.log("the employees with roles are", employeesWithRoles);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
      setEmployees([]);
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
      console.error("Error fetching organisations:", error);
      toast.error("Failed to load organisations");
    }
  };

  // const fetchPositions = async () => {
  //   const accessToken = localStorage.getItem("access_token");
  //   if (!accessToken) {
  //     return;
  //   }
  //   try {
  //     // Assuming there's an API endpoint for positions
  //     const response = await axiosInstance.get("/org/position/", {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //     });
  //     if (response.status === 200) {
  //       setPositions(response.data);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching positions:", error);
  //     toast.error("Failed to load positions");
  //   }
  // };

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

// Extract parent ID from the parent dropdown selection
// 2. Fix the extractParentId function to handle empty/null values better
const extractParentId = (parentString) => {
  // Handle null, undefined, or falsy values
  if (!parentString || parentString === "" || parentString === "0") {
    return null; // 🔧 FIX: Return null for empty values
  }

  // Convert to string if it's not already a string
  const parentStr = String(parentString).trim();
  
  // Handle empty string cases
  if (parentStr === "" || parentStr === "0") {
    return null; // 🔧 FIX: Return null for empty strings
  }

  // If it's already a number (just digits), return it as parsed integer
  if (/^\d+$/.test(parentStr)) {
    const parsedId = parseInt(parentStr);
    return (isNaN(parsedId) || parsedId === 0) ? null : parsedId; // 🔧 FIX: Handle 0 as null
  }

  // Assuming format is "Position - ParentID - Username"
  const parts = parentStr.split("-");
  if (parts.length >= 2) {
    const parentId = parts[1].trim();
    // Check if parentId is a valid number
    const parsedId = parseInt(parentId);
    return (isNaN(parsedId) || parsedId === 0) ? null : parsedId; // 🔧 FIX: Handle 0 as null
  }
  return null;
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
  // Modify the handleSubmit function in your Employee component

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to manage employees.");
      setLoading(false);
      return;
    }
    if (!isSuperUser && !formData.parent) {
  toast.error("Parent field is required for non-superadmin users.");
  return;
}

    const parentId = extractParentId(formData.parent);
    const parseFormData = (data) => {
      // Extract username from the selected user role if in add mode
      let username = data.username;
      if (modalMode === "add" && data.userRole) {
        const selectedRole = userRoles.find(
          (role) => role.user_role_id.toString() === data.userRole
        );
        username = selectedRole ? selectedRole.user : "";
      }

      return {
        username: username,
        organisation: data.organisation,
        position_name: data.position_name,
        level: data.level,
        parent: parentId ,
        user_role: parseInt(data.userRole, 10),
        is_active: data.isActive,
      };
    };

    try {
      const parsedData = parseFormData(formData);
      let response;
      // console.log("the parsed data is", parsedData);

      if (modalMode === "add") {
        response = await axiosInstance.post("/org/employee/", parsedData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 201 || response.status === 200) {
          toast.success("Employee added successfully");

          if (adminProgress.currentUser) {
            // Check if this employee assignment is for our tracked user
            // console.log("Form Username:", parsedData.username);
            // console.log(
            //   "Admin Current User:",
            //   adminProgress.currentUser.username
            // );

            if (parsedData.username === adminProgress.currentUser.username) {
              // Make sure we're at the right step - either 2 (role assigned) or earlier
              if (adminProgress.currentStep <= 2) {
                // Advance to step 3 (organization assigned and complete)
                advanceToStep(3);

                // Show a completion message
                toast.success(
                  "Organization assigned! User setup is now complete.",
                  {
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                  }
                );

                // After a short delay, show options message
                setTimeout(() => {
                  toast.info(
                    "You can now register another user or go to dashboard.",
                    {
                      autoClose: 5000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                    }
                  );
                }, 2000);
              }
            }
          }
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `/org/employee/${selectedEmployeeId}/`,
          parsedData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success("Employee updated successfully");
        }
      }

      setShowEmployeeModal(false);
      resetForm();
      // Refresh the data after adding/editing employee
      await fetchEmployees();
    } catch (error) {
      console.error("Error managing employee:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        `Failed to ${modalMode} employee`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (employee) => {
    setSelectedEmployeeId(employee.employee_id);

    // Prepare organization ID
    let organizationId;
    if (typeof employee.organisation === "string") {
      const matchingOrg = organisations.find(
        (org) => org.organisation_name === employee.organisation_name
      );
      organizationId = matchingOrg ? matchingOrg.organisation_id : "";
    } else if (typeof employee.organisation === "object") {
      organizationId = employee.organisation.organisation_id;
    } else {
      organizationId = employee.organisation_id || "";
    }

    // // Prepare position ID
    // let positionId;
    // if (typeof employee.position === "string") {
    //   const matchingPos = positions.find(
    //     (pos) => pos.position_name === employee.position_name
    //   );
    //   positionId = matchingPos ? matchingPos.position_id : "";
    // } else if (typeof employee.position === "object") {
    //   positionId = employee.position.position_id;
    // } else {
    //   positionId = employee.position_id || "";
    // }

    setFormData({
      username: employee.username,

      organisation: organizationId,
      position: employee.position_name || "",
      level: employee.level || "",
      parent: employee.parent || "",
      userRole: employee.user_role ? employee.user_role.toString() : "3",
      isActive: employee.is_active !== undefined ? employee.is_active : true,
    });

    setModalMode("view");
    setShowEmployeeModal(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployeeId(employee.employee_id);

    // Prepare organization ID
    let organizationId;
    if (typeof employee.organisation === "string") {
      const matchingOrg = organisations.find(
        (org) => org.organisation_name === employee.organisation_name
      );
      organizationId = matchingOrg ? matchingOrg.organisation_id : "";
    } else if (typeof employee.organisation === "object") {
      organizationId = employee.organisation.organisation_id;
    } else {
      organizationId = employee.organisation_id || "";
    }

    // Prepare position ID
    // let positionId;
    // if (typeof employee.position === "string") {
    //   const matchingPos = positions.find(
    //     (pos) => pos.position_name === employee.position_name
    //   );
    //   positionId = matchingPos ? matchingPos.position_id : "";
    // } else if (typeof employee.position === "object") {
    //   positionId = employee.position.position_id;
    // } else {
    //   positionId = employee.position_id || "";
    // }

 setFormData({
  username: employee.username,
  organisation: organizationId,
  position: employee.position_name || "",
  level: employee.level || "",
  parent: employee.parent || "", // This ensures parent is always a string, even if null
  userRole: employee.user_role ? employee.user_role.toString() : "3",
  isActive: employee.is_active !== undefined ? employee.is_active : true,
});

    setModalMode("edit");
    setShowEmployeeModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowEmployeeModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: "",

      organisation: "",
      position_name: "",
      level: "",
      parent: "",
      userRole: "3",
      isActive: true,
    });
    setSelectedEmployeeId(null);
  };

  const fetchRoles = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      toast.error("Please log in to access this page.");
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
        // console.log("the roles are", response.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
      setRoles([]);
    }
  };

  // Function to determine role class based on user_role
  const getRoleClass = (roleId) => {
    const roleClasses = {
      1: "bg-purple-100 text-purple-800",
      2: "bg-blue-100 text-blue-800",
      3: "bg-green-100 text-green-800",
    };
    return roleClasses[roleId] || "bg-gray-100 text-gray-800";
  };

  // Function to get role name from role ID
  const getRoleLabel = (roleId) => {
    const role = roles.find((r) => r.role_id === roleId);
    return role ? role.name : `Role ${roleId}`;
  };

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Condensed Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
              <p className="text-gray-500 text-sm">
                Add, search, and manage your employees
              </p>
            </div>
            <Button
              blueBackground
              onClick={openAddModal}
              label="Add Employee"
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
                placeholder="Search employees..."
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

          {/* Employees Table - More compact */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Loading employees...
                </p>
              </div>
            ) : !filteredEmployees.length ? (
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "No matching employees found"
                    : "No employees found"}
                </p>
                <button
                  onClick={openAddModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-1 mx-auto text-sm"
                >
                  <FiPlus size={16} />
                  Add Employee
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
                        Username
                      </th>

                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Organisation
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Position
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Level
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Created at
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((employee, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {employee.employee_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                          {employee.username}
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {employee.organisation_name || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {employee.position_name || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {employee.level}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleClass(
                              employee.user_role
                            )}`}
                          >
                            {employee.roleName || `Role ${employee.user_role}`}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              employee.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {employee.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(employee.created_at) || "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleView(employee)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(employee)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit Employee"
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
          {filteredEmployees.length > 0 && (
            <div className="mt-2 flex justify-end items-center">
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

          {/* Employee Modal */}
          {showEmployeeModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {modalMode === "add"
                      ? "Add New Employee"
                      : modalMode === "edit"
                      ? "Edit Employee"
                      : "Employee Details"}
                  </h2>
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {(modalMode === "edit" || modalMode === "view") && (
                    <div>
                      <label
                        htmlFor="employeeId"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Employee ID
                      </label>
                      <input
                        id="employeeId"
                        value={selectedEmployeeId || ""}
                        disabled
                        className="border border-gray-300 rounded-lg p-2 w-full bg-gray-50 text-gray-500 text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="userRole"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      User Role
                    </label>
                    <select
                      id="userRole"
                      name="userRole"
                      value={formData.userRole}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    >
                      <option value="">Select a user-role</option>

                      {(modalMode === "edit"
                        ? userRolesForEdit
                        : userRoles
                      ).map((role) => (
                        <option
                          key={role.user_role_id}
                          value={role.user_role_id.toString()}
                        >
                          {role.user} - {role.role}
                        </option>
                      ))}
                    </select>
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
                    <select
                      id="organisation"
                      name="organisation"
                      value={formData.organisation}
                      onChange={handleFormChange}
                      required={modalMode !== "view"}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    >
                      <option value="">Select Organisation</option>
                      {organisations.map((org) => (
                        <option
                          key={org.organisation_id}
                          value={org.organisation_id}
                        >
                          {org.organisation_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="position_name"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Position{" "}
                      {modalMode !== "view" && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      id="position_name"
                      name="position_name"
                      required={modalMode !== "view"}
                      value={formData.position_name}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="level"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Level
                    </label>
                    <input
                      id="level"
                      name="level"
                      type="number"
                      min="0"
                      value={formData.level}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="parent"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                     Parent {!isSuperUser && <span className="text-red-500">*</span>}

                    </label>
                    <select
                      id="parent"
                      name="parent"
                      value={formData.parent}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                        required={!isSuperUser}
                      className={`border rounded-lg p-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        modalMode === "view" ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    >
                      <option value="">Select-Parent</option>
                      {parent.map((role, index) => (
                        <option
                          key={index}
                          value={`${role.positionName} - ${role.employeeId} - ${role.username}`}
                        >
                          {role.positionNam} - {role.employeeId} -
                          {role.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        className={`relative inline-block w-10 h-5 rounded-full transition-colors ${
                          formData.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                        onClick={
                          modalMode !== "view" ? handleToggleActive : undefined
                        }
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                            formData.isActive ? "transform translate-x-5" : ""
                          }`}
                        ></span>
                      </div>
                      <span className="text-sm text-gray-700">
                        {formData.isActive ? "Active" : "Inactive"}
                      </span>
                    </label>
                  </div>

                  {modalMode !== "view" && (
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEmployeeModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        {modalMode === "add"
                          ? "Add Employee"
                          : "Update Employee"}
                      </button>
                    </div>
                  )}

                  {modalMode === "view" && (
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEdit({
                            employee_id: selectedEmployeeId,
                            ...formData,
                          })
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEmployeeModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          <ChatbotPopup />
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
