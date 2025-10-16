import React, { useState } from "react";

const CreateIssuePageFormField = ({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  className = "",
  placeholder = "",
  disabled = false,
  requiredFields = [],
  isOptional = false,
}) => {
  const [touched, setTouched] = useState(false);
  const isRequired = required || requiredFields.includes(name);
  const isEmpty = !value || value.trim() === "";
  const showError = touched && isRequired && isEmpty;

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center gap-5">
        <label htmlFor={id} className="font-medium w-[120px]">
          {label}
        </label>
        <div className={`relative w-[400px] ${className}`}>
          <input
            id={id}
            name={name}
            value={value}
            onChange={(e) => {
              onChange(e);
              if (!touched) setTouched(true);
            }}
            onBlur={handleBlur}
            required={isRequired}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              border p-4 w-full rounded-md transition-all duration-200
              ${
                disabled
                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
                  : showError
                  ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              }
            `}
          />
          {isOptional && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              Optional
            </div>
          )}
        </div>
      </div>
      {showError && (
        <div className="ml-[135px] text-red-500 text-sm">
          {label} is required
        </div>
      )}
    </div>
  );
};

export default CreateIssuePageFormField;