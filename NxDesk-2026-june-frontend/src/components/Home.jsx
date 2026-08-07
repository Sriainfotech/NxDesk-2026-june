import React from 'react'
import SideBarItems from './SideBarItems'
import Sidebar from './Sidebar'
import MainHomeContent from './MainHomeContent'

function Home() {
  return (
    <div className="flex-1 flex flex-col">
        <div className="h-full w-full  flex ">
          {/* <div className='w-[448px] hidden lg:block'> */}
          <div>
            {/* <SideBarItems /> */}
            <Sidebar />
          </div>
          <MainHomeContent />

      </div>
    </div>
  )
}

export default Home

/* 
import React, { useState } from 'react';
import SideBarItems from './SideBarItems';
import MainHomeContent from './MainHomeContent';

function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-full w-full flex flex-col md:flex-row">
        <div className={`w-full md:w-[448px] ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <SideBarItems />
        </div>

        <div className="flex-1 w-full">
          <MainHomeContent />
        </div>
      </div>

      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 left-4 bg-blue-600 text-white p-2 rounded-full"
      >
        ☰
      </button>
    </div>
  );
}

export default Home;
 */