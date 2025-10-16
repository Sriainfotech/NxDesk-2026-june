import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css"; // Use bubble theme for viewing

const RichTextViewer = ({ content, className = "" }) => {
  return (
    <div className={`rich-text-viewer ${className}`}>
      <ReactQuill 
        value={content} 
        readOnly={true}
        theme="bubble"
        modules={{ toolbar: false }}
      />
    </div>
  );
};

export default RichTextViewer;