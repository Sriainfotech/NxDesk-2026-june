// components/TextAreaField.jsx
import React from "react";

const CreateIssuePageTextAreaField = ({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
  className = "",
  placeholder = "",
  rows = 5,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor={id} className="font-medium">
        {label}{required && "*"}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className={`border p-2 rounded-md w-full min-h-[150px] drop-shadow-lg ${className}`}
      />
    </div>
  );
};

export default CreateIssuePageTextAreaField;