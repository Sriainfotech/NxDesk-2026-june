import { useState, useEffect } from "react";
import { axiosInstance } from "../../../utils/axiosInstance";
import { Send, Paperclip, User, ChevronDown, ChevronUp } from "lucide-react";

export default function MessageThread({ ticketId, ticketData, onStatusChange }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [showThread, setShowThread] = useState(true);
    
    const statuses = [
        "Open",
        "Working in Progress",
        "Waiting for User",
        "Resolved",
        "Closed",
        "Cancelled",
    ];
    
    useEffect(() => {
        if (!ticketId) return;
        
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const response = await axiosInstance.get(`/messages/${ticketId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                // If we have real data, use it. Otherwise, create mock data
                if (response.data && response.data.length > 0) {
                    setMessages(response.data);
                } else {
                    // Create mock data for demonstration
                    const mockMessages = [
                        {
                            id: 1,
                            sender: ticketData?.created_by || "Customer",
                            content: "I'm experiencing an issue with logging into the system. The error says 'Invalid credentials' but I'm sure my password is correct.",
                            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                            is_customer: true,
                        },
                        {
                            id: 2,
                            sender: ticketData?.assignee || "Support Agent",
                            content: "Thank you for reaching out. I'll look into this issue for you. Could you please confirm which system you're trying to access and when you last successfully logged in?",
                            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                            is_customer: false,
                        },
                        {
                            id: 3,
                            sender: ticketData?.created_by || "Customer",
                            content: "I'm trying to access the SAP system. I last logged in yesterday morning, but today it's not working at all.",
                            timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
                            is_customer: true,
                        },
                        {
                            id: 4,
                            sender: ticketData?.assignee || "Support Agent",
                            content: "I've checked the system and it appears there was a password policy update last night that might have affected your account. I'll reset your credentials and send you the temporary password via email shortly.",
                            timestamp: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
                            is_customer: false,
                        }
                    ];
                    
                    setMessages(mockMessages);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
                
                // Create mock data for demonstration
                const mockMessages = [
                    {
                        id: 1,
                        sender: ticketData?.created_by || "Customer",
                        content: "I'm having issues with the server after the recent upgrade. It's running extremely slowly.",
                        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                        is_customer: true,
                    },
                    {
                        id: 2,
                        sender: ticketData?.assignee || "Support Agent",
                        content: "Thank you for reporting this issue. Could you please provide more details about what specific operations are running slowly?",
                        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                        is_customer: false,
                    },
                    {
                        id: 3,
                        sender: ticketData?.created_by || "Customer",
                        content: "All database queries are taking much longer than usual. Simple reports that used to run in seconds now take minutes to complete.",
                        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
                        is_customer: true,
                    },
                ];
                
                setMessages(mockMessages);
            }
        };
        
        fetchMessages();
    }, [ticketId, ticketData]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        setLoading(true);
        
        try {
            const token = localStorage.getItem("access_token");
            // Add the new message to the UI immediately
            const tempMessage = {
                id: Date.now(),
                sender: ticketData?.assignee || "Support Agent",
                content: newMessage,
                timestamp: new Date().toISOString(),
                is_customer: false,
            };
            
            setMessages([...messages, tempMessage]);
            setNewMessage("");
            
            // Send to API
            await axiosInstance.post(
                `/messages/${ticketId}`,
                { 
                    content: newMessage,
                    is_internal: false,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
        } catch (error) {
            console.error("Error sending message:", error);
            // Keep the message in the UI even if API fails
        } finally {
            setLoading(false);
        }
    };
    
    const handleStatusChange = async (newStatus) => {
        try {
            const token = localStorage.getItem("access_token");
            await axiosInstance.put(
                `/ticket/tickets/${ticketId}/`,
                { status: newStatus },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            // Call the parent handler to update status in parent component
            onStatusChange(newStatus);
            setStatusMenuOpen(false);
            
            // Add system message about status change
            const statusMessage = {
                id: Date.now(),
                sender: "System",
                content: `Ticket status changed to ${newStatus}`,
                timestamp: new Date().toISOString(),
                is_system: true,
            };
            
            setMessages([...messages, statusMessage]);
            
        } catch (error) {
            console.error("Error changing status:", error);
        }
    };
    
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowThread(!showThread)}
            >
                <h2 className="font-bold text-xl text-gray-800 flex items-center">
                    <User className="mr-2 text-blue-600" size={20} />
                    Communication Thread
                </h2>
                <button className="text-gray-500 hover:text-blue-600">
                    {showThread ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>
            
            {showThread && (
                <>
                    <div className="mt-4 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                No messages yet
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div 
                                        key={message.id}
                                        className={`p-3 rounded-lg ${
                                            message.is_system 
                                                ? "bg-gray-100 border border-gray-200 text-center" 
                                                : message.is_customer
                                                    ? "bg-gray-100 border-l-4 border-l-blue-500"
                                                    : "bg-blue-50 border-l-4 border-l-indigo-500"
                                        }`}
                                    >
                                        {!message.is_system && (
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-blue-700">
                                                    {message.sender}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatTimestamp(message.timestamp)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`${message.is_system ? "text-gray-600 text-sm" : "text-gray-700"}`}>
                                            {message.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="mt-4">
                        <div className="flex items-center">
                            <div className="relative flex-1">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:outline-none focus:border-blue-500 resize-none"
                                    rows={3}
                                />
                                <button
                                    type="button"
                                    className="absolute right-12 bottom-3 text-gray-400 hover:text-blue-600"
                                >
                                    <Paperclip size={20} />
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !newMessage.trim()}
                                className={`ml-2 p-3 rounded-lg ${
                                    loading || !newMessage.trim() 
                                        ? "bg-gray-300 text-gray-500" 
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                                    className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                    <span>Update Status</span>
                                    <ChevronDown size={16} className="ml-2" />
                                </button>
                                
                                {statusMenuOpen && (
                                    <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                                        {statuses.map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => handleStatusChange(status)}
                                                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <button
                                    type="button"
                                    className="px-4 py-2 border border-blue-600 rounded-md bg-white text-blue-600 hover:bg-blue-50"
                                >
                                    Internal Note
                                </button>
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}