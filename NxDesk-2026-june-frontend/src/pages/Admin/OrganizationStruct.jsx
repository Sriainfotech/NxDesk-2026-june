import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";

export default function OrgChart() {
  const [searchTerm, setSearchTerm] = useState("");
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    position_name: "",
    level: "",
    parent: null,
    user_role: null,
    organisation: 1,
  });

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef(null);

  
  const userProfile = useSelector((state) => state.userProfile.user);
  // console.log("user profile of the user is ", userProfile);
  const isSuperUser= userProfile?.is_superuser || false;
  const ordId = userProfile?.organisation_id || null;
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

  // Convert flat employee list to hierarchical structure
  const buildHierarchy = (employees) => {
    if (!employees || employees.length === 0) return null;

    const empMap = new Map();
    employees.forEach((emp) => {
      empMap.set(emp.employee_id, {
        ...emp,
        id: emp.employee_id.toString(),
        emp: emp.username,
        name: emp.position_name,
        title: `Level ${emp.level}`,
        children: [],
      });
    });

    const rootNodes = [];

    employees.forEach((emp) => {
      const node = empMap.get(emp.employee_id);

      if (emp.parent) {
        const parentNode = empMap.get(emp.parent);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    if (rootNodes.length > 1) {
      return {
        id: "root",
        emp: "Organization",
        name: "Organization",
        title: "HQ",
        level: "Level 0",
        children: rootNodes,
      };
    } else if (rootNodes.length === 1) {
      return rootNodes[0];
    } else {
      return null;
    }
  };

  // Fetch organization data from API
  const fetchOrgData = async () => {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          toast.error("Please log in to access this page.");
          setLoading(false);
          return;
        }
    try {
      setLoading(true);
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
      const flatEmployeeData = flattenEmployees(employeeResponse.data);
      const employeeList = flatEmployeeData;
      console.log("Employee List:", employeeList);

      const hierarchicalData = buildHierarchy(employeeList);
      setOrgData(hierarchicalData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch organization data");
      setLoading(false);

      // Fallback to sample data for demonstration
      const sampleEmployees = [
        {
          employee_id: 1,
          position_name: "CEO",
          level: 1,
          parent: null,
        },
        {
          employee_id: 2,
          position_name: "CTO",
          level: 2,
          parent: 1,
        },
        {
          employee_id: 3,
          position_name: "CFO",
          level: 2,
          parent: 1,
        },
        {
          employee_id: 4,
          position_name: "Senior Developer",
          level: 3,
          parent: 2,
        },
        {
          employee_id: 5,
          position_name: "Junior Developer",
          level: 4,
          parent: 4,
        },
        {
          employee_id: 6,
          position_name: "Accountant",
          level: 3,
          parent: 3,
        },
      ];

      const hierarchicalData = buildHierarchy(sampleEmployees);
      setOrgData(hierarchicalData);
      setLoading(false);
    }
  };

  // Save new employee to API
  const saveNewEmployee = async () => {
    try {
      if (!newEmployee.position_name || !newEmployee.level) {
        setError("Position name and level are required");
        return false;
      }

      const employeeData = {
        ...newEmployee,
        parent: parseInt(selectedNodeId),
      };

      const response = await axiosInstance.post("org/employee/", employeeData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      await fetchOrgData();
      return true;
    } catch (err) {
      console.error("Error saving employee:", err);
      setError("Failed to add new employee");
      return false;
    }
  };

  useEffect(() => {
    fetchOrgData();

    if (chartContainerRef.current) {
      const { width, height } =
        chartContainerRef.current.getBoundingClientRect();
      setPosition({ x: width / 4, y: height / 8 });
    }
  }, []);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2.5));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    if (chartContainerRef.current) {
      const { width, height } =
        chartContainerRef.current.getBoundingClientRect();
      setPosition({ x: width / 4, y: height / 8 });
    }
  };

  // Add employee handler
  const addEmployee = async () => {
    const success = await saveNewEmployee();

    if (success) {
      setNewEmployee({
        username: "",
        position_name: "",
        level: "",
        parent: null,
        user_role: null,
        organisation: 1,
      });
      setShowAddForm(false);
      setSelectedNodeId(null);
      setError(null);
    }
  };

  // Filter function for search
  const filterOrgData = (node, term) => {
    if (!term) return node;

    if (
      node.position_name?.toLowerCase().includes(term.toLowerCase()) ||
      node.name?.toLowerCase().includes(term.toLowerCase())
    ) {
      return node;
    }
    if (
      node.username?.toLowerCase().includes(term.toLowerCase()) ||
      node.emp?.toLowerCase().includes(term.toLowerCase())
    ) {
      return node;
    }

    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children
        .map((child) => filterOrgData(child, term))
        .filter((child) => child !== null);

      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
    }

    return null;
  };

  // Compute filtered data based on search term
  const filteredData =
    searchTerm && orgData ? filterOrgData({ ...orgData }, searchTerm) : orgData;

  // Node component for org chart
  const OrgNode = ({ node }) => {
    const handleAddClick = () => {
      setSelectedNodeId(node.id);

      const nextLevel = node.level
        ? parseInt(node.level.replace("Level ", "")) + 1
        : 2;

      setNewEmployee((prev) => ({
        ...prev,
        level: nextLevel,
        parent: parseInt(node.id),
      }));

      setShowAddForm(true);
    };

    // Color based on level
    const getNodeColor = (level) => {
      const levelNum =
        typeof level === "string"
          ? parseInt(level.replace("Level ", ""))
          : level;

      const colors = [
        "bg-indigo-100 text-indigo-700 border-indigo-200",
        "bg-blue-100 text-blue-700 border-blue-200",
        "bg-emerald-100 text-emerald-700 border-emerald-200",
        "bg-amber-100 text-amber-700 border-amber-200",
        "bg-pink-100 text-pink-700 border-pink-200",
      ];

      return colors[levelNum % colors.length];
    };

    const nodeColor = getNodeColor(node.level || node.title);

    return (
      <div className="flex flex-col items-center">
        <div
          className={`rounded-lg shadow-md p-4 w-60 mb-4 relative group border-2 ${nodeColor}`}
        >
          <div className="flex items-start">
            <div className="bg-white rounded-full p-2 mr-3 shadow">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold">
                {node.name || node.position_name}
              </div>
              <div className="text-base font-semibold">
                {node.emp || node.username}
              </div>
              <div className="text-sm mt-1">{node.title}</div>
              {node.id && (
                <div className="text-xs mt-1 opacity-60">ID: {node.id}</div>
              )}
            </div>

            <button
              onClick={handleAddClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-blue-600 hover:bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center absolute -top-2 -right-2 shadow border border-blue-100"
              title="Add direct report"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="h-10 border-l-2 border-gray-300"></div>
            <div className="flex flex-row space-x-8">
              {node.children.map((child) => (
                <OrgNode key={child.id} node={child} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search position or name..."
            className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors border border-gray-200"
            title="Zoom out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={zoomIn}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors border border-gray-200"
            title="Zoom in"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          <button
            onClick={resetView}
            className="bg-white px-4 py-1.5 rounded-md shadow hover:bg-gray-100 transition-colors text-sm border border-gray-200"
            title="Reset view"
          >
            Reset View
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition-colors flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Root Position
          </button>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {selectedNodeId ? "Add Direct Report" : "Add Root Position"}
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-100">
                <div className="flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. CEO, CTO, Manager"
                  value={newEmployee.position_name}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      position_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. John Doe"
                  value={newEmployee.username}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, username: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Hierarchy level (1, 2, 3...)"
                  value={newEmployee.level}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      level: parseInt(e.target.value) || "",
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Parent ID (if applicable)"
                  value={newEmployee.level - 1}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      parent: parseInt(e.target.value) || "",
                    })
                  }
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role ID *
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Associate with user role"
                  value={newEmployee.user_role || ""}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      user_role: parseInt(e.target.value) || "",
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Organisation name or ID"
                  value={newEmployee.organisation || ""}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      organisation: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEmployee}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draggable chart container */}
      <div
        ref={chartContainerRef}
        className="relative w-full h-[600px] overflow-hidden rounded-xl bg-gray-50 border border-gray-200 shadow-inner"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">
              Loading organization structure...
            </p>
          </div>
        ) : error && !showAddForm ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md border border-red-100">
              <div className="flex items-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-semibold">Error Loading Data</span>
              </div>
              <p>{error}</p>
              <button
                onClick={fetchOrgData}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md w-full transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredData ? (
          <div
            className="absolute origin-top-left transition-transform duration-100 ease-out pt-8"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              maxWidth: "100%",
            }}
          >
            <OrgNode node={filteredData} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-gray-600">
              {searchTerm
                ? "No matching positions found"
                : "No organization structure defined yet"}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Add First Position
            </button>
          </div>
        )}

        {/* Instruction tooltip */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg text-sm text-gray-600 max-w-xs opacity-60 hover:opacity-100 transition-opacity border border-gray-200">
          <p className="font-medium mb-2 text-gray-700">Navigation Controls:</p>
          <ul className="space-y-1">
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              Click and drag to move chart
            </li>
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Use +/- buttons to zoom in/out
            </li>
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset view button to center
            </li>
            <li className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Hover on boxes to add positions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
