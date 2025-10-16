import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, Paperclip, Send, X, FileText, RefreshCw } from "lucide-react";
import { axiosInstance } from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import QuillTextEditor from "../CreateIssue/Components/QuillTextEditor";
import RichTextViewer from "../../components/common/RichTextViewer";

const ChatUI = forwardRef(({ onChatUpdate }, ref) => {
  // URL and State Management
  const { ticketId } = useParams();
  const userProfile = useSelector((state) => state.userProfile.user);
  const accessToken = localStorage.getItem("access_token");
  const authHeaders = { headers: { Authorization: `Bearer ${accessToken}` } };

  // Chat UI States
  const [newMessage, setNewMessage] = useState("");
  const [newMessageHTML, setNewMessageHTML] = useState("");
  const [expandEditor, setExpandEditor] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  // 3. Add error boundary to the component by wrapping the return statement:

// Add this before the return statement:
const [hasError, setHasError] = useState(false);

// Add error handling useEffect:
useEffect(() => {
  const handleError = (error) => {
    console.error("Unhandled error in ChatUI:", error);
    setHasError(true);
    toast.error("An unexpected error occurred. Please refresh the page.");
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleError);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleError);
  };
}, []);
  const [ticketDetails, setTicketDetails] = useState({
    ticketId: "",
    requestor: "",
    summary: "",
    status: "",
  });

  useImperativeHandle(ref, () => ({
    fetchMessages,
  }));

  // Refs
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Load ticket details on component mount
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails(ticketId);
    }
  }, [ticketId]);

  // Fetch messages when ticket ID changes
  useEffect(() => {
    if (ticketDetails.ticketId) {
      fetchMessages(ticketDetails.ticketId);
    }
  }, [ticketDetails.ticketId]);

  /**
   * Fetches ticket details from the API
   */
  const fetchTicketDetails = async (id) => {
    try {
      const response = await axiosInstance.get(
        `ticket/tickets/${id}/`,
        authHeaders
      );
      const ticketData = response.data;

      setTicketDetails({
        ticketId: ticketData.ticket_id || id,
        requestor: ticketData.created_by || userProfile?.username,
        email: ticketData.requester_email || userProfile?.email,
        summary: ticketData.summary || "",
        status: ticketData.status || "",
      });
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    }
  };

  const fetchMessages = async (id) => {
      setImageErrors(new Set());
    setLoading(true);
    try {
      if (!id || !accessToken) {
        if (!accessToken) toast.error("Access token missing. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get(`ticket/reports/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { ticket: id },
      });

      // Transform ticket notes into message format
      const messageData = response.data.map((note) => ({
        id: note.report_id || note.id,
        text: note.content || note.title,
        html: note.content || note.title,
        timestamp: new Date(note.created_at).toLocaleString(),
        isCurrentUser:
          note.username === userProfile?.username ||
          note.username === userProfile?.first_name,
        user: note.username || "System",
        attachments: note.report_attachments
          ? note.report_attachments.map((att) => ({
              id: att.id,
              name: getFileNameFromUrl(att.file_url),
              type: getFileTypeFromUrl(att.file_url),
              url: att.file_url,
              uploaded_at: att.uploaded_at,
            }))
          : [],
      }));

      console.log(messageData)
      // CHANGE: Reverse the array to show latest comments on top
 const sortedMessages = messageData.sort((a, b) => {
  const dateA = new Date(a.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
  const dateB = new Date(b.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
  return dateB - dateA; // Newest first
});

console.log(sortedMessages)
setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Extract filename from URL
   */
  const getFileNameFromUrl = (url) => {
    if (!url) return "Unknown file";
    const urlParts = url.split("/");
    const fileNameWithParams = urlParts[urlParts.length - 1];
    return fileNameWithParams.split("?")[0];
  };

  /**
   * Determine file type from URL or filename
   */
  const getFileTypeFromUrl = (url) => {
    if (!url) return "application/octet-stream";

    const fileName = getFileNameFromUrl(url).toLowerCase();

    if (fileName.match(/\.(jpeg|jpg|png|gif|bmp|webp)$/))
      return "image/" + fileName.split(".").pop();
    if (fileName.match(/\.(pdf)$/)) return "application/pdf";
    if (fileName.match(/\.(doc|docx)$/)) return "application/msword";
    if (fileName.match(/\.(xls|xlsx)$/)) return "application/vnd.ms-excel";
    if (fileName.match(/\.(ppt|pptx)$/)) return "application/vnd.ms-powerpoint";
    if (fileName.match(/\.(zip|rar|7z)$/)) return "application/zip";
    if (fileName.match(/\.(txt)$/)) return "text/plain";

    return "application/octet-stream";
  };

  /**
   * Extracts and processes embedded images from Quill content
   */
  const processEmbeddedImages = async (htmlContent) => {
    if (!htmlContent || !htmlContent.includes("<img")) {
      return { images: [], updatedHtml: htmlContent };
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const imgElements = tempDiv.querySelectorAll("img");
    if (imgElements.length === 0)
      return { images: [], updatedHtml: htmlContent };

    const extractedImages = [];

    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i];
      const imgSrc = img.getAttribute("src");

      if (!imgSrc) continue;

      if (imgSrc.startsWith("data:")) {
        try {
          const response = await fetch(imgSrc);
          const blob = await response.blob();

          const imgType = blob.type.split("/")[1] || "png";
          const fileName = `embedded-image-${Date.now()}-${i}.${imgType}`;

          const file = new File([blob], fileName, { type: blob.type });

          extractedImages.push({
            id: `embedded-${Date.now()}-${i}`,
            name: fileName,
            type: blob.type,
            size: blob.size,
            file: file,
            previewUrl: imgSrc,
            isLocal: true,
          });

          img.setAttribute("data-embedded-index", i);
          img.setAttribute("data-original-src", imgSrc);
        } catch (error) {
          console.error("Error processing embedded image:", error);
        }
      }
    }

    return {
      images: extractedImages,
      updatedHtml: tempDiv.innerHTML,
    };
  };

  /**
   * Send message with or without attachments
   */

// 1. Fix the sendMessage function - replace the entire function:

const sendMessage = async () => {
  const messageIsEmpty = isEmptyContent(newMessageHTML);
  const hasAttachments = attachments.length > 0;

  if (messageIsEmpty && !hasAttachments) return;

  // Declare these early to reuse them in catch if needed
  let tempMessageId = "";
  let messageContent = newMessage;
  let messageHtml = newMessageHTML;
  let processedAttachments = [...attachments];

  try {
    if (!accessToken) {
      toast.error("Access token missing. Please log in.");
      return;
    }

    if (!ticketDetails.ticketId) {
      toast.error("Ticket ID is required");
      return;
    }

    // // Process embedded images if present
    // if (!messageIsEmpty && newMessageHTML.includes("<img")) {
    //   try {
    //     const { images, updatedHtml } = await processEmbeddedImages(newMessageHTML);
    //     processedAttachments = [...processedAttachments, ...images];
    //     messageHtml = updatedHtml;
    //   } catch (embeddedError) {
    //     console.error("Error processing embedded images:", embeddedError);
    //     // Proceed without interrupting flow
    //   }
    // }

    // Create temporary message for optimistic UI
    tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      id: tempMessageId,
      text: messageContent,
      html: messageHtml,
      timestamp: new Date().toLocaleString(),
      isCurrentUser: true,
      user: userProfile?.username || "You",
      attachments: processedAttachments.map((att) => ({
        ...att,
        url: att.isLocal ? att.previewUrl : att.url,
      })),
      pending: true,
    };


    console.log("temp",tempMessage)
// Show message in UI optimistically
setMessages((prev) => [tempMessage, ...prev]);

let response;

if (hasAttachments) {
  response = await sendAttachmentsWithMessage(
    processedAttachments,
    messageContent,
    messageHtml,
    ticketDetails.ticketId
  );
} else {
  response = await sendTextMessage(
    messageContent,
    messageHtml,
    ticketDetails.ticketId
  );
}

// Fetch the latest message data to get proper attachment URLs
const updatedResponse = await axiosInstance.get(`ticket/reports/`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  params: { ticket: ticketDetails.ticketId },
});

// Find the newly created message with proper attachment URLs
const newMessage = updatedResponse.data.find(note => 
  note.report_id === (response?.data?.report_id || response?.data?.id)
);

if (newMessage) {
  const formattedMessage = {
    id: newMessage.report_id || newMessage.id,
    text: newMessage.content || newMessage.title,
    html: newMessage.content || newMessage.title,
    timestamp: new Date(newMessage.created_at).toLocaleString(),
    isCurrentUser: newMessage.username === userProfile?.username || newMessage.username === userProfile?.first_name,
    user: newMessage.username || "System",
    attachments: newMessage.report_attachments
      ? newMessage.report_attachments.map((att) => ({
          id: att.id,
          name: getFileNameFromUrl(att.file_url),
          type: getFileTypeFromUrl(att.file_url),
          url: att.file_url,
          uploaded_at: att.uploaded_at,
        }))
      : [],
    pending: false,
  };

  console.log("formart",formattedMessage)
  // Replace temporary message with real message data
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === tempMessageId ? formattedMessage : msg
    )
  );
} else {
  // Fallback: just remove pending state if we can't find the new message
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === tempMessageId
        ? {
            ...msg,
            id: response?.data?.report_id || response?.data?.id || tempMessageId,
            pending: false,
          }
        : msg
    )
  );
}

    // ✅ Now safe to clear inputs
    setNewMessage("");
    setNewMessageHTML("");
    setAttachments([]);

    if (typeof onChatUpdate === "function") {
      // If the sender is the ticket requestor (not the agent), treat as user response
      if (
        userProfile?.username &&
        ticketDetails.requestor &&
        userProfile?.username === ticketDetails.requestor
      ) {
        onChatUpdate("User responded in chat", "user_response");
      } else {
        onChatUpdate("Comment added to ticket", "comment");
      }
    }

  } catch (error) {
    console.error("Error sending message:", error);

    // Remove temporary message
    setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));

    // Restore inputs for retry
    setNewMessage(messageContent || "");
    setNewMessageHTML(messageHtml || "");
    setAttachments(attachments);

    toast.error(
      "Failed to send message: " +
      (error?.response?.data?.detail || error.message || "Unknown error")
    );
  }
};



  /**
   * Send text-only message
   */
  const sendTextMessage = async (text, html, ticketId) => {
    return axiosInstance.post(
      "ticket/reports/",
      {
        title: html,
        ticket: ticketId,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  };

  /**
   * Send message with attachments
   */
// const sendAttachmentsWithMessage = async (files, text, html, ticketId) => {
//   let isContentSent = false;
//   let lastResponse = null;

//   try {
//     for (const attachment of files) {
//       if (attachment.isLocal) {
//         const formData = new FormData();
//         formData.append("attachments", attachment.file);
//         formData.append("ticket", ticketId);

//         if (!isContentSent && !isEmptyContent(html)) {
//           formData.append("title", html);
//           isContentSent = true;
//         } else {
//           formData.append(
//             "title",
//             attachment.name.startsWith("embedded-image")
//               ? "Embedded Image"
//               : "Attachment"
//           );
//         }

//         lastResponse = await axiosInstance.post("ticket/reports/", formData, {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             "Content-Type": "multipart/form-data",
//           },
//         });
//       }
//     }

//     // Send text message if content wasn't sent with attachments
//     if (!isContentSent && !isEmptyContent(html)) {
//       lastResponse = await sendTextMessage(text, html, ticketId);
//     }

//     // Clean up blob URLs
//     files.forEach((att) => {
//       if (att.previewUrl && att.previewUrl.startsWith("blob:")) {
//         try {
//           URL.revokeObjectURL(att.previewUrl);
//         } catch (e) {
//           console.warn("Failed to revoke blob URL:", e);
//         }
//       }
//     });

//     return lastResponse;
//   } catch (error) {
//     // Clean up blob URLs even on error
//     files.forEach((att) => {
//       if (att.previewUrl && att.previewUrl.startsWith("blob:")) {
//         try {
//           URL.revokeObjectURL(att.previewUrl);
//         } catch (e) {
//           console.warn("Failed to revoke blob URL:", e);
//         }
//       }
//     });
//     throw error;
//   }
// };

const sendAttachmentsWithMessage = async (files, text, html, ticketId) => {
  try {
    const formData = new FormData();
    
    // Add all attachments (both regular and embedded) to the same form
    files.forEach(attachment => {
      if (attachment.isLocal) {
        formData.append("attachments", attachment.file);
      }
    });
    
    formData.append("ticket", ticketId);
    
    // Add the main message content
    if (!isEmptyContent(html)) {
      formData.append("title", html);
    } else {
      formData.append("title", files.length > 1 ? "Multiple Attachments" : "Attachment");
    }

    await axiosInstance.post("ticket/reports/", formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // Clean up blob URLs
    files.forEach((att) => {
      if (att.previewUrl && att.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(att.previewUrl);
        } catch (e) {
          console.warn("Failed to revoke blob URL:", e);
        }
      }
    });

  } catch (error) {
    // Clean up blob URLs even on error
    files.forEach((att) => {
      if (att.previewUrl && att.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(att.previewUrl);
        } catch (e) {
          console.warn("Failed to revoke blob URL:", e);
        }
      }
    });
    throw error;
  }
};

  /**
   * Handle file attachment button click
   */
  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  /**
   * Process selected files
   */
  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        previewUrl: URL.createObjectURL(file),
        isLocal: true,
      }));

      setAttachments((prev) => [...prev, ...newFiles]);
      toast.success(
        `${newFiles.length} file${newFiles.length > 1 ? "s" : ""} added`
      );
    }

    e.target.value = "";
  };

  /**
   * Remove attachment from list
   */
  const removeAttachment = (id) => {
    setAttachments((prev) =>
      prev.filter((att) => {
        if (att.id === id) {
          if (att.previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(att.previewUrl);
          }
          return false;
        }
        return true;
      })
    );
  };

  /**
   * Handle message input via keyboard
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Handle Quill rich text editor changes
   */
  const handleQuillChange = (event) => {
    if (event?.target?.value !== undefined) {
      const htmlValue = event.target.value;
      setNewMessageHTML(htmlValue);

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlValue;
      setNewMessage(tempDiv.textContent || tempDiv.innerText || "");
    }
  };

  /**
   * Check if content is empty
   */
  const isEmptyContent = (value) => {
    if (typeof value !== "string") return true;
    return (
      !value || value === "" || value === "<p><br></p>" || value === "<p></p>"
    );
  };

  /**
   * Render file preview based on type
   */
  const renderFilePreview = (file) => {
    if (file.type?.startsWith("image/")) {
      return (
        <div className="relative group">
          <img
            src={file.previewUrl || file.url}
            alt={file.name}
            className="max-h-20 max-w-full rounded border border-gray-200"
          />
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
              onClick={() => window.open(file.previewUrl || file.url, "_blank")}
            >
              <Search size={12} />
            </button>
          </div>
        </div>
      );
    } else if (file.type === "application/pdf") {
      return (
        <div className="flex items-center bg-gray-100 p-1 rounded text-xs">
          <FileText size={16} className="text-red-500 mr-1" />
          <div className="flex-1 truncate">{file.name}</div>
          <a
            href={file.previewUrl || file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-blue-500 hover:underline"
          >
            View
          </a>
        </div>
      );
    } else {
      return (
        <div className="flex items-center bg-gray-100 p-1 rounded text-xs">
          <Paperclip size={14} className="text-gray-500 mr-1" />
          <div className="flex-1 truncate">{file.name}</div>
          {(file.previewUrl || file.url) && (
            <a
              href={file.previewUrl || file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline"
              download={file.name}
            >
              Download
            </a>
          )}
        </div>
      );
    }
  };

  const renderMessageContent = (message) => {
    if (!message.html && !message.text) return null;

    if (message.html && message.html.includes("[embedded-image")) {
      return <div className="text-xs italic text-gray-500">Embedded image</div>;
    }

    try {
      if (message.html) {
        if (message.html.includes("<") && message.html.includes(">")) {
          return (
            <RichTextViewer
              content={message.html}
              className="text-xs message-content break-words break-all"
            />
          );
        }
      }

      return (
        <div className="text-xs whitespace-pre-wrap break-words break-all">
          {message.text || message.html}
        </div>
      );
    } catch (error) {
      console.error("Error rendering message content:", error);
      return (
        <div className="text-xs whitespace-pre-wrap break-words">
          {message.text || "Error displaying message"}
        </div>
      );
    }
  };

  const getUserRole = (username) => {
    if (username === userProfile?.username) return "You";
    if (username === ticketDetails.requestor) return "Requestor";
    if (username?.toLowerCase().includes("admin")) return "Admin";
    if (username?.toLowerCase().includes("dev")) return "Developer";
    if (username?.toLowerCase().includes("lead")) return "Team Lead";
    return "Team Member";
  };

  const getRoleColor = (username) => {
    const role = getUserRole(username);
    switch (role) {
      case "You":
        return "bg-blue-600";
      case "Requestor":
        return "bg-green-600";
      case "Admin":
        return "bg-red-600";
      case "Developer":
        return "bg-purple-600";
      case "Team Lead":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };


  const handleImageError = (fileUrl, e) => {
  if (!imageErrors.has(fileUrl)) {
    setImageErrors(prev => new Set([...prev, fileUrl]));
    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+";
  }
};

if (hasError) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-red-600 text-center">
        <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-600 mb-4">Please refresh the page to continue</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Input Section - Top Priority */}
      <div className="border-b bg-gray-50 p-2">
        <div className="flex items-start space-x-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-xs shrink-0">
            {userProfile?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Attachment preview - compact */}
            {attachments.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-600 mb-1">
                  {attachments.length} file{attachments.length > 1 ? "s" : ""}{" "}
                  ready
                </div>
                <div className="flex flex-wrap gap-1">
                  {attachments.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="max-w-24">{renderFilePreview(file)}</div>
                      <button
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 text-xs"
                        onClick={() => removeAttachment(file.id)}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="relative">
              {!expandEditor ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      setNewMessageHTML(e.target.value);
                    }}
                    onFocus={() => setExpandEditor(true)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    onClick={handleFileAttachment}
                    title="Attach files"
                  >
                    <Paperclip size={16} />
                  </button>
                  <button
                    className={`${
                      isEmptyContent(newMessageHTML) && attachments.length === 0
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1`}
                    onClick={sendMessage}
                    disabled={
                      isEmptyContent(newMessageHTML) && attachments.length === 0
                    }
                  >
                    <Send size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative border border-gray-300 rounded overflow-hidden">
                  <div className="absolute top-1 right-1 z-10 flex space-x-1">
                    <button
                      onClick={() => setExpandEditor(false)}
                      className="p-1 hover:bg-gray-100 rounded text-xs bg-white shadow-sm"
                      title="Minimize"
                    >
                      ✕
                    </button>
                  </div>
                  <QuillTextEditor
                    name="message"
                    value={newMessageHTML}
                    onChange={handleQuillChange}
                    className="bg-white min-h-[80px]"
                  />
                  <div className="flex items-center justify-between p-2 bg-gray-50">
                    <div className="flex space-x-1">
                      <button
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        onClick={handleFileAttachment}
                        title="Attach files"
                      >
                        <Paperclip size={16} />
                      </button>
                    </div>
                    <button
                      className={`${
                        isEmptyContent(newMessageHTML) &&
                        attachments.length === 0
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      } px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1`}
                      onClick={sendMessage}
                      disabled={
                        isEmptyContent(newMessageHTML) &&
                        attachments.length === 0
                      }
                    >
                      Comment <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </div>
        </div>
      </div>

      {/* Messages area - Compact layout */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <div className="ml-2 text-gray-600 text-sm">Loading...</div>
            <button
              className="ml-2 p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
              onClick={() => fetchMessages(ticketDetails.ticketId)}
              title="Refresh messages"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        ) : messages.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {messages.map((msg, idx) => (
              <div
             key={`${msg.timestamp}-${msg.id}`}
                className="px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full ${getRoleColor(
                      msg.user
                    )} flex items-center justify-center text-white font-medium text-xs shrink-0`}
                  >
                    {msg.user?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {msg.user}
                      </span>
                      {/* <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {getUserRole(msg.user)}
                      </span> */}
                      <span className="text-xs text-gray-500 truncate">
                        {msg.timestamp}
                      </span>
                      {msg.pending && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Sending...
                        </span>
                      )}
                      {idx === 0 && (
                        <button
                          className="ml-auto p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          onClick={() => fetchMessages(ticketDetails.ticketId)}
                          title="Refresh messages"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                    </div>

                    <div className="text-gray-800">
                      {renderMessageContent(msg)}
                    </div>

                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium text-gray-500">
                          Attachments ({msg.attachments.length})
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {msg.attachments.map((file, fileIdx) => (
                            <div
                              key={fileIdx}
                              className="border border-gray-200 rounded overflow-hidden"
                            >
                              {file.type?.startsWith("image/") ? (
                                <div className="bg-gray-50 p-2">
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="max-h-32 max-w-full rounded border border-gray-200"
                               onError={(e) => {
  e.target.onerror = null;
  handleImageError(file.url, e);
}}
                                  />
                                  <div className="mt-1 flex justify-between items-center text-xs text-gray-600">
                                    <span className="truncate font-medium break-words break-all">
                                      {file.name}
                                    </span>
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                      download
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ) : file.type === "application/pdf" ? (
                                <div className="flex items-center p-2 bg-red-50">
                                  <FileText
                                    size={16}
                                    className="text-red-600 mr-2 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs text-gray-900 truncate break-words break-all">
                                      {file.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      PDF
                                    </div>
                                  </div>
                                  <div className="flex space-x-1 ml-2">
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                      View
                                    </a>
                                    <a
                                      href={file.url}
                                      download={file.name}
                                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center p-2 bg-gray-50">
                                  <Paperclip
                                    size={14}
                                    className="text-gray-600 mr-2 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs text-gray-900 truncate break-words break-all">
                                      {file.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      File
                                    </div>
                                  </div>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    download={file.name}
                                  >
                                    Download
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-gray-400 text-sm mb-1">No activity yet</div>
            <div className="text-xs text-gray-500">
              Be the first to add a comment or update to this ticket
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatUI;