import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <Outlet /> {/* All nested pages go here */}
      </div>
    </>
  );
};

export default MainLayout;
