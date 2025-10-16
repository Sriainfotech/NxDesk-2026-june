import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
 
const SearchableField = ({
  name,
  value,
  onChange,
  options,
  placeholder = "Search...",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [userCleared, setUserCleared] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
 
  // Update local input value when the external value changes
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value || "");
      setUserCleared(false);
    }
  }, [value, isOpen]);
 
  // Filter options based on current input
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );
 
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleBlur();
      }
    }
 
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [inputValue, userCleared]);
 
  // Handle selection from dropdown
  function handleSelect(option) {
    setInputValue(option);
    setUserCleared(false);
    onChange({ target: { name, value: option } });
    setIsOpen(false);
  }
 
  // Handle user typing in the field
  function handleInputChange(e) {
    const newValue = e.target.value;
    setInputValue(newValue);
 
    // Track if user has completely cleared the input
    if (newValue === "") {
      setUserCleared(true);
      // Don't update parent form when input is cleared
    } else {
      setUserCleared(false);
    }
  }
 
  // When field loses focus
  function handleBlur() {
    setIsOpen(false);
 
    if (userCleared) {
      // If user cleared the input but then lost focus, restore from formData
      setInputValue(value || "");
      setUserCleared(false);
    } else if (inputValue && !options.includes(inputValue)) {
      // If input doesn't match any option, revert to previous value
      setInputValue(value || "");
    } else if (inputValue !== value) {
      // If valid option selected, update form data
      onChange({ target: { name, value: inputValue } });
    }
  }
 
  // Focus handler
  function handleFocus() {
    setIsOpen(true);
  }
 
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className={`flex items-center border  w-full ${
          isOpen ? "ring-2 ring-blue-100 border-blue-600" : "border-gray-300"
        } ${error ? "border-red-500" : ""}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="px-2 py-[2.5px] flex-grow focus:outline-none"
        />
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="flex items-center justify-center px-2 h-full border-l cursor-pointer"
        >
          <Search size={16} className="text-blue-600" />
        </div>
      </div>
 
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border  shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                  option === value ? "bg-gray-50 font-medium" : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
};
 
export default SearchableField;
 
 