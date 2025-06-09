import React, { useState, useRef, useEffect } from 'react';

const Navbar = ({ onCitySelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Function to fetch city suggestions
  const fetchCitySuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get API key from environment variables
      const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
      
      if (!API_KEY) {
        console.error("API key not found in environment variables");
        throw new Error("API key not configured");
      }
      
      console.log("Fetching suggestions for:", query, "with API Key:", API_KEY ? "Key exists" : "No key found");
      
      // Use a CORS proxy if needed
      const encodedQuery = encodeURIComponent(query.trim());
      const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedQuery}&limit=5&appid=${API_KEY}`;
      
      console.log("API URL:", apiUrl.replace(API_KEY, "API_KEY_HIDDEN"));
      
      const response = await fetch(apiUrl);
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log("Suggestions raw data:", JSON.stringify(data));
      
      if (!Array.isArray(data)) {
        console.error("Expected array but got:", typeof data);
        setSuggestions([]);
        return;
      }
      
      console.log("Number of suggestions:", data.length);
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching city suggestions:', err.message);
      setError('Failed to fetch suggestions: ' + err.message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log("Input changed:", value);
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      fetchCitySuggestions(value);
    }, 300); // 300ms debounce
  };

  // Handle city selection
  const handleCitySelect = (suggestion) => {
    if (!suggestion) {
      console.error("Attempted to select null suggestion");
      return;
    }
    
    try {
      const cityName = suggestion.name || "";
      const stateName = suggestion.state || "";
      const countryName = suggestion.country || "";
      
      const cityNameWithState = stateName 
        ? `${cityName}, ${stateName}` 
        : cityName;
      const displayName = countryName 
        ? `${cityNameWithState}, ${countryName}` 
        : cityNameWithState;
      
      const lat = suggestion.lat;
      const lon = suggestion.lon;
      
      console.log("Selected city:", displayName, lat, lon);
      
      if (!lat || !lon) {
        console.error("City is missing coordinates:", suggestion);
        alert("This city doesn't have valid coordinates. Please try another one.");
        return;
      }
      
      // Call the parent component's onCitySelect function
      if (onCitySelect && typeof onCitySelect === 'function') {
        onCitySelect(displayName, lat, lon);
      } else {
        console.error("onCitySelect is not a function or is undefined");
      }
      
      // Reset search field and close search bar
      setSearchQuery('');
      setSuggestions([]);
      setIsSearchOpen(false);
    } catch (err) {
      console.error("Error in handleCitySelect:", err);
      alert("Error selecting city. Please try again.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search submitted, suggestions:", suggestions.length);
    // If there are suggestions, select the first one
    if (suggestions.length > 0) {
      handleCitySelect(suggestions[0]);
    } else if (searchQuery.trim().length > 0) {
      // If no suggestions but we have a query, try to search directly
      console.log("No suggestions available, searching directly for:", searchQuery);
      fetchCitySuggestions(searchQuery);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSuggestions([]);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  return (
    <>
      {/* Desktop Navbar */}
      <div className="desktop-navbar">
        <div className="welcome-section">
          <p className="welcome-text">Welcome to</p>
          <h2 className="location-name">Weather App</h2>
        </div>
        
        <div className="sidebar-menu">
          {/* Location icon - keep this one */}
          <div className="menu-item">
            <span className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          
          {/* Search icon */}
          <div className="menu-item" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <span className="menu-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        </div>
      </div>
      
      {/* Mobile Navbar */}
      <div className="mobile-navbar">
        <div className="welcome-text">Welcome to</div>
        <div className="location-name-header">Weather App</div>
        <div className="mobile-nav-icons">
          {/* Location icon - keep this one */}
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Search icon */}
          <div className="nav-icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Search Bar - appears when search icon is clicked */}
      {isSearchOpen && (
        <div 
          ref={searchContainerRef}
          className="search-container"
          style={{ zIndex: 9999 }}
        >
          <form onSubmit={handleSearch} className="search-form">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search city..."
                value={searchQuery}
                onChange={handleInputChange}
                className="search-input w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              
              {/* Loading indicator */}
              {loading && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {/* City suggestions dropdown */}
              {suggestions && suggestions.length > 0 && (
                <div className="suggestion-dropdown absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => {
                    if (!suggestion) return null;
                    
                    const cityName = suggestion.name || "";
                    const stateName = suggestion.state ? `, ${suggestion.state}` : '';
                    const countryName = suggestion.country ? `, ${suggestion.country}` : '';
                    
                    return (
                      <div
                        key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                        className="suggestion-item px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center border-b border-gray-100"
                        onClick={() => handleCitySelect(suggestion)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: index < suggestions.length - 1 ? '1px solid #edf2f7' : 'none',
                          background: 'white',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ebf5ff'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div className="mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
                            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 500, color: '#1a202c' }}>{cityName}</span>
                          <span style={{ color: '#718096' }}>{stateName}{countryName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="absolute mt-1 w-full bg-red-100 text-red-700 p-2 rounded-md">
                  {error}
                </div>
              )}
            </div>
            <button type="submit" className="search-button bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md">
              Search
            </button>
          </form>
          <button className="close-search ml-2" onClick={() => setIsSearchOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default Navbar; 