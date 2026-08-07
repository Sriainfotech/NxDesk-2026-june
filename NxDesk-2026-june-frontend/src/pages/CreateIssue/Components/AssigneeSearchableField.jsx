import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
 
const AssigneeSearchableField = ({
  name,
  value,
  onChange,
  options,
  placeholder = "Search...",
  error,
}) => {
    console.log("Assignee list:", options);
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
const filteredOptions = (options || []).filter(
  (option) =>
    option &&
    option.label &&
    option.label.toLowerCase().includes(inputValue.toLowerCase())
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
   setInputValue(option.label);
    setUserCleared(false);
      onChange({ target: { name, value: option.value } });

    setIsOpen(false);
  }
 
  // Handle user typing in the field
function handleInputChange(e) {
  const newValue = e.target.value;
  setInputValue(newValue);

  if (newValue === "") {
    setUserCleared(true);
    // Also notify parent that value is cleared
    onChange({ target: { name, value: "" } });
  } else {
    setUserCleared(false);
  }
}

 
  // When field loses focus
function handleBlur() {
  setIsOpen(false);

  if (userCleared) {
    setInputValue(value || "");
    setUserCleared(false);
  } else {
    // Check if inputValue matches any option label (case insensitive)
    const matchedOption = options.find(
      (opt) => opt.label.toLowerCase() === inputValue.toLowerCase()
    );

    if (!matchedOption) {
      // If no match, revert to previous value or empty string
      setInputValue(value || "");
    } else if (matchedOption.value !== value) {
      // If matched option's value is different from current, update parent state
      onChange({ target: { name, value: matchedOption.value } });
    }
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
          className="px-2 py-1 flex-grow focus:outline-none"
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
      option.value === value ? "bg-gray-50 font-medium" : ""
    }`}
    onClick={() => handleSelect(option)}
  >
    {option.label}
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
 
export default AssigneeSearchableField;
 
 