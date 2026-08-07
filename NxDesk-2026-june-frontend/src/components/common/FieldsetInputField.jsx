// FieldsetInputField.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateInput } from '../../store/actions';

const FieldsetInputField = ({ id, label, type, name, onChange,value }) => {
  // const value = useSelector((state) => state.inputs[name] || '');
  const dispatch = useDispatch();

  // Handle input change and update Redux state
  const handleChange = (e) => {
    const newValue = e.target.value;
    dispatch(updateInput({ name, value: newValue }));
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="px-1 text-gray-800 font-bold transition-all duration-300 transform peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:left-3 peer-focus:text-sm peer-focus:text-gray-800 peer-focus:bg-blue-50 z-10"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        name={name}
        value={value}

        onChange={handleChange}
        placeholder=" " 
        className="peer w-full px-4 pt-3 pb-3 mb-4 focus:outline-none rounded-md"
      />
      
    </div>
  );
};

export default FieldsetInputField;
