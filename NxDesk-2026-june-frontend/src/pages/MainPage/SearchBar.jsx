import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../utils/axiosInstance";

// Import icons directly (assuming you're using FontAwesome)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const SearchBar = ({ className }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [articles, setArticles] = useState([]);

  // Fetch articles on component mount
  useEffect(() => {
    const fetchKnowledgeArticles = async () => {
      try {
        const response = await axiosInstance.get('/knowledge_article/knowledge_create/');
        
        // Transform API data to match article structure
        const apiArticles = response.data.map(article => ({
          id: `KB${article.article_id.toString().padStart(8, '0')}`,
          title: article.title,
          description: article.solution,
          author: article.created_by
        }));
        
        // Add mock data for testing - in production you'd use only API data
        const MOCK_ARTICLES = [
          {
            id: "KB00000028",
            title: "Improving Application Performance",
            description: "Improving Application Performance link By Sue Harper Manage and tune Oracle Application",
            author: "Sue Harper",
          },
          {
            id: "KB00002201",
            title: "Apple Cloud Syncing Performance Issue",
            description: "Apple Cloud Syncing Performance Issue Add memory to cloud servers Work around is to have users",
            author: "John Doe",
          },
          {
            id: "KB00002901",
            title: "Users experience performance issues accessing Mac applications",
            description: "Users experience performance issues accessing Mac applications Insufficient CPU, RAM, or free",
            author: "Jane Smith",
          },
          {
            id: "KB00004206",
            title: "Tips to improve PC performance in Windows 10",
            description: "Tips to improve PC performance in Windows 10 For more info about updates, including how you can",
            author: "Mike Johnson",
          },
          {
            id: "KB00004207",
            title: "Tips to improve PC performance in Windows 10",
            description: "Tips to improve PC performance in Windows 10 Having many apps, programs, web browsers, and so",
            author: "Lisa Brown",
          },
        ];
        
        setArticles([...apiArticles, ...MOCK_ARTICLES]);
      } catch (error) {
        console.error("Failed to fetch knowledge articles:", error);
      }
    };
    
    fetchKnowledgeArticles();
  }, []);

  // Filter articles when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsLoading(true);
      
      // Simulate API delay
      const timer = setTimeout(() => {
        const filtered = articles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResults(filtered);
        setShowDropdown(true); // Always show dropdown with results or no results message
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [searchTerm, articles]);

  const handleResultClick = (article) => {
    // Navigate to knowledge base page with article data using the correct path
    navigate("/request-issue/application-support/request-issue/application-support/knowledge-article", { 
      state: { 
        selectedArticle: article,
        fromSearch: true 
      } 
    });
    setShowDropdown(false);
    setSearchTerm(""); // Clear search after selection for better UX
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setResults([]);
    setShowDropdown(false);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate("/request-issue/application-support/request-issue/application-support/knowledge-article", { 
        state: { searchTerm } 
      });
      setShowDropdown(false);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    // Remove shadow from the outer container
    <div className={`relative search-container ${className}`}>
      {/* Search bar with controlled width and no shadow on container */}
      <div className="flex items-center max-w-md mx-auto">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Enter your Query"
            className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (searchTerm.trim()) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <button 
          className="bg-[#306EBF] hover:bg-blue-700 w-12 h-12 text-white rounded-r-lg flex items-center justify-center transition-colors shadow-sm"
          onClick={handleSearch}
          aria-label="Search"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      {/* Separate dropdown with exact width and position match */}
      {showDropdown && (
        <div 
          className="absolute z-20 max-w-md mx-auto left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          style={{ width: 'calc(100%)' }} // Match exact width of the search bar container
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <p className="text-sm font-medium text-gray-600">Found {results.length} results</p>
              </div>
              {results.map((article) => (
                <div 
                  key={article.id}
                  className="border-b border-gray-100 last:border-none cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => handleResultClick(article)}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{article.id}</div>
                      <div className="text-xs text-gray-400">Author: {article.author}</div>
                    </div>
                    <h4 className="font-medium text-blue-700 hover:text-blue-800">{article.title}</h4>
                    <p className="text-sm text-gray-600 truncate mt-1">{article.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="text-3xl mb-2">🔍</div>
              <p>No articles found. Try a different search term.</p>
            </div>
          )}
          
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button 
              className="w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm py-1 hover:bg-blue-50 rounded transition-colors"
              onClick={() => {
                navigate("/request-issue/application-support/request-issue/application-support/knowledge-article", { 
                  state: { searchTerm } 
                });
                setShowDropdown(false);
              }}
            >
              View all results in Knowledge Base
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;