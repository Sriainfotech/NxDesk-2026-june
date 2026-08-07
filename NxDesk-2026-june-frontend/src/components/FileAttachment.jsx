import { File, Paperclip } from 'lucide-react';
import React, { useState } from 'react';

function FileAttachment({ fileInputRef, handleFileChange, files, removeFile, openPreview }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(prevState => !prevState);
    };

    return (
        <div className="rounded-md border border-gray-200 p-3 flex flex-col gap-4 bg-white shadow-sm">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-center">
                    <div className=' flex gap-2 items-center'>
                        <h3 className="text-lg font-medium">Attachments</h3>


                    </div>

                    <div className="flex gap-2 mt-2 sm:mt-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 cursor-pointer py-2 px-4 rounded-md inline-block text-sm"
                        >
                            <p className=' flex gap-2 items-center p-[1px]'>
                                Choose Files <Paperclip size={20} className=' text-[#2e6ec0] ' />
                            </p>



                        </label>


                        {files.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleDropdown}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm"
                            >
                                {isDropdownOpen ? 'Hide Files' : 'Show Files'} ({files.length})
                            </button>
                        )}
                    </div>
                </div>

                {files.length > 0 && !isDropdownOpen && (
                    <div className="text-sm text-gray-600">
                        {files.length} file{files.length !== 1 ? 's' : ''} selected
                    </div>
                )}

                {isDropdownOpen && files.length > 0 && (
                    <div className="mt-2">
                        <ul className="border rounded-md bg-gray-50 p-2 max-h-60 overflow-y-auto">
                            {files.map((file, index) => (
                                <li key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-100 rounded mb-1 border-b border-gray-200 last:border-b-0">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="text-gray-500">
                                            {file.type.startsWith('image/') ? '🖼️' : '📄'}
                                        </div>
                                        <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">({(file.size / 1024).toFixed(2)} KB)</span>
                                    </div>
                                    <div className="flex gap-2 ml-2 whitespace-nowrap">

                                        {file.type.startsWith('image/') && (
                                            <button
                                                type="button"
                                                onClick={() => openPreview(file)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Preview
                                            </button>
                                        )}
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FileAttachment;