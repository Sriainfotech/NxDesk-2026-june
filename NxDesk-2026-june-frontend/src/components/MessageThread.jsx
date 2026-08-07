import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../utils/axiosInstance";
import { Paperclip, Send, X } from "lucide-react";

export default function MessageThread({ ticketId, ticketData, onStatusChange }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [filePreview, setFilePreview] = useState([]);
  const messageEndRef = useRef(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // polling every 30 seconds
    const intervalId = setInterval(fetchMessages, 30000);
    
    return () => clearInterval(intervalId);
  }, [ticketId]);

  useEffect(() => {
    // Scroll to messages change
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!ticketId) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const response = await axiosInstance.get(`/messages/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Preview files
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(prev => [...prev, {
          name: file.name,
          preview: file.type.startsWith('image/') ? e.target.result : null,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    setFilePreview(filePreview.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || isLoading) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      
      formData.append("ticket_id", ticketId);
      formData.append("message", newMessage);
      formData.append("sender_id", localStorage.getItem("user_id") || "1");
      formData.append("sender_type", localStorage.getItem("user_role") || "user");
      
      // Append each attachment
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
      
      const response = await axiosInstance.post("/messages/send", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      // If this was the user's response to a "Waiting for User" status, update ticket status
      if (ticketData?.status === "Waiting for users" && 
          localStorage.getItem("user_role") === "user") {
        // Update ticket status back to "Working in progress" and resume SLA
        await axiosInstance.patch(`/ticket/${ticketId}/status`, {
          status: "Working in progress",
          resume_sla: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (onStatusChange) {
          onStatusChange("Working in progress");
        }
      }
      
      // Clear input and attachments
      setNewMessage("");
      setAttachments([]);
      setFilePreview([]);
      
      // Fetch updated messages
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleWaitingForUser = async () => {
    if (!ticketId) return;
    
    try {
      const token = localStorage.getItem("access_token");
      
      // Update ticket status to "Waiting for users" and pause SLA
      await axiosInstance.patch(`/ticket/${ticketId}/status`, {
        status: "Waiting for users",
        pause_sla: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (onStatusChange) {
        onStatusChange("Waiting for users");
      }
      
      // Add system message indicating status change
      fetchMessages();
      
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="bg-white p-4 px-7 my-10 rounded-xl">
      <h1 className="font-bold text-xl my-5">Communication</h1>
      
      {/* Message thread container */}
      <div className="border rounded-lg p-4 mb-4 h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center italic">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 ${
                message.sender_type === "system" 
                  ? "text-center text-gray-500 italic text-sm" 
                  : message.sender_type === "assignee" 
                    ? "ml-auto max-w-[80%]" 
                    : "mr-auto max-w-[80%]"
              }`}
            >
              {message.sender_type !== "system" && (
                <div className={`flex items-center mb-1 ${
                  message.sender_type === "assignee" ? "justify-end" : "justify-start"
                }`}>
                  <span className="font-medium">
                    {message.sender_type === "assignee" ? "Support Agent" : "You"}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              )}
              
              <div className={`p-3 rounded-lg ${
                message.sender_type === "system" 
                  ? "bg-gray-100" 
                  : message.sender_type === "assignee" 
                    ? "bg-blue-100 text-right" 
                    : "bg-gray-200"
              }`}>
                <p>{message.message}</p>
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.attachments.map((attachment, index) => (
                      <a 
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline flex items-center"
                      >
                        <Paperclip size={16} className="mr-1" />
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>
      
      {/* Message input area */}
      <div className="border rounded-lg p-3">
        {/* File preview area */}
        {filePreview.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {filePreview.map((file, index) => (
              <div key={index} className="relative bg-gray-100 p-2 rounded-md flex items-center">
                {file.preview && file.type.startsWith('image/') ? (
                  <img src={file.preview} alt={file.name} className="h-12 w-12 object-cover rounded mr-2" />
                ) : (
                  <Paperclip size={20} className="mr-2" />
                )}
                <span className="text-sm truncate max-w-[100px]">{file.name}</span>
                <button 
                  onClick={() => removeAttachment(index)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border-0 focus:outline-none focus:ring-0"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          
          <button
            onClick={handleAttachmentClick}
            className="p-2 text-gray-500 hover:text-blue-500"
            title="Attach files"
          >
            <Paperclip size={20} />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || (!newMessage.trim() && attachments.length === 0)}
            className={`p-2 ml-2 rounded-md ${
              isLoading || (!newMessage.trim() && attachments.length === 0)
                ? "bg-gray-200 text-gray-400"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      
      {/* Waiting for user button - only visible for assignees/admins on active tickets */}
      {localStorage.getItem("user_role") === "assignee" && 
       ticketData?.status !== "Resolved" && 
       ticketData?.status !== "Closed" && 
       ticketData?.status !== "Cancelled" && 
       ticketData?.status !== "Waiting for users" && (
        <div className="mt-4 text-right">
          <button
            onClick={handleWaitingForUser}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Set Status to "Waiting for User"
          </button>
        </div>
      )}
    </div>
  );
}