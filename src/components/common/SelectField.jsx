
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

const SelectField = ({ label, optionsKey, valueKey, onChangeAction, required = false }) => {
  const options = useSelector((state) => state.options[optionsKey]) || [];
  const value = useSelector((state) => state.form[valueKey]);
  const dispatch = useDispatch();

  const handleChange = (event) => {
    dispatch(onChangeAction(event.target.value));
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        {label}{required && ' *'}
      </label>
      <select
        value={value}
        onChange={handleChange}
        required={required}
        className="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        <option value="" disabled>Select {label}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;

