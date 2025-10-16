import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { axiosInstance } from "../../utils/axiosInstance";
const SearchableSelectFieldname = ({
  label,
  id,
  name,
  value,
  onChange,
  options,
  valueKey,
  labelKey,
  error = "",
  disabled = false,
  required = false,
  defaultValue = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options || []);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);
  
  // Fetch profile data from API using axiosInstance
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get("/details/my_profile/");
        setProfileData(response.data);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Set default value on initial render if value is not set
  useEffect(() => {
    if (defaultValue && !value) {
      handleOptionSelect(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (options) {
      const filtered = options.filter((option) =>
        option[labelKey].toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [options, searchTerm, labelKey]);

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

  const getSelectedLabel = () => {
    if (!value || !options) return "";
    const selectedOption = options.find((option) => option[valueKey] === value);
    return selectedOption ? selectedOption[labelKey] : "";
  };

  const handleOptionSelect = (optionValue) => {
    onChange({
      target: {
        name,
        value: optionValue,
      },
    });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  // Get the display text for the selected dropdown value
  const getDisplayText = () => {
    const selectedLabel = getSelectedLabel();
    if (selectedLabel) return selectedLabel;
    if (isLoading) return "Loading...";
    return profileData?.first_name || "";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-xs font-medium text-gray-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      <div className="relative" ref={dropdownRef}>
        <div
          className={`h-9 w-full px-3 pr-8 rounded-md bg-white border text-black border-gray-300 flex items-center justify-between cursor-pointer transition-all ${
            disabled ? "opacity-50 pointer-events-none" : ""
          } ${error ? "border-red-500" : "focus-within:border-emerald-500"}`}
          onClick={toggleDropdown}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="h-4 w-4 text-gray-600" />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Search input */}
            <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
              <input
                type="text"
                className="w-full p-2 text-gray-800 rounded-md bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
            </div>

            {/* Options list */}
            <div>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option[valueKey]}
                    className={`p-3 text-sm text-gray-800 cursor-pointer hover:bg-emerald-50 ${
                      value === option[valueKey] ? "bg-emerald-100" : ""
                    }`}
                    onClick={() => handleOptionSelect(option[valueKey])}
                  >
                    {option[labelKey]}
                  </div>
                ))
              ) : (
                <div className="p-3 text-gray-500">No results found</div>
              )}
            </div>
          </div>
        )}

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
            Select {label}
          </option>
          {options &&
            options.map((option) => (
              <option key={option[valueKey]} value={option[valueKey]}>
                {option[labelKey]}
              </option>
            ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelectFieldname;