import { useEffect, useState } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import Sidebar from "../components/Sidebar";
import ChatbotPopup from "../components/ChatBot";
import StatusProgressBar from "./common/sla/StatusProgressBar";
import TicketHeader from "./common/sla/TicketHeader";
import SLAInfoSection from "./common/sla/SLAInfoSection";
import TicketInfoSection from "./common/sla/TicketInfoSection";
import SolutionSection from "./common/sla/SolutionSection";
import MessageThread from "./common/sla/MessageThread";
import {
  Clock,
  Alert,
  AlertCircle,
  Calendar,
  User,
  Tag,
  FileText,
  Clipboard,
  CheckCircle,
} from "lucide-react";

export default function DetailsTicket({ ticketId }) {
  const [ticketData, setTicketData] = useState(null);
  const [sla, setSla] = useState(null);
  const [slaBreachStatus, setSlaBreachStatus] = useState(null);
  const [status, setStatus] = useState("");
  const [availableSolutions, setAvailableSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statuses = [
    "Open",
    "Working in Progress",
    "Waiting for User",
    "Resolved",
    "Closed",
    "Cancelled",
  ];

  // Check SLA breach
  useEffect(() => {
    const checkBreach = async () => {
      if (!ticketId) return;

      try {
        const token = localStorage.getItem("access_token");
        const response = await axiosInstance.get(
          `ticket/sla/${ticketId}/check-breach/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSlaBreachStatus(response.data);
      } catch (error) {
        console.error("Error while checking breach:", error);
        setError("Failed to load SLA breach information.");
      }
    };

    checkBreach();
  }, [ticketId]);

  // Fetch ticket data
  useEffect(() => {
    const fetchTicketData = async () => {
      if (!ticketId) return;
      setLoading(true);

      try {
        const token = localStorage.getItem("access_token");

        // Fetch ticket details
        const ticketResponse = await axiosInstance.get(
          `/ticket/tickets/${ticketId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Ticket Response:", ticketResponse);
        setTicketData(ticketResponse.data);
        setStatus(ticketResponse.status);

        // Fetch SLA information
        const SLAresponse = await axiosInstance.get(
          `/ticket/sla-timers/${ticketId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSla(SLAresponse.data);
        console.log("SLA Response:", SLAresponse);
        // Fetch available solutions
        const solutionsResponse = await axiosInstance.get(
          `/solution/solutions/${ticketId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Solutions Response:", solutionsResponse);
        setAvailableSolutions(solutionsResponse.data || []);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching ticket data:", error);
        setError("Failed to load ticket information.");
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [ticketId]);

  // Handle status change from child components
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);

    // Update ticketData status
    if (ticketData) {
      setTicketData({
        ...ticketData,
        status: newStatus,
      });
    }
  };

  const formatImpact = (input) => {
    if (!input) return "Unknown";

    if (input === "A" || input.toLowerCase() === "high") return "High";
    if (input === "B" || input.toLowerCase() === "medium") return "Medium";
    if (input === "C" || input.toLowerCase() === "low") return "Low";
    return input; // Return as is if already formatted
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex w-full min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ticket information...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="mt-4 text-red-600 font-medium">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }
  console.log("Ticket Data After update:", ticketData);
  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 mx-4 md:mx-8 lg:mx-16 my-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {ticketData && (
            <TicketHeader ticketData={ticketData} formatImpact={formatImpact} />
          )}

          <StatusProgressBar
            currentStatus={status}
            statuses={statuses}
            activeColor="bg-blue-600"
            inactiveColor="bg-gray-100"
            height="h-14"
          />

          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            <div className="lg:w-2/3">
              {sla && (
                <SLAInfoSection
                  sla={sla}
                  slaBreachStatus={slaBreachStatus}
                  status={status}
                  ticketData={ticketData}
                />
              )}

              {ticketData && (
                <TicketInfoSection
                  ticketData={ticketData}
                  formatDate={formatDate}
                  formatImpact={formatImpact}
                />
              )}

              <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <h2 className="font-bold text-xl mb-4 text-gray-800 flex items-center">
                  <FileText className="mr-2 text-blue-600" size={20} />
                  Issue Description
                </h2>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticketData?.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline component */}
            <div className="lg:w-1/3">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <Calendar className="mr-2 text-blue-600" size={20} />
                  Activity Timeline
                </h2>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-blue-200"></div>

                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="ml-6 mb-6 relative">
                      <div className="absolute -left-8 mt-1.5 rounded-full w-4 h-4 bg-blue-600"></div>
                      <div className="text-sm text-blue-800 font-semibold mb-1">
                        {formatDate(
                          new Date(Date.now() - index * 86400000).toISOString()
                        )}
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                        <p className="text-sm text-gray-700">
                          {index === 0 && "Status updated to " + status}
                          {index === 1 &&
                            "Comment added by " +
                            (ticketData?.assignee || "Team Member")}
                          {index === 2 &&
                            "Ticket assigned to " +
                            (ticketData?.assignee || "Team Member")}
                          {index === 3 &&
                            "Ticket priority updated to " +
                            (ticketData?.priority || "Medium")}
                          {index === 4 &&
                            "Ticket created by " +
                            (ticketData?.created_by || "Customer")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Message Thread Component */}
          <MessageThread
            ticketId={ticketId}
            ticketData={ticketData}
            onStatusChange={handleStatusChange}
          />

          <SolutionSection
            ticketData={ticketData}
            availableSolutions={availableSolutions}
            setAvailableSolutions={setAvailableSolutions}
            ticketId={ticketId}
          />
        </div>
      </main>
      <ChatbotPopup />
    </div>
  );
}
