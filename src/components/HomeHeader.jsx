    
import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';


function HomeHeader({ onMenuClick }) {
  return (
    <div className="w-full bg-white p-4 shadow-md flex items-center justify-between">
      <button className="md:hidden" onClick={onMenuClick}>
        <Bars3Icon className="h-6 w-6 text-blue-700" />
      </button>
      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Enter your Query"
          className="w-full p-2 border rounded-lg focus:outline-none"
        />
      </div>
      <div className="hidden md:block h-10 w-10 bg-gray-300 rounded-full" />
    </div>
  );
}
export default HomeHeader;

  