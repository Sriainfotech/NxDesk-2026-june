import { useState, useEffect } from "react";
import { Search, Paperclip, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatbotPopup from "../components/ChatBot";
import ReactPaginate from "react-paginate";
import { axiosInstance } from "../utils/axiosInstance";
import { useSelector } from "react-redux";

export default function GroupTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const userProfile = useSelector((state) => state.userProfile.user);

  // Fetch tickets whenever page, pageSize, or searchTerm changes
  useEffect(() => {
    fetchTickets();
  }, [currentPage, pageSize, searchTerm, sortConfig]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("No access token found. Please log in.");
      }

      const limit = pageSize;
      const offset = currentPage * pageSize;

      // Add search and sort parameters to the API call
      let url = `/solution_grp/tickets/?limit=${limit}&offset=${offset}`;

      // Add search parameter if there's a search term
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      // Add sort parameter if sorting is specified
      if (sortConfig.key) {
        // API might expect sort parameters like 'sort=created_at' and 'order=desc'
        url += `&sort=${sortConfig.key}&order=${sortConfig.direction}`;
      }

      const response = await axiosInstance.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("API Response:", response.data);

      const allTickets = response.data || response.data.results?.all_ticket || [];

      if (!Array.isArray(allTickets)) {
        throw new Error("Invalid data format: expected an array of tickets");
      }

      setTickets(allTickets);
      setTotalEntries(response.data.count); // Django pagination returns 'count'

      // Calculate current entries based on API response
      const start = allTickets.length > 0 ? offset + 1 : 0;
      const end = offset + allTickets.length;
      setCurrentEntries({ start, end });

      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tickets:", err.response ? err.response.data : err.message);
      setTickets([]);
      setTotalEntries(0);
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
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
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when search changes
  };

  const handleTicketClick = (ticketId) => {
    window.location.href = `/request-issue/application-support/sap/resolve-issue/${ticketId}`;
  };

  // Fixed toLowerCase() for null/undefined values
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case "open":
        return " text-blue-800";
      case "in progress":
      case "working in progress":
        return " text-yellow-800";
      case "resolved":
        return " text-green-800";
      case "closed":
        return " text-red-800";
      default:
        return " text-blue-800";
    }
  };

  // Fixed toLowerCase() for null/undefined values
  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase() || '';
    switch (priorityLower) {
      case "urgent":
        return " text-red-800";
      case "high":
        return " text-orange-800";
      case "medium":
        return " text-yellow-800";
      case "low":
        return " text-green-800";
      default:
        return " text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
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

  // Fixed toLowerCase() for null/undefined values
  const getSLAStatus = (ticket) => {
    if (!ticket || !ticket.created_at) {
      return { status: "Unknown", color: " text-gray-800" };
    }

    try {
      const createdDate = new Date(ticket.created_at);
      const currentDate = new Date();
      const diffHours = Math.floor((currentDate - createdDate) / (1000 * 60 * 60));

      const slaThresholds = {
        urgent: 4,
        high: 8,
        medium: 24,
        low: 48,
      };

      const priority = ticket.priority?.toLowerCase() || 'medium';
      const threshold = slaThresholds[priority] || 24;
      const status = ticket.status?.toLowerCase() || '';

      if (status === "resolved" || status === "closed") {
        return { status: "Completed", color: " text-green-800" };
      } else if (diffHours >= threshold) {
        return { status: "Breached", color: " text-red-800" };
      } else if (diffHours >= threshold * 0.75) {
        return { status: "At Risk", color: " text-orange-800" };
      } else {
        return { status: "On Track", color: " text-green-800" };
      }
    } catch (error) {
      console.error("Error calculating SLA status:", error);
      return { status: "Error", color: " text-gray-800" };
    }
  };

  // Filter functions with null checks
  const getOpenTickets = () => {
    return tickets.filter((t) => t.status?.toLowerCase() === "open").length;
  };

  const getInProgressTickets = () => {
    return tickets.filter((t) => t.status?.toLowerCase() === "working in progress").length;
  };

  // Calculate page count based on total entries from API
  const pageCount = Math.max(1, Math.ceil(totalEntries / pageSize));

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Group Tickets</h3>
              <p className="text-gray-600 mt-2">Tickets of your Solution Group</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 transition-colors"
                onClick={() => window.location.href = "/request-issue/application-support/sap/create-issue"}
              >
                New Ticket
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 rounded-lg border w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <ul className="grid grid-cols-3 gap-4 text-gray-800 text-sm font-medium">
              <li className="px-3 py-2 border rounded text-center shadow-sm bg-white">
                {totalEntries} Total
              </li>
              <li className="px-3 py-2 border rounded text-center shadow-sm bg-white">
                {getOpenTickets()} Open
              </li>
              <li className="px-3 py-2 border rounded text-center shadow-sm bg-white">
                {getInProgressTickets()} In Progress
              </li>
            </ul>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock size={16} />
                <span>Last updated: {lastUpdated}</span>
              </div>
              <button
                onClick={() => {
                  setCurrentPage(0);
                  fetchTickets();
                }}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 bg-white rounded-md shadow-sm mt-4 p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-white rounded-md shadow-sm mt-4 p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="mt-4 text-red-500">{error}</p>
              <button
                onClick={fetchTickets}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {tickets.length > 0 ? (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="w-8 px-3 py-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </th>
                        <th className="w-8 px-3 py-2"></th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("ticket_id")}
                        >
                          <div className="flex items-center gap-1">
                            Number
                            {sortConfig.key === "ticket_id" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("issue_type")}
                        >
                          <div className="flex items-center gap-1">
                            Type
                            {sortConfig.key === "issue_type" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("summary")}
                        >
                          <div className="flex items-center gap-1">
                            Summary
                            {sortConfig.key === "summary" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("status")}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {sortConfig.key === "status" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("priority")}
                        >
                          <div className="flex items-center gap-1">
                            Priority
                            {sortConfig.key === "priority" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("product")}
                        >
                          <div className="flex items-center gap-1">
                            Product
                            {sortConfig.key === "product" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => requestSort("created_at")}
                        >
                          <div className="flex items-center gap-1">
                            Created
                            {sortConfig.key === "created_at" && (
                              <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 text-sm">SLA Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 text-sm">Files</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.map((ticket, index) => {
                        const sla = getSLAStatus(ticket);
                        return (
                          <tr
                            key={ticket.ticket_id || index}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${index % 2 === 1 ? "bg-gray-50" : ""
                              }`}
                            onClick={() => handleTicketClick(ticket.ticket_id)}
                          >
                            <td className="w-8 px-3 py-2">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="w-8 px-3 py-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-blue-500">
                                <span className="text-xs">i</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-blue-600">{ticket.ticket_id || 'N/A'}</td>
                            <td className="px-3 py-2 text-sm">{ticket.issue_type || 'N/A'}</td>
                            <td className="px-3 py-2 text-sm font-medium">
                              {ticket.summary ?
                                (ticket.summary.length > 30 ? ticket.summary.substring(0, 30) + "..." : ticket.summary)
                                : 'N/A'}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                              >
                                {ticket.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm">{ticket.product || 'N/A'}</td>
                            <td className="px-3 py-2 text-sm">{formatDate(ticket.created_at)}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${sla.color}`}>
                                {sla.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {ticket.attachments && ticket.attachments.length > 0 ? (
                                <div className="flex items-center">
                                  <Paperclip className="w-4 h-4 text-gray-400 mr-1" />
                                  <span>{ticket.attachments.length}</span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                    <div className="mb-4 md:mb-0 flex items-center">
                      <div className="ml-4">
                        <label htmlFor="pageSize" className="mr-2 text-sm">
                          Items per page:
                        </label>
                        <select
                          id="pageSize"
                          value={pageSize}
                          onChange={handlePageSizeChange}
                          className="border rounded-md p-1 text-sm"
                        >
                          <option value="2">2</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                        {totalEntries > 0 && (
                          <span className="ml-4 text-sm">
                            Showing {currentEntries.start} to {currentEntries.end} of {totalEntries} entries
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <ReactPaginate
                        previousLabel={<ChevronLeft size={16} className="text-gray-500" />}
                        nextLabel={<ChevronRight size={16} className="text-gray-500" />}
                        breakLabel={"..."}
                        pageCount={pageCount}
                        marginPagesDisplayed={2}
                        pageRangeDisplayed={3}
                        onPageChange={handlePageClick}
                        forcePage={currentPage}
                        containerClassName="flex space-x-1"
                        pageClassName="p-1 border border-gray-300 rounded bg-white w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 text-sm"
                        activeClassName="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                        previousClassName="p-1 border border-gray-300 rounded bg-white w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100"
                        nextClassName="p-1 border border-gray-300 rounded bg-white w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100"
                        disabledClassName="opacity-50 cursor-not-allowed"
                        breakClassName="p-1 border border-gray-300 rounded bg-white w-8 h-8 flex items-center justify-center"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  {searchTerm ? "No tickets match your search criteria" : "No tickets found"}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 flex items-center justify-center">
            {/* Optional performance metrics could go here */}
          </div>
        </div>
      </main>
      <ChatbotPopup />
    </div>
  );
}