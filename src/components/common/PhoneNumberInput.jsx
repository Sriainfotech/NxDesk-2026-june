import { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

const PhoneNumberInput = ({
  value = "",
  onChange,
  onValidChange,
  placeholder = "Enter phone number",
  required = false,
  disabled = false,
  label = "Phone Number",
  className = "",
  errorMessage = "Please enter a valid phone number",
}) => {
  const [phoneNumber, setPhoneNumber] = useState(value);
  const [country, setCountry] = useState("in");
  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (value !== phoneNumber) {
      setPhoneNumber(value);
    }
  }, [value]);

  const validatePhoneNumber = (number, countryCode) => {
    try {
      if (!number) return false;

      const phoneNumberWithPlus = number.startsWith("+")
        ? number
        : `+${number}`;

      if (!isValidPhoneNumber(phoneNumberWithPlus, countryCode.toUpperCase())) {
        return false;
      }

      const parsedNumber = parsePhoneNumber(
        phoneNumberWithPlus,
        countryCode.toUpperCase()
      );
      return parsedNumber.isValid();
    } catch (error) {
      return false;
    }
  };

  const handleChange = (value, data) => {
    setPhoneNumber(value);
    setCountry(data.countryCode);
    setIsTouched(true);

    const formattedNumber = `+${value}`;
    const valid = validatePhoneNumber(formattedNumber, data.countryCode);
    setIsValid(valid);

    if (onChange) {
      onChange(formattedNumber);
    }

    if (onValidChange && valid) {
      onValidChange(formattedNumber);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    if (phoneNumber) {
      const valid = validatePhoneNumber(`+${phoneNumber}`, country);
      setIsValid(valid);
    }
  };

  return (
    <div className={`flex flex-col w-full ${className} mb-4`}>
      <div className="relative">
        <PhoneInput
          country={country}
          value={phoneNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          inputProps={{
            name: "phone",
            required,
            disabled,
            placeholder,
            className: `w-full pl-11 h-[31px] text-sm bg-white border border-blue-300 rounded px-2 py-1 focus:ring-1 outline-none transition-colors ${
              !isValid && isTouched
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "focus:border-blue-500 focus:ring-blue-500"
            }`,
          }}
          containerClass="w-full"
          buttonClass="absolute top-2 bg-transparent border-none"
          dropdownClass="bg-white shadow-lg rounded-md text-sm"
          searchClass="my-2 px-3 py-2 outline-none text-sm"
          searchPlaceholder="Search countries"
          enableSearch
          disableSearchIcon
          preferredCountries={["in", "us", "gb"]}
        />
      </div>
      {!isValid && isTouched && (
        <p className="mt-1 text-sm text-red-500 mb-20">{errorMessage}</p>
      )}
    </div>
  );
};

export default PhoneNumberInput;
