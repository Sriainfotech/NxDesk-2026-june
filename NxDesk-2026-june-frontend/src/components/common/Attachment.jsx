import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addFiles, removeFile } from '../../features/nav/files/filesSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const Attachment = () => {
  const dispatch = useDispatch();
  const files = useSelector((state) => state.files.files) || [];

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    dispatch(addFiles(newFiles));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files);
    dispatch(addFiles(newFiles));
  };

  const handleDelete = (id) => {
    dispatch(removeFile(id));
  };

  return (
    <div className="mt-4">
      <label
        className="mt-2 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-md cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        htmlFor="file-upload"
      >
        <div className="space-y-1 text-center">
          <FontAwesomeIcon icon={faUpload} className="mx-auto h-4 w-4 text-gray-800" />
          <span className="text-xs">Drop Files to Attach or Browse</span>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            multiple
          />
        </div>
      </label>

      {files && files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {files.map(({ id, file }) => (
            <div key={id} className="relative border border-gray-300 rounded-md p-2">
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-full h-full object-cover rounded-md"
                onLoad={() => URL.revokeObjectURL(file)}
              />
              <button
                className="absolute top-0 right-0 mt-1 mr-1 text-red-600 hover:text-red-800"
                onClick={() => handleDelete(id)}
              >
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Attachment;


