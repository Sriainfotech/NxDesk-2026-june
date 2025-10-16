import React, { useState, useEffect, useRef } from "react";
import { getNames } from "country-list";
import { ChevronDown } from "lucide-react";

const CountrySelectField = ({
  label,
  id,
  name,
  value,
  onChange,
  required = false,
  error = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Country options
  let countryOptions = getNames().map((country) => ({
    value: country,
    label: country,
  }));

  countryOptions = [
    { value: "India", label: "India" },
    ...countryOptions
      .filter((c) => c.value !== "India")
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOptionSelect = (optionValue) => {
    onChange({
      target: {
        name,
        value: optionValue,
      },
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-xs font-medium text-white">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      </div>

      <div className="relative" ref={dropdownRef}>
        <div
          className={`h-9 w-full px-3 pr-8 rounded-md bg-zinc-900/50 border text-white border-zinc-800 flex items-center justify-between cursor-pointer ${
            disabled ? "opacity-50 pointer-events-none" : ""
          } ${error ? "border-red-500" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="truncate text-sm">
            {value || `Select ${label}`}
          </span>
          <ChevronDown className="h-4 w-4 text-white" />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {countryOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-zinc-800 ${
                  value === option.value ? "bg-emerald-600 text-white" : "text-white"
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

        <select
          id={id}
          name={name}
          value={value || ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
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
