import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";
import { axiosInstance } from "../utils/axiosInstance";

export default function AdminAnnouncements() {
  const [activeTab, setActiveTab] = useState("announcements");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [appreciations, setAppreciations] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    org_employees: [],
  });

  const [appreciationForm, setAppreciationForm] = useState({
    user: "",
    message: "",
  });

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showAppreciationModal, setShowAppreciationModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
    fetchAppreciations();
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Please log in to access this page.");
        setLoading(false);
        return;
      }
      const response = await axiosInstance.get(
        "five_notifications/announcements/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setAnnouncements(response.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppreciations = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Please log in to access this page.");
        setLoading(false);
        return;
      }
      const response = await axiosInstance.get(
        "five_notifications/appreciations/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setAppreciations(response.data);
    } catch (error) {
      console.error("Error fetching appreciations:", error);
      toast.error("Failed to load appreciations");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) return;

      const response = await axiosInstance.get("users/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) return;

      const response = await axiosInstance.get("org/employees/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleAnnouncementFormChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm({
      ...announcementForm,
      [name]: value,
    });
  };

  const handleEmployeeSelection = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setAnnouncementForm({
      ...announcementForm,
      org_employees: selectedOptions,
    });
  };

  const handleAppreciationFormChange = (e) => {
    const { name, value } = e.target;
    setAppreciationForm({
      ...appreciationForm,
      [name]: value,
    });
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Please log in to manage announcements.");
        setLoading(false);
        return;
      }

      let response;

      if (modalMode === "add") {
        response = await axiosInstance.post(
          "five_notifications/announcements/",
          announcementForm,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Announcement added successfully");
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `five_notifications/announcements/${selectedItemId}/`,
          announcementForm,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success("Announcement updated successfully");
        }
      }

      setShowAnnouncementModal(false);
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error managing announcement:", error);
      toast.error(
        error.response?.data?.message || `Failed to ${modalMode} announcement`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppreciationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Please log in to manage appreciations.");
        setLoading(false);
        return;
      }

      let response;

      if (modalMode === "add") {
        response = await axiosInstance.post(
          "five_notifications/appreciations/",
          appreciationForm,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("Appreciation added successfully");
        }
      } else if (modalMode === "edit") {
        response = await axiosInstance.put(
          `five_notifications/appreciations/${selectedItemId}/`,
          appreciationForm,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.status === 200) {
          toast.success("Appreciation updated successfully");
        }
      }

      setShowAppreciationModal(false);
      resetAppreciationForm();
      fetchAppreciations();
    } catch (error) {
      console.error("Error managing appreciation:", error);
      toast.error(
        error.response?.data?.message || `Failed to ${modalMode} appreciation`
      );
    } finally {
      setLoading(false);
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      content: "",
      org_employees: [],
    });
    setSelectedItemId(null);
  };

  const resetAppreciationForm = () => {
    setAppreciationForm({
      user: "",
      message: "",
    });
    setSelectedItemId(null);
  };

  const openAddAnnouncementModal = () => {
    resetAnnouncementForm();
    setModalMode("add");
    setShowAnnouncementModal(true);
  };

  const openEditAnnouncementModal = (announcement) => {
    setModalMode("edit");
    setSelectedItemId(announcement.id);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      org_employees: announcement.org_employees?.map((emp) => emp.id) || [],
    });
    setShowAnnouncementModal(true);
  };

  const openAddAppreciationModal = () => {
    resetAppreciationForm();
    setModalMode("add");
    setShowAppreciationModal(true);
  };

  const openEditAppreciationModal = (appreciation) => {
    setModalMode("edit");
    setSelectedItemId(appreciation.id);
    setAppreciationForm({
      user: appreciation.user?.id || "",
      message: appreciation.message,
    });
    setShowAppreciationModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage announcements and achievements for your organization
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("announcements")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "announcements"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Announcements
                </button>
                <button
                  onClick={() => setActiveTab("appreciations")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "appreciations"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Appreciations
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "announcements" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Manage Announcements
                    </h2>
                    <button
                      onClick={openAddAnnouncementModal}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Announcement
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">
                        Loading announcements...
                      </span>
                    </div>
                  ) : !announcements.length ? (
                    <div className="p-8 text-center text-gray-500">
                      No announcements found. Create your first announcement!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Title
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Content
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Created At
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Updated At
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Created By
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {announcements.map((announcement, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {announcement.title}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                {announcement.content}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(announcement.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(announcement.updated_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {announcement.created_by?.name || "System"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <button
                                  onClick={() =>
                                    openEditAnnouncementModal(announcement)
                                  }
                                  className="text-blue-600 hover:text-blue-800 mr-3"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "appreciations" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Manage Appreciations
                    </h2>
                    <button
                      onClick={openAddAppreciationModal}
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Appreciation
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">
                        Loading appreciations...
                      </span>
                    </div>
                  ) : !appreciations.length ? (
                    <div className="p-8 text-center text-gray-500">
                      No appreciations found. Create your first appreciation!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              User
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Message
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Created At
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Updated At
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Created By
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appreciations.map((appreciation, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {appreciation.user?.name || "Unknown User"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                {appreciation.message}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(appreciation.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {formatDate(appreciation.updated_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {appreciation.created_by?.name || "System"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <button
                                  onClick={() =>
                                    openEditAppreciationModal(appreciation)
                                  }
                                  className="text-blue-600 hover:text-blue-800 mr-3"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {modalMode === "add"
                    ? "Add Announcement"
                    : "Edit Announcement"}
                </h2>
              </div>

              <form onSubmit={handleAnnouncementSubmit} className="px-6 py-4">
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={announcementForm.title}
                    onChange={handleAnnouncementFormChange}
                    required
                    className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={announcementForm.content}
                    onChange={handleAnnouncementFormChange}
                    required
                    rows={4}
                    className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="org_employees"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Organization Employees
                  </label>
                  <select
                    id="org_employees"
                    name="org_employees"
                    multiple
                    value={announcementForm.org_employees}
                    onChange={handleEmployeeSelection}
                    className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name ||
                          employee.email ||
                          `Employee #${employee.id}`}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl or Cmd to select multiple employees
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAnnouncementModal(false)}
                    className="py-2 px-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        {modalMode === "add" ? "Adding..." : "Updating..."}
                      </span>
                    ) : modalMode === "add" ? (
                      "Add Announcement"
                    ) : (
                      "Update Announcement"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appreciation Modal */}
        {showAppreciationModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {modalMode === "add"
                    ? "Add Appreciation"
                    : "Edit Appreciation"}
                </h2>
              </div>

              <form onSubmit={handleAppreciationSubmit} className="px-6 py-4">
                <div className="mb-4">
                  <label
                    htmlFor="user"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    User
                  </label>
                  <select
                    id="user"
                    name="user"
                    value={appreciationForm.user}
                    onChange={handleAppreciationFormChange}
                    required
                    className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email || `User #${user.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={appreciationForm.message}
                    onChange={handleAppreciationFormChange}
                    required
                    rows={4}
                    className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAppreciationModal(false)}
                    className="py-2 px-4 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        {modalMode === "add" ? "Adding..." : "Updating..."}
                      </span>
                    ) : modalMode === "add" ? (
                      "Add Appreciation"
                    ) : (
                      "Update Appreciation"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ToastContainer
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </main>
    </div>
  );
}
