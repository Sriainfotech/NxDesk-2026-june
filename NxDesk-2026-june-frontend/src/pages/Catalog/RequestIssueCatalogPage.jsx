import React, { useState, useEffect } from "react";
import { ChevronRight, Search, X, FileQuestion, Layers } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../../utils/axiosInstance.js";
import ChatbotPopup from "../../components/ChatBot";
import {
  setActiveServiceDomain,
  setActiveServiceType,
  clearSelection,
} from "../../store/Slices/serviceDomainSlice";
import { ToastContainer, toast } from "react-toastify";

const RequestIssueCatalogPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategoryState] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories and issue types from API
  useEffect(() => {
    const fetchCategoriesAndIssueTypes = async () => {
      try {
        setIsLoading(true);
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          toast.error("Please log in to access this page.");
          setIsLoading(false);
          return;
        }
        // Replace with your actual API endpoint
        const response = await axiosInstance.get("/services/categories/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setCategories(response.data);
        console.log(response.data)
        setError(null);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoriesAndIssueTypes();
  }, []);

  // Format categories for sidebar
  const mainCategories = categories
    .filter((category) => category.is_active)
    .map((category) => ({
      title: category.name,
      description: category.description,
// In your icon mapping (around line 72), add detailed logging:
icon: category.icon_url ? (
  <img
    src={category.icon_url}
    alt={category.name}
   className="w-5 h-5 object-contain"
    onLoad={(e) => {
      console.log(`✅ Image loaded successfully:`, category.name);
      console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
    }}
    onError={(e) => {
      console.log(`❌ Image failed to load:`, category.name);
      console.log('Error source:', e.target.src);
      console.log('Error event:', e);
    }}
  />
) : (
  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
    <span className="text-xs text-gray-500">?</span>
  </div>
),
      id: `category-${category.issue_category_id}`,
      hasSubcategories: category.issue_types && category.issue_types.length > 0,
      originalId: category.issue_category_id,
    }));

  // Get issue types for the active category
  const getServiceItems = () => {
    if (!activeCategory) return [];

    const activeCategoryId = activeCategory.replace("category-", "");
    const selectedCategory = categories.find(
      (cat) => cat.issue_category_id.toString() === activeCategoryId
    );

    if (!selectedCategory || !selectedCategory.issue_types) return [];

    return selectedCategory.issue_types.map((type) => ({
      title: type.name,
      description: type.description,
 icon: type.icon_url ? (
  <img
    src={type.icon_url}
    alt={type.name}
  className="w-5 h-5 object-contain"
  />
) : (
  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
    <span className="text-xs text-gray-500">?</span>
  </div>
),
      link: `/request-issue/application-support/${type.name.toLowerCase().replace(/\s+/g, '-')}/create-issue`,
      disabled: !type.is_active,
      id: `service-${type.issue_type_id}`,
      originalId: type.issue_type_id,
    }));
  };

  // Create a flattened array of all searchable items
  const getAllSearchableItems = () => {
    const allItems = [...mainCategories];

    categories.forEach((category) => {
      if (category.issue_types && category.issue_types.length > 0) {
        category.issue_types.forEach((type) => {
          allItems.push({
            title: type.name,
            description: type.description,
       icon: type.icon_url ? (
  <img
    src={type.icon_url}
    alt={type.name}
   className="w-5 h-5 object-contain"

  />
) : (
  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
    <span className="text-xs text-gray-500">?</span>
  </div>
),
            parentCategory: `category-${category.issue_category_id}`,
            parentCategoryTitle: category.name,
            link: `/request-issue/application-support/${type.name.toLowerCase()}/create-issue`,
            disabled: !type.is_active,
            id: `service-${type.issue_type_id}`,
          });
        });
      }
    });

    return allItems;
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const allItems = getAllSearchableItems();
    const filteredResults = allItems.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filteredResults);
    setShowSearchResults(true);
  }, [searchTerm, categories]);

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0 },
  };

  const breadcrumbVariants = {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.4, delay: 0.1 } },
  };

  const handleCategoryClick = (categoryId) => {
    const newActiveCategory = activeCategory === categoryId ? null : categoryId;
    setActiveCategoryState(newActiveCategory);
    
    // Find the category object for Redux store
    if (newActiveCategory) {
      const categoryObj = mainCategories.find(cat => cat.id === newActiveCategory);
      if (categoryObj) {
        dispatch(setActiveServiceDomain({
          originalId: categoryObj.originalId,
          title: categoryObj.title
        }));
      }
    } else {
      dispatch(setActiveServiceDomain(null));
    }
    
    setHighlightedItem(null);
  };

  const handleItemClick = (link, disabled, itemId = null) => {
    if (!disabled) {
      if (itemId) {
        setHighlightedItem(itemId);
        
        // Find the item by ID for Redux store
        const selectedItem = getServiceItems().find(item => item.id === itemId);
        if (selectedItem) {
          // Store the active category and selected service in Redux
          const activeCategoryObj = mainCategories.find(cat => cat.id === activeCategory);
          
          if (activeCategoryObj) {
            dispatch(setActiveServiceDomain({
              originalId: activeCategoryObj.originalId,
              title: activeCategoryObj.title
            }));
          }
          
          dispatch(setActiveServiceType({
            originalId: selectedItem.originalId,
            title: selectedItem.title
          }));
        }
      }
      navigate(link);
    }
  };

  const handleSearchItemClick = (item) => {
    if (item.parentCategory) {
      // It's a subcategory item
      setActiveCategoryState(item.parentCategory);
      setHighlightedItem(item.id);
      
      // Find the parent category object for Redux
      const parentCategoryObj = mainCategories.find(cat => cat.id === item.parentCategory);
      if (parentCategoryObj) {
        dispatch(setActiveServiceDomain({
          originalId: parentCategoryObj.originalId,
          title: parentCategoryObj.title
        }));
      }
      
      // Set the selected service if it's not disabled
      if (!item.disabled) {
        dispatch(setActiveServiceType({
          originalId: item.originalId,
          title: item.title
        }));
      }
    } else {
      // It's a main category
      setActiveCategoryState(item.id);
      setHighlightedItem(null);
      
      // Store category in Redux
      dispatch(setActiveServiceDomain({
        originalId: item.originalId,
        title: item.title
      }));
      dispatch(setActiveServiceType(null));
    }
  
    setSearchTerm("");
    setShowSearchResults(false);
  };

  // Get the title of the active category
  const getActiveCategoryTitle = () => {
    if (activeCategory) {
      const category = mainCategories.find((cat) => cat.id === activeCategory);
      return category ? category.title : "";
    }
    return "";
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4789] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#1a4789] text-white rounded-md hover:bg-[#0e3572] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const serviceItems = getServiceItems();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex h-screen bg-gray-50 overflow-hidden"
    >
      {/* Left Sidebar - Reduced width */}
      <div className="w-1/6 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="py-2 px-3">
          <h2 className="text-lg font-bold text-[#1a4789] mb-2">Service Domain</h2>
          <ul className="space-y-0.5">
            {mainCategories.map((category) => (
              <li key={category.id}>
                <button
                  className={`w-full text-left py-2 px-2 rounded-md flex items-center space-x-2 hover:bg-gray-100 text-sm
                    ${
                      activeCategory === category.id
                        ? "bg-gray-100 font-semibold text-[#1a4789]"
                        : ""
                    }`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="flex-shrink-0">{category.icon}</div>
                  <div className="flex-1">{category.title}</div>
                  {category.hasSubcategories && (
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${
                        activeCategory === category.id
                          ? "transform rotate-90"
                          : ""
                      }`}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb with reduced padding */}
        <motion.nav
          variants={breadcrumbVariants}
          initial="initial"
          animate="animate"
          className="bg-white py-2 px-3 border-b border-gray-200 flex justify-between items-center"
        >
          <div className="flex items-center text-sm">
            <Link
              to="/"
              className="hover:text-blue-600 font-bold text-[#224D86]"
            >
              <motion.div whileHover={{ scale: 1.05 }}>Home</motion.div>
            </Link>
            <ChevronRight className="mx-1 w-3 h-3 text-gray-500" />
            <Link
              to="/request-issue"
              className="hover:text-blue-600 font-bold text-[#224D86]"
            >
              <motion.div whileHover={{ scale: 1.05 }}>
                Request Issue
              </motion.div>
            </Link>
            {activeCategory && (
              <>
                <ChevronRight className="mx-1 w-3 h-3 text-gray-500" />
                <span className="font-semibold text-gray-800">
                  {getActiveCategoryTitle()}
                </span>
              </>
            )}
          </div>

          {/* Compact search field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-6 py-1 border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setShowSearchResults(false);
                }}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-auto">
                {searchResults.map((item, index) => (
                  <div
                    key={index}
                    className="py-2 px-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 text-sm"
                    onClick={() => handleSearchItemClick(item)}
                  >
                    <div className="flex items-center">
                      <div className="mr-2 flex-shrink-0">{item.icon}</div>
                      <div className="flex flex-col">
                        <h4 className="font-medium text-gray-800">
                          {item.title}
                        </h4>
                        {item.parentCategoryTitle && (
                          <p className="text-xs text-gray-500">
                            in {item.parentCategoryTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.nav>

        {/* Content with optimized spacing */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            {activeCategory && serviceItems.length > 0 ? (
              <div>
                {/* Category Title - more compact */}
                <h1 className="font-bold text-xl text-gray-800 mb-3">
                  {getActiveCategoryTitle()}
                </h1>

                {/* Grid with more columns on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {serviceItems.map((item, idx) => (
                    <div
                      key={idx}
                      id={item.id}
                      className={`border border-gray-200 ${
                        item.disabled ? "opacity-75" : ""
                      } bg-white shadow-sm hover:shadow transition-shadow ${
                        item.disabled ? "cursor-not-allowed" : "cursor-pointer"
                      } ${
                        highlightedItem === item.id
                          ? "ring-1 ring-blue-500"
                          : ""
                      }`}
                      onClick={() =>
                        handleItemClick(item.link, item.disabled, item.id)
                      }
                    >
                      <div className="p-2 border-b border-gray-200 bg-[#f5f5f5] flex items-center gap-2">
                        {item.icon}
                        <h3 className="font-semibold text-[#1a4789] text-sm">
                          {item.title}
                        </h3>
                      </div>
                      <div className="p-2">
                        <p className="text-gray-600 text-xs">
                          {item.description}
                        </p>
                        <div className="mt-2 text-right">
                          {item.disabled ? (
                            <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded-full text-xs font-bold">
                              Coming Soon
                            </span>
                          ) : (
                            <button
                              className="text-[#1a4789] font-medium hover:underline text-xs"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent double firing with parent onClick
                                handleItemClick(
                                  item.link,
                                  item.disabled,
                                  item.id
                                );
                              }}
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeCategory ? (
              <div className="text-center py-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded text-sm">
                  <p className="font-bold">Coming Soon</p>
                  <p>This service category is currently under development.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                {/* Smaller welcome graphic */}
                <div className="flex justify-center items-center mb-4">
                  <FileQuestion size={60} className="text-[#1a4789] mr-3" />
                  <Layers size={60} className="text-[#1a4789]" />
                </div>
                <h2 className="text-xl font-bold text-[#1a4789] mb-2">
                  Welcome to the Service Catalog
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                  Please select a category from the sidebar to view available
                  services and submit your request.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatbotPopup />
      <ToastContainer
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </motion.div>
  );
};

export default RequestIssueCatalogPage;
