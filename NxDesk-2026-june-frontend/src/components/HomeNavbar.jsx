import React from 'react';

const HomeNavbar = () => {
  return (
    <nav className="w-full flex items-center justify-between p-6 bg-white">
      <div className="text-xl font-bold text-blue-900">NxDesk</div>
      <a href="/login" className="text-black-500 font-bold hover:underline">Login</a>
    </nav>
  );
};

export default HomeNavbar;