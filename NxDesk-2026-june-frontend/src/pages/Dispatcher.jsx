import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import Sidebar from "../components/Sidebar";
import ChatbotPopup from "../components/ChatBot";
import DispatcherAssignmentModal from "../pages/DispatcherAssignmentModal";
import { ToastContainer, toast } from "react-toastify";
import ReactPaginate from "react-paginate";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { useSelector } from "react-redux";

export default function Dispatcher() {
  // State for page data
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State for assignment modal
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const accessToken = localStorage.getItem("access_token");

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const userProfile = useSelector((state) => state.userProfile.user);

  // Fetch unassigned tickets on component mount
  useEffect(() => {
    fetchUnassignedTickets();
  }, []);

  // Fetch tickets when page size or current page changes
  useEffect(() => {
    if (!isSearching) {
      fetchUnassignedTickets();
    }
  }, [pageSize, currentPage]);

  // Reset to first page and refetch when search term changes (with debounce)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim() !== "") {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        setCurrentPage(0);
        fetchUnassignedTickets();
      }, 500);
    } else {
      setIsSearching(false);
      setCurrentPage(0);
      fetchUnassignedTickets();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const fetchUnassignedTickets = async () => {
    setLoading(true);

    try {
      // Calculate offset based on current page and page size
      const offset = currentPage * pageSize;

      // Prepare query parameters for pagination and search
      const params = {
        limit: pageSize,
        offset: offset,
      };

      // Add search term if it exists
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await axiosInstance.get("/ticket/dispatcher/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: params,
      });

      // Update tickets and total count - assuming API returns total count
      const allTickets =
        response.data.results?.all_tickets ||
        response.data.results?.all_ticket ||
        [];
      setUnassignedTickets(allTickets);

      // Update total count if the API provides it
      if (response.data.count !== undefined) {
        setTotalEntries(response.data.count);
      } else {
        // Fallback to local count if API doesn't provide total
        setTotalEntries(allTickets.length);
      }

      // Calculate current entries
      const start = allTickets.length > 0 ? offset + 1 : 0;
      const end = Math.min(offset + pageSize, offset + allTickets.length);
      setCurrentEntries({ start, end });
    } catch (error) {
      console.error("Error fetching unassigned tickets:", error);
      toast.error("Failed to load unassigned tickets");
      setUnassignedTickets([]);
      setTotalEntries(0);
      setCurrentEntries({ start: 0, end: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const openAssignmentModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowAssignmentModal(true);
  };

  const handleAssignmentSuccess = () => {
    fetchUnassignedTickets();
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority) => {
    if (!priority) return "bg-gray-100 text-gray-800";

    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high" || priorityLower === "critical")
      return "bg-red-100 text-red-800";
    if (priorityLower === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  // Calculate page count based on total entries
  const pageCount = Math.max(1, Math.ceil(totalEntries / pageSize));

  return (
    <div className="flex w-full h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-4 max-w-full">
          {/* Condensed Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Dispatcher Dashboard
              </h1>
              <p className="text-gray-500 text-sm">
                Assign unassigned tickets to support staff members
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentPage(0);
                setSearchTerm("");
                fetchUnassignedTickets();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Search bar in a row with other controls */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-64">
              <input
                ref={searchInputRef}
                type="text"
                className="border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Search tickets..."
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

          {/* Tickets Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading tickets...</p>
              </div>
            ) : !unassignedTickets.length ? (
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
                    ? "No matching tickets found"
                    : "No unassigned tickets available"}
                </p>
                <button
                  onClick={() => {
                    setCurrentPage(0);
                    setSearchTerm("");
                    fetchUnassignedTickets();
                  }}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 mx-auto text-sm"
                >
                  <FiRefreshCw size={16} />
                  Refresh Tickets
                </button>
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Ticket ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Summary
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Requestor
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Created At
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {unassignedTickets.map((ticket, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {ticket.ticket_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800 max-w-xs truncate">
                          {ticket.summary}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${getPriorityBadgeClass(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {ticket.created_by}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <button
                            onClick={() => openAssignmentModal(ticket)}
                            className="text-blue-600 hover:text-blue-900 py-1 px-2 rounded bg-blue-50 hover:bg-blue-100 transition-colors text-xs"
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Compact Pagination Controls */}
          {totalEntries > 0 && (
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

          {/* DispatcherAssignmentModal */}
          {showAssignmentModal && selectedTicket && (
            <DispatcherAssignmentModal
              isOpen={showAssignmentModal}
              onClose={() => setShowAssignmentModal(false)}
              ticket={selectedTicket}
              onAssignmentSuccess={handleAssignmentSuccess}
            />
          )}
        </div>
      </main>
      <ChatbotPopup />
      <ToastContainer position="bottom-top" autoClose={3000} />
    </div>
  );
}
