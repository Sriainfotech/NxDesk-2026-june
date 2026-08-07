import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setActivePage } from "../store/Slices/uiSlice";
import { logout } from "../store/Slices/auth/authenticationSlice";

import {
  User,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  Loader2,
  Menu,
  X,
} from "lucide-react";

// const navItems = [
//   { name: "My Actions", path: "/actions" },
//   { name: "Helpful Links", path: "/links" },
//   { name: "Other Portals", path: "/portals" },
// ];

const Navbar = ({ isLoading = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activePage = useSelector((state) => state.ui.activePage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const userProfile = useSelector((state) => state.userProfile.user);

  // Handle navigation item click
  const handleNavItemClick = (item) => {
    if (!isLoading) {
      dispatch(setActivePage(item.name));
    }
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = () => {
    if (!isLoading) {
      setIsProfileDropdownOpen(!isProfileDropdownOpen);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    if (!isLoading) {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sign out handler
  const onClickSignOutBtn = () => {
    if (!isLoading) {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="mt-1 text-sm font-medium text-blue-800">
              Work in progress...
            </span>
          </div>
        </div>
      )}

      <header className="w-full shadow-sm bg-white">
        {/* Use full width container without max-width constraints */}
        <div className="w-full">
          <nav className="px-4 py-2">
            {/* Use justify-between to push logo to left edge and profile to right edge */}
            <div className="flex items-center justify-between w-full">
              {/* Logo - stays at left edge */}
              <div className="flex-shrink-0">
                <Link
                  to="/"
                  className="text-2xl font-bold text-blue-800 hover:text-blue-600 transition-colors flex items-center"
                  onClick={() => !isLoading && handleNavItemClick("Home")}
                >
                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md mr-1">
                    Nx
                  </span>
                  <span className="text-blue-600">Desk</span>
                </Link>
              </div>

              {/* Center Navigation Items - Hidden on mobile */}
              {/* <div className="hidden md:flex flex-1 justify-center">
                <ul className="flex space-x-1">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => handleNavItemClick(item)}
                        className={`
                          px-3 py-1.5 rounded-md transition-all text-sm font-medium
                          ${
                            activePage === item.name
                              ? "bg-blue-50 text-blue-800 border-b-2 border-blue-600"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div> */}

              {/* Right side - Profile and Mobile Menu Button */}
              <div className="flex items-center space-x-2">
                {/* Mobile menu button */}
                <button
                  className="md:hidden mobile-menu-button p-1 rounded-md hover:bg-blue-50 focus:outline-none"
                  onClick={toggleMobileMenu}
                  disabled={isLoading}
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Profile Section - stays at right edge */}
                <div className="relative flex-shrink-0" ref={dropdownRef}>
                  <div
                    className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                    onClick={toggleProfileDropdown}
                  >
                    <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ring-1 ring-blue-400">
                      {userProfile && userProfile.profile_pic_url ? (
                        <img
                          src={userProfile.profile_pic_url}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-gray-800 font-medium text-xs leading-tight">
                        {userProfile ? userProfile.username : "Guest"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {userProfile ? userProfile.role || "User" : "Sign in"}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg z-10 border border-gray-100 overflow-hidden">
                      <div className="p-3 border-b border-gray-50 bg-white">
                        <p className="font-medium text-gray-800 text-sm">
                          {userProfile
                            ? `${userProfile.first_name} ${
                                userProfile.last_name || ""
                              }`
                            : "Guest User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {userProfile
                            ? userProfile.email || "No email provided"
                            : "Please sign in"}
                        </p>
                      </div>

                      <div className="py-1">
                        <div
                          className="px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center"
                          onClick={() => {
                            if (!isLoading) {
                              navigate("/profile");
                              setIsProfileDropdownOpen(false);
                            }
                          }}
                        >
                          <User className="w-3.5 h-3.5 mr-2 text-blue-500" />
                          Your Profile
                        </div>
                        <div className="border-t border-gray-50 my-1"></div>
                        <div
                          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer flex items-center"
                          onClick={onClickSignOutBtn}
                        >
                          <LogOut className="w-3.5 h-3.5 mr-2 text-red-500" />
                          Sign out
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Menu */}
          {/* {isMenuOpen && (
            <div
              className="md:hidden bg-white py-2 border-t border-blue-50 rounded-b-lg"
              ref={mobileMenuRef}
            >
              <ul className="space-y-1 px-4">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (!isLoading) {
                          handleNavItemClick(item);
                          setIsMenuOpen(false);
                        }
                      }}
                      className={`
                        block px-3 py-1.5 rounded-md text-sm font-medium
                        ${
                          activePage === item.name
                            ? "bg-blue-50 text-blue-800 border-l-2 border-blue-600"
                            : "text-gray-700 hover:bg-blue-50"
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="border-t border-blue-50 my-2"></div>

              <div className="px-4">
                <div className="flex items-center space-x-3 p-1">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center overflow-hidden ring-1 ring-blue-400">
                    {userProfile && userProfile.profile_pic ? (
                      <img
                        src={userProfile.profile_pic}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium text-xs">
                      {userProfile ? userProfile.first_name : "Guest"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {userProfile
                        ? userProfile.email || "No email provided"
                        : "Please sign in"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 mt-2">
                  <div
                    className="px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 rounded-md cursor-pointer flex items-center"
                    onClick={() => {
                      if (!isLoading) {
                        navigate("/profile");
                        setIsMenuOpen(false);
                      }
                    }}
                  >
                    <User className="w-3.5 h-3.5 mr-2 text-blue-500" />
                    Your Profile
                  </div>
                  <div
                    className="px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 rounded-md cursor-pointer flex items-center"
                    onClick={() => {
                      if (!isLoading) {
                        navigate("/settings");
                        setIsMenuOpen(false);
                      }
                    }}
                  >
                    <Settings className="w-3.5 h-3.5 mr-2 text-blue-500" />
                    Settings
                  </div>
                  <div
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md cursor-pointer flex items-center"
                    onClick={onClickSignOutBtn}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2 text-red-500" />
                    Sign out
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </header>
    </div>
  );
};

export default Navbar;
