import { useState, useEffect } from "react";
import { axiosInstance } from "../utils/axiosInstance";

export default function TicketAttachmentsViewer({ ticketId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    // Fetch attachments when the component mounts or ticketId changes
    if (ticketId) {
      fetchAttachments();
    }
  }, [ticketId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("Access token is missing");
      }

      const response = await axiosInstance.get(`/ticket/attachments/${ticketId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setAttachments(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching attachments:", err);
      setError("Failed to load attachments");
      setLoading(false);
    }
  };

  const openPreview = (fileUrl) => {
    setPreviewUrl(fileUrl);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setIsPreviewOpen(false);
  };

  // Helper function to determine if a file is an image based on file type
  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith('image/');
  };

  if (loading) {
    return <div className="text-center py-4">Loading attachments...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  if (attachments.length === 0) {
    return <div className="text-gray-500 py-4">No attachments found for this ticket.</div>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Attachments</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((attachment) => (
          <div 
            key={attachment.attachment_id} 
            className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 border-b bg-gray-50">
              <h4 className="font-medium text-sm truncate" title={attachment.file_name}>
                {attachment.file_name}
              </h4>
              <p className="text-xs text-gray-500">
                {(attachment.file_size / 1024).toFixed(2)} KB • {attachment.file_type}
              </p>
            </div>
            
            <div className="p-3 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Uploaded: {new Date(attachment.uploaded_at).toLocaleDateString()}
              </span>
              
              <div className="flex gap-2">
                {isImageFile(attachment.file_type) ? (
                  <button
                    onClick={() => openPreview(attachment.file_url)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Preview
                  </button>
                ) : (
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-screen overflow-auto p-4 relative">
            <button
              onClick={closePreview}
              className="absolute top-2 right-2 bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300"
            >
              ✕
            </button>
            <div className="mt-6">
              <img src={previewUrl} alt="Preview" className="max-w-full h-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}