import React, { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../../../utils/axiosInstance";
import { ChevronDown, Eye, Search } from "lucide-react";

const ReferenceTicketSelector = ({ value, onChange, isOptional = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketList, setTicketList] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState(
    Array.isArray(value) ? value : []
  );
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (
      Array.isArray(value) &&
      JSON.stringify(value) !== JSON.stringify(selectedTickets)
    ) {
      onChange({ target: { name: "referenceTicket", value: selectedTickets } });
    }
  }, [selectedTickets]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }

      const response = await axiosInstance.get("ticket/list/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setTicketList(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    setLoadingDetails(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }

      const response = await axiosInstance.get(`ticket/tickets/${ticketId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setTicketDetails(response.data);
      setShowTicketPopup(true);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const addTicket = (ticket) => {
    if (!selectedTickets.includes(ticket.ticket_id)) {
      setSelectedTickets([...selectedTickets, ticket.ticket_id]);
      setSearchTerm("");
    }
  };

  const removeTicket = (ticketToRemove) => {
    setSelectedTickets(
      selectedTickets.filter((ticket) => ticket !== ticketToRemove)
    );
  };

  const filteredTickets = ticketList.filter((ticket) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      (ticket.ticket_id?.toLowerCase() || "").includes(lowerSearchTerm) ||
      (ticket.summary?.toLowerCase() || "").includes(lowerSearchTerm)
    );
  });

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleViewTicket = (e, ticketId) => {
    e.stopPropagation();
    e.preventDefault();
    fetchTicketDetails(ticketId);
  };

  const handleClosePopup = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowTicketPopup(false);
  };

  return (
    <div className="space-y-1">
      <div className="relative" ref={dropdownRef}>
        {/* Selected ticket tags */}
        {selectedTickets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTickets.map((ticket) => (
              <div
                key={ticket}
                className="bg-blue-100 text-blue-800  px-3 py-1 text-sm flex items-center"
              >
                {ticket}
                <button
                  type="button"
                  onClick={() => removeTicket(ticket)}
                  className="ml-2 text-blue-800 hover:text-blue-600 font-bold"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input box and toggle */}
        <div
          className={`flex items-center border  w-full ${
            isOpen ? "ring-2 ring-blue-100 border-blue-600" : ""
          }`}
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Search tickets..."
            className="px-2 py-1 flex-grow outline-none bg-transparent text-gray-900"
          />
          <div
            onClick={toggleDropdown}
            className="flex items-center justify-center px-2 h-full border-l cursor-pointer"
          >
            <Search size={16} className="text-blue-600" />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-blue-500  shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                Loading tickets...
              </div>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  className={`p-3 text-sm cursor-pointer hover:bg-blue-50 flex ${
                    selectedTickets.includes(ticket.ticket_id)
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-700"
                  }`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      addTicket(ticket);
                    }}
                    className="flex-grow overflow-hidden"
                  >
                    <div className="font-medium">{ticket.ticket_id}</div>
                    <div className="text-gray-500 text-xs break-words whitespace-normal mt-1 pr-2">
                      {ticket.summary}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-start">
                    <button
                      type="button"
                      onClick={(e) => handleViewTicket(e, ticket.ticket_id)}
                      className="p-1  hover:bg-blue-200 text-blue-700 flex items-center justify-center"
                      title="View ticket details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                {ticketList.length === 0
                  ? "No tickets available"
                  : "No matching tickets"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ticket details popup */}
      {showTicketPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleClosePopup}
        >
          <div
            className="bg-white  shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Ticket Details
              </h2>
              <button
                type="button"
                onClick={handleClosePopup}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-8 text-center text-gray-500">
                Loading ticket details...
              </div>
            ) : ticketDetails ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Ticket ID</p>
                  <p className="text-sm text-gray-900">
                    {ticketDetails.ticket_id}
                  </p>
                </div>

                {ticketDetails.created_by && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Requestor
                    </p>
                    <p className="text-sm text-gray-900">
                      {ticketDetails.created_by}
                    </p>
                  </div>
                )}
                {ticketDetails.issue_type && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Issue Type
                    </p>
                    <p className="text-sm text-gray-900">
                      {ticketDetails.issue_type}
                    </p>
                  </div>
                )}

                {ticketDetails.summary && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Summary</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line break-words">
                      {ticketDetails.summary}
                    </p>
                  </div>
                )}
                {ticketDetails.solution_grp && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Solution Group
                    </p>
                    <p className="text-sm text-gray-900">
                      {ticketDetails.solution_grp}
                    </p>
                  </div>
                )}

                {ticketDetails.status && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="text-sm text-gray-900">
                      {ticketDetails.status}
                    </p>
                  </div>
                )}

                {ticketDetails.created_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Created At
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(ticketDetails.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Failed to load ticket details
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClosePopup}
                className="px-4 py-2 bg-blue-600 text-white  hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceTicketSelector;
