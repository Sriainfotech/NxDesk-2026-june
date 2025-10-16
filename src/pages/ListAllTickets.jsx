"use client";
import { useState, useEffect } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import { Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatbotPopup from "../components/ChatBot";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";

export default function ListAllTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentEntries, setCurrentEntries] = useState({
    start: 0,
    end: 0,
  });

  // Updated status options with corrected naming and added "Open"
  const statusOptions = [
    "All",
    "Open",
    "Working in Progress",
    "Waiting for User",
    "Delegated",
    "Breach",
    "Resolved",
    "Close",
  ];

  // Filter tickets based on search term (only ticket_id) and status filter
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = (ticket.ticket_id || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate pagination values
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const offset = currentPage * pageSize;
  const currentItems = filteredTickets.slice(offset, offset + pageSize);

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Update current entries information when data changes
  useEffect(() => {
    const start = filteredTickets.length > 0 ? offset + 1 : 0;
    const end = Math.min(offset + pageSize, filteredTickets.length);
    setCurrentEntries({ start, end });
    setTotalEntries(filteredTickets.length);
  }, [filteredTickets.length, offset, pageSize]);

  // Ensure currentPage is never out of bounds
  useEffect(() => {
    if (
      currentPage >= pageCount &&
      pageCount > 0 &&
      filteredTickets.length > 0
    ) {
      setCurrentPage(Math.max(0, pageCount - 1));
    }
  }, [filteredTickets.length, pageCount, currentPage]);

  const fetchTickets = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      toast.error("Please log in to access this page.");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get("/ticket/all/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(response);
      if (response.status === 200) {
        setTickets(response.data.results);
        setCurrentPage(0);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(0); // Reset to first page when changing filter
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  // Helper function to display "-" for missing data
  const displayValue = (value) => {
    return value ? value : "-";
  };

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <main className="flex-1 mx-16">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">All Tickets</h1>
            <p className="text-sm text-muted-foreground mt-2">
              View and search all tickets in the system
            </p>
          </div>

          {/* Updated layout with search on left and status filter on right */}
          <div className="flex items-center justify-between mt-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ticket number..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-3 rounded-xl border w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="flex items-center">
              <label htmlFor="statusFilter" className="mr-2 font-medium">
                Status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-md border overflow-hidden mt-8">
            {loading ? (
              <div className="p-4 text-center">Loading tickets...</div>
            ) : !filteredTickets.length ? (
              <div className="p-4 text-center">
                {searchTerm || statusFilter !== "All"
                  ? "No matching tickets found"
                  : "No tickets found"}
              </div>
            ) : (
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-200">
                    {/* Number aligned left */}
                    <th className="px-4 py-2 text-left font-medium">Number</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Requestor
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Issue Type
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Description
                    </th>
                    {/* Status aligned right */}
                    <th className="px-4 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((ticket, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100`}
                    >
                      <td className="px-4 py-2">
                        {displayValue(ticket.ticket_id)}
                      </td>
                      <td className="px-4 py-2">
                        {displayValue(ticket.created_by)}
                      </td>
                      <td className="px-4 py-2">
                        {displayValue(ticket.issue_type)}
                      </td>
                      <td
                        className="px-4 py-2 truncate max-w-md"
                        title={ticket.description}
                      >
                        {displayValue(ticket.description)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {ticket.status ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              ticket.status === "Open"
                                ? "bg-yellow-100 text-yellow-800"
                                : ticket.status === "Working in Progress"
                                ? "bg-blue-100 text-blue-800"
                                : ticket.status === "Waiting for User"
                                ? "bg-orange-100 text-orange-800"
                                : ticket.status === "Delegated"
                                ? "bg-purple-100 text-purple-800"
                                : ticket.status === "Breach"
                                ? "bg-red-100 text-red-800"
                                : ticket.status === "Resolved"
                                ? "bg-green-100 text-green-800"
                                : ticket.status === "Close"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination and Page Size Controls */}
          {filteredTickets.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4">
              <div className="mb-4 md:mb-0">
                <label htmlFor="pageSize" className="mr-2 text-sm">
                  Items per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="border rounded-md p-1"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                {totalEntries > 0 && (
                  <span className="ml-4 text-sm">
                    Showing {currentEntries.start} to {currentEntries.end} of{" "}
                    {totalEntries} entries
                  </span>
                )}
              </div>

              <ReactPaginate
                previousLabel={"← Previous"}
                nextLabel={"Next →"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                forcePage={currentPage}
                containerClassName="flex space-x-2"
                pageClassName="px-3 py-1 border rounded-md cursor-pointer hover:bg-gray-300"
                activeClassName="bg-blue-500 text-white"
                previousClassName="px-3 py-1 border rounded-md cursor-pointer hover:bg-gray-300"
                nextClassName="px-3 py-1 border rounded-md cursor-pointer hover:bg-gray-300"
                disabledClassName="opacity-50 cursor-not-allowed"
              />
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
