
import React from 'react';

function Footer() {
  return (
    <div className="bg-gray-200 text-center py-4">
      <a href="/lock" className="text-blue-600 font-bold">Account locked out?</a>
      <br />
      <a href="/forgot-password" className="text-blue-600 font-bold">Want to reset password?</a>
    </div>
  );
}

export default Footer;