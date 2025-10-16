import React, { useState, useEffect, useRef } from "react";
import { getNames } from "country-list";

const CountrySelectField = ({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Prepare country options
  let countryOptions = getNames().map((country) => ({
    value: country,
    label: country,
  }));

  // Move India to the top
  countryOptions = [
    { value: "India", label: "India" },
    ...countryOptions
      .filter((c) => c.value !== "India")
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (optionValue) => {
    onChange({
      target: {
        name,
        value: optionValue,
      },
    });
    setIsOpen(false);
  };

  // Get selected country label for display
  const getSelectedLabel = () => {
    if (!value) return "";
    return value;
  };

  return (
    <div className="flex items-center gap-5 relative">
      <label htmlFor={id} className="font-medium w-[96px] flex-shrink-0">
        {label} {required && "*"}
      </label>

      <div className="relative w-[327px]" ref={dropdownRef}>
        {/* Custom select header */}
        <div
          className="border p-4 rounded-md bg-white drop-shadow-lg flex justify-between items-center cursor-pointer"
          onClick={toggleDropdown}
        >
          <span className="truncate">
            {getSelectedLabel() || "Select a country"}
          </span>
          <span className="ml-2">{isOpen ? "▲" : "▼"}</span>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Options list */}
            <div>
              {countryOptions.length > 0 ? (
                countryOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-3 hover:bg-gray-100 cursor-pointer ${
                      value === option.value ? "bg-blue-100" : ""
                    }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500">No countries available</div>
              )}
            </div>
          </div>
        )}

        {/* Hidden actual select for form submission */}
        <select
          id={id}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          aria-label={label}
          className="sr-only"
        >
          <option value="" disabled>
            Select a country
          </option>
          {countryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CountrySelectField;