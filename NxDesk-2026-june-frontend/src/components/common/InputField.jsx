import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateInput } from '../../store/actions';

const InputField = ({ name, placeholder, type = 'text' }) => {
  const value = useSelector(state => state.inputs[name] || '');
  console.log(`Rendering ${name} with value: ${value}`);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const newValue = e.target.value;
    console.log(newValue);
    dispatch(updateInput({ name, value: newValue }));
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 border rounded-xl bg-white outline-none"
    />
  );
};

export default InputField;