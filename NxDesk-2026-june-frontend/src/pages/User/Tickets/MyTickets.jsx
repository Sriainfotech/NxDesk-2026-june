import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import ChatbotPopup from "../../../components/ChatBot";
import ReactPaginate from "react-paginate";
import { axiosInstance } from "../../../utils/axiosInstance";
import { useSelector } from "react-redux";

export default function MyTickets() {
  const [allTickets, setAllTickets] = useState([]); // Store all tickets from backend
  const [filteredTickets, setFilteredTickets] = useState([]); // Store filtered tickets
  const [displayedTickets, setDisplayedTickets] = useState([]); // Store current page tickets
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(15); // Match AssignedToMe default
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const accessToken = localStorage.getItem("access_token");

      try {
        const response = await axiosInstance.get("/org/employee/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log("Employee Data:", response.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchEmployeeData();
  }, []);

  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc", // Default to newest first
  });
  const [lastUpdated, setLastUpdated] = useState(
    new Date().toLocaleTimeString()
  );

  const userProfile = useSelector((state) => state.userProfile.user);

  // Initial fetch of all tickets
  useEffect(() => {
    fetchAllTickets();
  }, []);

  // Apply search, sort, and pagination whenever relevant state changes
  useEffect(() => {
    applyFiltersAndPagination();
  }, [allTickets, searchTerm, sortConfig, currentPage, pageSize]);

  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("No access token found. Please log in.");
      }

      // Fetch all tickets without any search/pagination parameters
      const url = `/ticket/all/?created=True&limit=1000`; // Fetch a large number to get all tickets

      console.log("Fetching all tickets with URL:", url);

      const response = await axiosInstance.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("API Response:", response.data);

      const ticketsData =
        response.data.results?.all_tickets ||
        response.data.results?.all_ticket ||
        response.data.results ||
        [];

      if (!Array.isArray(ticketsData)) {
        throw new Error("Invalid data format: expected an array of tickets");
      }

      setAllTickets(ticketsData);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error(
        "Error fetching tickets:",
        err.response ? err.response.data : err.message
      );

      setError(err.message || "Failed to fetch tickets");
      setAllTickets([]);
      setLoading(false);
    }
  };

  // Apply search, sorting, and pagination
  const applyFiltersAndPagination = () => {
    let filtered = [...allTickets];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((ticket) => {
        const searchFields = [
          ticket.ticket_id?.toString(),
          ticket.summary,
          ticket.status,
          ticket.priority,
          ticket.issue_type,
          ticket.product,
          ticket.assigned_to,
          ticket.requester,
        ];

        return searchFields.some((field) =>
          field?.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle different data types
        if (
          sortConfig.key === "created_at" ||
          sortConfig.key === "updated_at"
        ) {
          // Handle date sorting
          aVal = new Date(aVal || 0);
          bVal = new Date(bVal || 0);
        } else if (sortConfig.key === "ticket_id") {
          // Handle numeric sorting for ticket IDs
          aVal = parseInt(aVal) || 0;
          bVal = parseInt(bVal) || 0;
        } else {
          // Handle string sorting
          aVal = aVal?.toString().toLowerCase() || "";
          bVal = bVal?.toString().toLowerCase() || "";
        }

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;

        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    setFilteredTickets(filtered);

    // Apply pagination
    const totalFilteredEntries = filtered.length;
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTickets = filtered.slice(startIndex, endIndex);

    setDisplayedTickets(paginatedTickets);

    // Calculate current entries
    const start = paginatedTickets.length > 0 ? startIndex + 1 : 0;
    const end = Math.min(endIndex, totalFilteredEntries);
    setCurrentEntries({ start, end });
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(0); // Reset to first page when sorting changes
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number.parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when page size changes
  };

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setCurrentPage(0); // Reset to first page when search changes
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(0);
  };

  const handleTicketClick = (ticketId) => {
    window.location.href = `/request-issue/application-support/sap/resolve-issue/${ticketId}`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in progress":
      case "working in progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const getOpenTickets = () => {
    return filteredTickets.filter((t) => t.status?.toLowerCase() === "open")
      .length;
  };

  const getInProgressTickets = () => {
    return filteredTickets.filter(
      (t) =>
        t.status?.toLowerCase() === "working in progress" ||
        t.status?.toLowerCase() === "in progress"
    ).length;
  };

  // Calculate page count based on filtered results
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize));

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col p-3 max-w-full">
          {/* Compact Header */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Incidents Created by You
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                onClick={() => (window.location.href = "/request-issue/")}
              >
                New Incident
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Incidents..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 pr-4 py-1.5 rounded border w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                {searchTerm && (
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    {filteredTickets.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compact Stats Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 text-xs font-medium flex-wrap">
              <span className="px-2 py-1 bg-white border rounded shadow-sm min-w-[80px] text-center">
                Total: {filteredTickets.length}
                {searchTerm && " (filtered)"}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm min-w-[80px] text-center">
                Open: {getOpenTickets()}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm min-w-[80px] text-center">
                In Progress: {getInProgressTickets()}
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm min-w-[80px] text-center">
                Waiting for User:{" "}
                {
                  filteredTickets.filter(
                    (t) =>
                      t.status?.toLowerCase() === "waiting for user response"
                  ).length
                }
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm min-w-[80px] text-center">
                Resolved:{" "}
                {
                  filteredTickets.filter(
                    (t) => t.status?.toLowerCase() === "resolved"
                  ).length
                }
              </span>
              <span className="px-2 py-1 bg-white border rounded shadow-sm min-w-[80px] text-center">
                Delegate:{" "}
                {
                  filteredTickets.filter(
                    (t) => t.status?.toLowerCase() === "delegated"
                  ).length
                }
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock size={12} />
                <span>{lastUpdated}</span>
              </div>
              <button
                onClick={() => {
                  setCurrentPage(0);
                  fetchAllTickets();
                }}
                className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded border">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading tickets...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded border">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="mt-2 text-sm text-red-500">{error}</p>
                <button
                  onClick={fetchAllTickets}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col bg-white border rounded overflow-hidden">
              {displayedTickets.length > 0 ? (
                <>
                  {/* Table with proper sizing - no flex-1 to prevent stretching */}
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th
                            className="px-2 py-2.5 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-xs"
                            onClick={() => requestSort("ticket_id")}
                          >
                            <div className="flex items-center gap-1">
                              Incident ID
                              {sortConfig.key === "ticket_id" && (
                                <span className="text-xs">
                                  {sortConfig.direction === "asc" ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            className="px-2 py-2.5 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-xs"
                            onClick={() => requestSort("summary")}
                          >
                            <div className="flex items-center gap-1">
                              Summary
                              {sortConfig.key === "summary" && (
                                <span className="text-xs">
                                  {sortConfig.direction === "asc" ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            className="px-2 py-2.5 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-xs"
                            onClick={() => requestSort("status")}
                          >
                            <div className="flex items-center gap-1">
                              Status
                              {sortConfig.key === "status" && (
                                <span className="text-xs">
                                  {sortConfig.direction === "asc" ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            className="px-2 py-2.5 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-xs"
                            onClick={() => requestSort("priority")}
                          >
                            <div className="flex items-center gap-1">
                              Priority
                              {sortConfig.key === "priority" && (
                                <span className="text-xs">
                                  {sortConfig.direction === "asc" ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            className="px-2 py-2.5 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-xs"
                            onClick={() => requestSort("created_at")}
                          >
                            <div className="flex items-center gap-1">
                              Created
                              {sortConfig.key === "created_at" && (
                                <span className="text-xs">
                                  {sortConfig.direction === "asc" ? "▲" : "▼"}
                                </span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedTickets.map((ticket, index) => {
                          return (
                            <tr
                              key={ticket.ticket_id || index}
                              className={`hover:bg-gray-50 cursor-pointer transition-colors text-xs ${
                                index % 2 === 1 ? "bg-gray-25" : ""
                              }`}
                              onClick={() =>
                                handleTicketClick(ticket.ticket_id)
                              }
                            >
                              <td className="px-2 py-2 font-medium text-blue-600">
                                {ticket.ticket_id || "N/A"}
                              </td>
                              <td className="px-2 py-2 font-medium max-w-xs">
                                <div
                                  className="truncate"
                                  title={ticket.summary}
                                >
                                  {ticket.summary || "N/A"}
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                    ticket.status
                                  )}`}
                                >
                                  {ticket.status || "N/A"}
                                </span>
                              </td>
                              <td className="px-2 py-2 font-medium">
                                {ticket.priority || "N/A"}
                              </td>
                              <td className="px-2 py-2">
                                {formatDate(ticket.created_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer - now directly follows table content */}
                  {filteredTickets.length > 0 && (
                    <div className="flex justify-between items-center p-2 border-t bg-gray-50 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <label htmlFor="pageSize">Per page:</label>
                          <select
                            id="pageSize"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="border rounded px-1 py-0.5 text-xs"
                          >
                            <option value="2">2</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                        <span>
                          {filteredTickets.length <= pageSize
                            ? `Showing all ${filteredTickets.length} ${
                                filteredTickets.length === 1
                                  ? "entry"
                                  : "entries"
                              }`
                            : `${currentEntries.start}-${currentEntries.end} of ${filteredTickets.length}`}
                        </span>
                      </div>

                      {/* Only show pagination controls if there are multiple pages */}
                      {pageCount > 1 && (
                        <ReactPaginate
                          previousLabel={<ChevronLeft size={12} />}
                          nextLabel={<ChevronRight size={12} />}
                          breakLabel={"..."}
                          pageCount={pageCount}
                          marginPagesDisplayed={1}
                          pageRangeDisplayed={2}
                          onPageChange={handlePageClick}
                          forcePage={currentPage}
                          containerClassName="flex space-x-1"
                          pageClassName="px-2 py-1 border rounded bg-white cursor-pointer hover:bg-gray-100 text-xs"
                          activeClassName="bg-blue-500 text-black border-blue-500"
                          previousClassName="px-1 py-1 border rounded bg-white cursor-pointer hover:bg-gray-100"
                          nextClassName="px-1 py-1 border rounded bg-white cursor-pointer hover:bg-gray-100"
                          disabledClassName="opacity-50 cursor-not-allowed"
                          breakClassName="px-2 py-1"
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center text-gray-500 text-sm p-8">
                  {searchTerm ? (
                    <div className="text-center">
                      <p>No tickets match "{searchTerm}"</p>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-1 text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    "No tickets found"
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <ChatbotPopup />
    </div>
  );
}
