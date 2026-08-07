
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// import { updateInput } from '../../store/actions';
import InputField from '../features/nav/InputField';
import axios from 'axios';
import { login } from '../users/features/authenticationSlice';

const LoginForm = () => {
  const dispatch=useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const username = useSelector(state => state.inputs.username || '');
  const password = useSelector(state => state.inputs.password || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const api_url = process.env.REACT_APP_LOGIN_API;
      console.log('API URL:', api_url);
      const postData = { username, password };
      console.log(postData);

      const api_res = await axios.post(api_url, postData);
      console.log('Response Data:', api_res.data);
      console.log('Response Status:', api_res.status);

      if (api_res.status === 200) {
        dispatch(login());
        navigate('/your-work');
      }

    }
    catch (error) {

      if (error.response.status === 400) {
        setError("Invalid UserName or Password");
      }

      else {
        setError('Network error. Please try again later.');
      }

    }
  };

  return (
    <div className="bg-blue-50 p-16 rounded-3xl shadow-xl w-6/12">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 font-bold mb-2">Username</label>
          <InputField name="username" placeholder="Enter your username" />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 font-bold mb-2">Password</label>
          <InputField type="password" name="password" placeholder="Enter your password" />
        </div>
        <div className='flex justify-center'>
          <button type="submit" className="bg-blue-500 p-5 text-white py-2 rounded hover:bg-blue-600">Login</button>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>} {/* Display error message */}
      </form>
    </div>
  );
};

export default LoginForm;
