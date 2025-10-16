import React, { useEffect, useState } from 'react'
import { axiosInstance } from '../utils/axiosInstance';
import { Filter, MoreHorizontal } from 'lucide-react';

function Ticket() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async (url = "ticket/tickets/total/") => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      const data = response.data;

      console.log("data", data)

      const formattedTickets = data.results.map(ticket => ({
        id: ticket.ticket_id.substring(0, 8).toUpperCase(),
        title: ticket.summary,
        status: ticket.status.toLowerCase(),
        assignee: ticket.assignee || "Unassigned",
        impact: forImpact(ticket.impact).label,
        created: formatDate(ticket.created_at),
        updated: formatDate(ticket.modified_at)
      }));

      console.log("formattedTickets", formattedTickets)

      setTickets(formattedTickets);
      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: calculateCurrentPage(data.next, data.previous)
      });


    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const forImpact = (impact) => {
    switch (impact) {
      case 'A':
        return { label: 'High', bgColor: 'bg-red-100', textColor: 'text-red-800' }; 
      case 'B':
        return { label: 'Medium', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' }; 
      case 'C':
        return { label: 'Low', bgColor: 'bg-green-100', textColor: 'text-green-800' }; 
      default:
        return { label: 'NA', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }; 
    }
  }
  const Impact = (impact) => {
    switch (impact) {
      case 'High':
        return 'bg-red-100 text-red-800'; 
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'; 
      case 'Low':
        return 'bg-green-100 text-green-800'; 
      default:
        return 'bg-gray-100 text-gray-800'; 
    }
  }
 
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; 
  };



  // Calculate current page from next/previous URLs
  const calculateCurrentPage = (next, previous) => {
    if (!next && !previous) return 1;
    if (!previous) return 1;
    if (!next) {
      const prevOffset = new URL(previous).searchParams.get('offset');
      const limit = new URL(previous).searchParams.get('limit');
      return Math.floor(parseInt(prevOffset) / parseInt(limit)) + 2;
    }

    const nextOffset = new URL(next).searchParams.get('offset');
    const limit = new URL(next).searchParams.get('limit');
    return Math.floor(parseInt(nextOffset) / parseInt(limit));
  };


  const handleNextPage = () => {
    if (pagination.next) {
      fetchTickets(pagination.next);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.previous) {
      fetchTickets(pagination.previous);
    }
  };

  const handlePageClick = (pageNum) => {
    const baseUrl = "/ticket/tickets/total/";
    const limit = 5; // Default limit from API
    const offset = (pageNum - 1) * limit;
    fetchTickets(`${baseUrl}?limit=${5}&offset=${offset}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'inProgress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'inProgress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'critical': return 'Critical';
      default: return status;
    }
  };

  console.log("tickets", tickets)


  return (
    <div>
      {/* Recent Tickets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-medium">Recent Tickets</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-md flex items-center text-sm">
              <Filter size={14} className="mr-1" />
              Filter
            </button>
            <button className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">
              + New Ticket
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">Loading tickets...</div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{ticket.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 max-w-32">{ticket.title.slice(0,16) + "..."}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.assignee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs rounded-full ${Impact(ticket.impact)}`}>
                          {ticket.impact}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.updated}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-500">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {tickets.length} of {pagination.count} tickets
          </p>
          <div className="flex space-x-1">
            <button
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${!pagination.previous ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handlePreviousPage}
              disabled={!pagination.previous}
            >
              Previous
            </button>

            {/* Generate page buttons */}
            {Array.from({ length: Math.min(3, Math.ceil(pagination.count / 10)) }, (_, i) => {
              const pageNum = pagination.currentPage - 1 + i;
              if (pageNum > 0 && pageNum <= Math.ceil(pagination.count / 10)) {
                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-1 border rounded-md text-sm ${pageNum === pagination.currentPage
                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                        : 'border-gray-300'
                      }`}
                    onClick={() => handlePageClick(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${!pagination.next ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleNextPage}
              disabled={!pagination.next}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ticket