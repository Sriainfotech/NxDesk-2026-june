import { useState, useRef, useEffect } from "react";
import { X, Paperclip, Trash2, Plus } from "lucide-react";
import QuillTextEditor from "../../CreateIssue/Components/QuillTextEditor";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../utils/axiosInstance";

export default function QuestionToUserModal({
  isOpen,
  onClose,
  ticketId,
  ticketStatus,
  updateTicketStatus,
  refreshChatMessages,
  onQuestionSent,
}) {
  // State hooks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMessageHTML, setNewMessageHTML] = useState("");
  const [formData, setFormData] = useState({
    ticket: ticketId,
    message: "",
    attachments: [],
  });

  // Refs
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ticket: ticketId,
        message: "",
        attachments: [],
      });
      setNewMessageHTML("");
    }
  }, [isOpen, ticketId]);

  // Handle outside clicks to close modal
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  // Check if content is empty (similar to ChatUI component)
  const isEmptyContent = (value) => {
    if (typeof value !== "string") return true;
    // Check for empty strings and Quill's empty paragraph
    return (
      !value || value === "" || value === "<p><br></p>" || value === "<p></p>"
    );
  };

  // Handle Quill editor changes
  const handleQuillChange = (e) => {
    // Extract the value from the synthetic event
    const content = e.target.value;
    setFormData((prev) => ({ ...prev, message: content }));
    setNewMessageHTML(content);
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  // Remove a specific attachment
  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  /**
   * Extract embedded images from Quill content and prepare them for upload
   * @param {string} htmlContent - HTML content from Quill editor
   * @returns {Object} Object containing extracted images and updated HTML
   */
  const extractImagesFromQuillContent = async (htmlContent) => {
    // Guard against non-string input
    if (typeof htmlContent !== 'string') {
      return { images: [], updatedHtml: '' };
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const imgElements = tempDiv.querySelectorAll("img");
    const extractedImages = [];

    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i];
      const src = img.getAttribute("src");

      if (src && src.startsWith("data:")) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();
          const fileExt = blob.type.split("/")[1] || "png";
          const fileName = `embedded-image-${Date.now()}-${i}.${fileExt}`;

          const file = new File([blob], fileName, { type: blob.type });

          extractedImages.push({
            file,
            name: fileName,
            type: blob.type,
            isLocal: true,
            previewUrl: URL.createObjectURL(blob),
          });

          img.setAttribute("src", `[IMAGE:${fileName}]`);
        } catch (error) {
          console.error("Error extracting embedded image:", error);
        }
      }
    }

    return {
      images: extractedImages,
      updatedHtml: tempDiv.innerHTML,
    };
  };

  /**
   * Update ticket status to "Waiting for User Response" if needed
   * @returns {Promise<void>}
   */
  const updateTicketToWaitingStatus = async () => {
    if (ticketStatus === "Waiting for User Response") {
      return; // No need to update if already in correct status
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      throw new Error("Access token missing. Please log in.");
    }

    await axiosInstance.put(
      `ticket/tickets/${ticketId}/`,
      { status: "Waiting for User Response" },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    updateTicketStatus("Waiting for User Response");
  };

  /**
   * Upload a single attachment and create a report
   * @param {File} attachment - File to upload
   * @param {boolean} includeMessage - Whether to include message content with this attachment
   * @param {string} messageContent - HTML content to include as message
   * @returns {Promise<Object>} Uploaded file info
   */
  const uploadAttachment = async (
    attachment,
    includeMessage = false,
    messageContent = ""
  ) => {
    const accessToken = localStorage.getItem("access_token");
    const fileFormData = new FormData();

    fileFormData.append("attachments", attachment.file || attachment);
    fileFormData.append("ticket", ticketId);

    // Include message content if needed
    if (includeMessage && messageContent) {
      fileFormData.append("title", messageContent);

      //   fileFormData.append("content", messageContent);
    } else {
      fileFormData.append(
        "title",
        attachment.name?.startsWith("embedded-image")
          ? "Embedded Image"
          : "Attachment Added"
      );
    }

    const response = await axiosInstance.post("ticket/reports/", fileFormData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      id: response.data.id,
      name: attachment.name || attachment.file?.name,
      type: attachment.type || attachment.file?.type,
      url: response.data.file_url,
    };
  };

  /**
   * Send message without attachments
   * @param {string} messageContent - HTML content to send
   * @param {Array} attachmentIds - IDs of any already uploaded attachments to include
   * @returns {Promise<void>}
   */
  const sendMessage = async (messageContent, attachmentIds = []) => {
    const accessToken = localStorage.getItem("access_token");

    await axiosInstance.post(
      "ticket/reports/",
      {
        title: messageContent,
        content: messageContent,
        ticket: ticketId,
        attachments: attachmentIds,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Get and validate message content
      const messageHTML = newMessageHTML || "";
      const isMessageEmpty = isEmptyContent(messageHTML);

      // Validate submission has either message or attachments
      if (isMessageEmpty && formData.attachments.length === 0) {
        return;
      }

      // Validate auth token
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        toast.error("Access token missing. Please log in.");
        return;
      }

      // 1. Update ticket status first
      await updateTicketToWaitingStatus();

      // 2. Process message content and extract any embedded images
      let allAttachments = [...formData.attachments];
      let processedMessageHTML = messageHTML;

      if (!isMessageEmpty && messageHTML.includes("<img")) {
        const extractionResult = await extractImagesFromQuillContent(
          messageHTML
        );
        if (extractionResult?.images.length > 0) {
          allAttachments = [...allAttachments, ...extractionResult.images];
          processedMessageHTML = extractionResult.updatedHtml;
        }
      }

      // 3. Handle the three use cases

      // CASE 1 & 2: Has message content (with or without attachments)
      if (!isMessageEmpty) {
        if (allAttachments.length > 0) {
          // Upload first attachment with message included
          const firstAttachment = allAttachments[0];
          await uploadAttachment(firstAttachment, true, processedMessageHTML);

          // Upload remaining attachments separately if any
          for (let i = 1; i < allAttachments.length; i++) {
            await uploadAttachment(allAttachments[i]);
          }
        } else {
          // Just send the message without attachments
          await sendMessage(processedMessageHTML);
        }
      }
      // CASE 3: Only attachments, no message content
      else if (allAttachments.length > 0) {
        for (const attachment of allAttachments) {
          await uploadAttachment(attachment);
        }
      }

      // Clean up any created object URLs
      allAttachments.forEach((att) => {
        if (att.previewUrl && att.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });

      // Reset form and close modal
      setFormData({
        ticket: ticketId,
        message: "",
        attachments: [],
      });
      setNewMessageHTML("");

      onClose();

      // Refresh chat if callback provided
      if (typeof refreshChatMessages === "function") {
        refreshChatMessages();
      }

      toast.success("Question submitted to user successfully!");
         if (typeof onQuestionSent === "function") {
        onQuestionSent();
      }
   
    } catch (error) {
      console.error("Failed to submit question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-2xl p-4 max-h-[90vh] overflow-y-auto shadow-xl"
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-medium text-gray-800">
            Ask User Inputs
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message Content */}
          <div>
            <div className="w-full">
                <div className="border rounded-md">
                  <QuillTextEditor
                    name="message"
                    value={newMessageHTML}
                    onChange={handleQuillChange}
                    className="bg-white"
                  />
                </div>

            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <div className="border rounded-md p-3 bg-gray-50">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                id="question-attachment-upload"
                multiple
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors focus:outline-none mb-2"
              >
                <Plus size={16} className="mr-1" />
                <span>Add files</span>
              </button>

              {/* Display selected files */}
              {formData.attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div className="flex items-center text-xs">
                        <Paperclip size={14} className="mr-2 text-gray-500" />
                        <span className="truncate max-w-[250px] text-gray-700">
                          {file.name}
                        </span>
                        <span className="text-gray-400 ml-1">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                        aria-label="Remove attachment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.attachments.length === 0 && (
                <p className="text-xs text-gray-500 italic">
                  No files attached. You can add files or send just a message.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}