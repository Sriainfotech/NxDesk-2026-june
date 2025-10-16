import React from "react";
import patil_login_logo from "../assets/patil_login_logo.jpg"

const UserSideLayout = ({ children }) => {
  return (
    <div className="flex w-full min-h-screen overflow-y-auto">
      {/*flex flex-col lg:flex-row h-screen */}
      <div className="flex-1 w-full h-full relative order-2 lg:order-1 p-4 md:p-6 lg:p-0">
        <img
          src={`${patil_login_logo}`}
          alt="Illustration"
          className="object-fill w-full h-full rounded-lg md:rounded-none mx-4 md:mx-12 lg:mx-0"
        />
      </div>
      <div className="flex-1 flex flex-col items-center bg-white pt-6 order-1 lg:order-2">
        <div className="w-full px-4 lg:px-8"></div>
        <div className="mt-4 lg:mt-8 w-full flex justify-center px-4 lg:px-8">
          {children}
        </div>
      </div>
    </div> 
  );
};
export default UserSideLayout;
