import React from 'react'
import { useState, useEffect } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import {
  Search,
  Bell,
  ChevronDown,
  BarChart2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Settings,
  Filter,
  MoreHorizontal
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatbotPopup from "../components/ChatBot";

function Overview() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    medium: 0,
    low: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1

  });
  const [slaStats, setSlaStats] = useState([])

  useEffect(() => {
    fetchTickets();
    fetchCount();
    sla()
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

      console.log(data)

      // Transform the API response to match the expected ticket format
      const formattedTickets = data.results.map(ticket => ({
        id: ticket.ticket_id.substring(0, 8).toUpperCase(),
        title: ticket.summary,
        status: 0,
        assignee: ticket.assignee || "Unassigned",
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

  const fetchCount = async () => {
    try {
      const response = await axiosInstance.get("ticket/tickets/total/count", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      const data = response.data;
      console.log("data", data)
      setStats({
        total: data.total_tickets,
        open: data.open,
        inProgress: data.inprogress,
        resolved: data.resolved,
        critical: data.critical,
        medium: data.medium,
        low: data.low
      });
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
    }
  };

  const sla = async () => {
    try {
      const value = await axiosInstance.get("ticket/sla-dashboard/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      const data = value.data;
      console.log("sla", data)
      setSlaStats(data);
    } catch (error) {
      console.error("Error fetching SLA stats:", error);
    }

  };

  // Helper function to format date from API
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };



  // Calculate current page from next/previous URLs
  const calculateCurrentPage = (next, previous) => {
    if (!next && !previous) return 1;
    if (!previous) return 1;
    if (!next) {
      // Extract the offset from the previous URL and calculate page
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
  console.log(stats)

  console.log("tickets", tickets)
  console.log("pagination", pagination)
  console.log("loading", loading)
  console.log("stats", stats)
  console.log("selectedTab", selectedTab)

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-blue-100">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Tickets</p>
              <h3 className="text-xl font-bold">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-blue-100">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Open</p>
              <h3 className="text-xl font-bold">{stats.open}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-yellow-100">
              <BarChart2 size={20} className="text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">In Progress</p>
              <h3 className="text-xl font-bold">{stats.inProgress}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-green-100">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Resolved</p>
              <h3 className="text-xl font-bold">{stats.resolved}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-red-100">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Critical</p>
              <h3 className="text-xl font-bold">{stats.critical}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Ticket Status Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-end space-x-6 h-48">
              <div className="flex flex-col items-center">
                <div className="w-16 bg-blue-500 rounded-t-md" style={{ height: `${(stats.open / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">Open</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-yellow-500 rounded-t-md" style={{ height: `${(stats.inProgress / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">In Progress</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-green-500 rounded-t-md" style={{ height: `${(stats.resolved / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">Resolved</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-red-500 rounded-t-md" style={{ height: `${(stats.critical / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">Critical</p>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Ticket Status Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-end space-x-6 h-48">
            <div className="flex flex-col items-center">
                <div className="w-16 bg-red-500 rounded-t-md" style={{ height: `${(stats.critical / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">High</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-yellow-500 rounded-t-md" style={{ height: `${(stats.medium / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">Medium</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 bg-green-500 rounded-t-md" style={{ height: `${(stats.high / stats.total) * 200}px` }}></div>
                <p className="mt-2 text-sm">Low</p>
              </div>
             
            </div>
          </div>
        </div> */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Response Time Trends</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-full h-48">
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200"></div>
              <div className="absolute left-0 bottom-0 h-full w-px bg-gray-200"></div>

              <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                <path
                  d="M0,150 L30,120 L60,130 L90,80 L120,100 L150,70 L180,50 L210,60 L240,40 L270,30 L300,10"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                />
                <path
                  d="M0,150 L30,120 L60,130 L90,80 L120,100 L150,70 L180,50 L210,60 L240,40 L270,30 L300,10"
                  fill="url(#blue-gradient)"
                  fillOpacity="0.2"
                />
                <defs>
                  <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute bottom-0 left-0 text-xs text-gray-500">Jan</div>
              <div className="absolute bottom-0 left-1/4 text-xs text-gray-500">Apr</div>
              <div className="absolute bottom-0 left-1/2 text-xs text-gray-500">Jul</div>
              <div className="absolute bottom-0 left-3/4 text-xs text-gray-500">Oct</div>
            </div>
          </div>
        </div>
      </div>

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{ticket.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{ticket.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.assignee}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.updated}</td>
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

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-lg font-medium mb-4">Team Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Pawan Raj</span>
                <span className="text-sm text-gray-500">25 tickets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Ved Kalyan</span>
                <span className="text-sm text-gray-500">18 tickets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Mike walle</span>
                <span className="text-sm text-gray-500">12 tickets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Sarah Williams</span>
                <span className="text-sm text-gray-500">15 tickets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">David Brown</span>
                <span className="text-sm text-gray-500">9 tickets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">SLA Compliance</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-gray-500">Active</p>
              <h3 className="text-2xl font-bold text-green-600">{slaStats.active_count || 0}</h3>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <p className="text-sm text-gray-500">At Risk</p>
              <h3 className="text-2xl font-bold text-yellow-600">{slaStats.at_risk_tickets?.length || 0}</h3>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-sm text-gray-500">Breached</p>
              <h3 className="text-2xl font-bold text-red-600">{slaStats.breached_count || 0}</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-500">Paused</p>
              <h3 className="text-2xl font-bold text-blue-600">{slaStats.paused_count || 0}</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500">Stopped</p>
              <h3 className="text-2xl font-bold text-gray-600">{slaStats.stopped_count || 0}</h3>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-500">Breach %</p>
              <h3 className="text-2xl font-bold text-purple-600">{slaStats.breach_percentage || 0}%</h3>
            </div>
          </div>
          <div className="h-48 flex items-center justify-center">
            <div className="w-48 h-48 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="15" /> 
                {/* Calculate the stroke-dashoffset based on breach percentage */}
                {/* Formula: circumference * (1 - percentage/100) where circumference = 2πr = 2 * 3.14159 * 40 = 251.2 */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="15"
                  strokeDasharray="251.2"
                  strokeDashoffset={(251.2 * (slaStats.breach_percentage || 0)) / 100}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="50" fontFamily="sans-serif" fontSize="14" textAnchor="middle" dy="7" fill="#111827" >
                  {100 - (slaStats.breach_percentage || 0)}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview