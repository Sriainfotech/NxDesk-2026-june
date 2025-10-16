import React, { useState } from "react";

const CreateIssuePageSelectField = ({
  label,
  id,
  name,
  value,
  onChange,
  options,
  valueKey,
  labelKey,
  required = false,
  disabled = false,
  className = "",
  requiredFields = [],
  isOptional = false,
}) => {
  const [touched, setTouched] = useState(false);
  const isRequired = required || requiredFields.includes(name);
  const isEmpty = !value || value === "";
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
        <div className="relative w-[400px]">
          <select
            id={id}
            name={name}
            value={value}
            onChange={(e) => {
              onChange(e);
              if (!touched) setTouched(true);
            }}
            onBlur={handleBlur}
            required={isRequired}
            disabled={disabled}
            className={`
              border p-4 w-full rounded-md transition-all duration-200 appearance-none
              ${
                disabled
                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
                  : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              }
              ${className}
            `}
          >
            <option value="">Select {label}</option>
            {options && options.length > 0 && 
              options.map((option) => (
                <option key={option[valueKey]} value={option[valueKey]}>
                  {option[labelKey]}
                </option>
              ))}
          </select>
          {isOptional && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              Optional
            </div>
          )}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
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

export default CreateIssuePageSelectField;