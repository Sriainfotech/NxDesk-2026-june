import { useState } from "react";
import { X } from "lucide-react";

export default function TicketInfoSection({ ticketData }) {
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);

    const openAttachmentPopup = (attachment) => {
        setSelectedAttachment(attachment);
        setShowAttachmentPopup(true);
    };

    const closeAttachmentPopup = () => {
        setShowAttachmentPopup(false);
        setSelectedAttachment(null);
    };

    return (
        <div className="mt-9 bg-white p-10 max-w-4xl rounded-xl">
            <div>
                <h1 className="text-2xl font-bold mb-2">{ticketData?.summary}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                    <p className="font-medium">ID:</p>
                    <p>{ticketData?.ticket_id}</p>
                </div>
            </div>
            <p className="font-medium mb-3 mt-6">Description</p>
            <div className="max-h-80 overflow-auto">
                <p>{ticketData?.description}</p>
                <div className="flex gap-8 mt-8 mb-8">
                    {ticketData?.attachments && ticketData.attachments.length > 0 ? (
                        ticketData.attachments.map((attachment, index) => (
                            <div
                                key={index}
                                className="w-[200px] min-h-[163px] bg-[#F5F5F5] p-3 rounded-xl cursor-pointer hover:shadow-lg transition duration-300 flex flex-col items-center justify-center border border-gray-200"
                                onClick={() => openAttachmentPopup(attachment)}
                            >
                                {attachment.file_type.startsWith('image/') ? (
                                    <img
                                        src={`${attachment.file_url}`}
                                        alt={attachment.file_name}
                                        className="max-w-full max-h-[120px] object-contain mb-2"
                                    />
                                ) : (
                                    <div className="bg-gray-200 w-full h-[120px] flex items-center justify-center mb-2">
                                        <p className="text-gray-600 font-medium">File</p>
                                    </div>
                                )}
                                <p className="text-sm text-center truncate w-full">{attachment.file_name}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No attachments available</p>
                    )}
                </div>
            </div>

            {/* Attachment Popup */}
            {showAttachmentPopup && selectedAttachment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden shadow-xl relative">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold">{selectedAttachment.file_name}</h3>
                            <button
                                onClick={closeAttachmentPopup}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-auto max-h-[calc(90vh-100px)]">
                            {selectedAttachment.file_type.startsWith('image/') ? (
                                <img
                                    src={`${selectedAttachment.file_url}`}
                                    alt={selectedAttachment.file_name}
                                    className="max-w-full max-h-[70vh] object-contain mx-auto"
                                />
                            ) : (
                                <div className="bg-gray-100 p-8 rounded text-center">
                                    <p className="text-lg font-medium">File: {selectedAttachment.file_name}</p>
                                    <p className="text-sm text-gray-500 mt-2">Type: {selectedAttachment.file_type}</p>
                                    <p className="text-sm text-gray-500">Size: {(selectedAttachment.file_size / 1024).toFixed(2)} KB</p>
                                    <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                                        Download File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}