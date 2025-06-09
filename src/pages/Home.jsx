import React, { useState, useEffect, useRef } from 'react';
import '../styles/home.css';
import Navbar from '../components/Navbar';
import { getCoordinates, getWeatherData } from '../api/weatherAPI';

const Home = () => {
  const [city, setCity] = useState('Bangalore');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddCityInput, setShowAddCityInput] = useState(false);
  const [newCityInput, setNewCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const modalRef = useRef(null);

  // Mock weather data
  const mockWeatherData = {
    current: {
      temp: 25,
      weather: [
        {
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }
      ],
      wind_speed: 3.5,
      humidity: 65,
      clouds: 20
    },
    daily: [
      {
        dt: new Date().setDate(new Date().getDate()),
        temp: { max: 28, min: 22 },
        weather: [{ description: 'Clear', icon: '01d' }]
      },
      {
        dt: new Date().setDate(new Date().getDate() + 1),
        temp: { max: 27, min: 21 },
        weather: [{ description: 'Few clouds', icon: '02d' }]
      },
      {
        dt: new Date().setDate(new Date().getDate() + 2),
        temp: { max: 26, min: 20 },
        weather: [{ description: 'Scattered clouds', icon: '03d' }]
      },
      {
        dt: new Date().setDate(new Date().getDate() + 3),
        temp: { max: 29, min: 23 },
        weather: [{ description: 'Sunny', icon: '01d' }]
      },
      {
        dt: new Date().setDate(new Date().getDate() + 4),
        temp: { max: 24, min: 19 },
        weather: [{ description: 'Rain', icon: '10d' }]
      },
      {
        dt: new Date().setDate(new Date().getDate() + 5),
        temp: { max: 25, min: 20 },
        weather: [{ description: 'Cloudy', icon: '04d' }]
      },
      {
        dt: new Date().setDate(new Date().getDate() + 6),
        temp: { max: 26, min: 21 },
        weather: [{ description: 'Partly cloudy', icon: '02d' }]
      }
    ]
  };

  // Function to fetch weather data for a city
  const fetchCityWeather = async (cityName, lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching weather for:", { cityName, lat, lon });
      
      let data;
      if (lat !== undefined && lon !== undefined) {
        // If lat and lon are provided, use them directly
        data = await getWeatherData(lat, lon);
      } else if (cityName) {
        // Otherwise, get coordinates first
        const coords = await getCoordinates(cityName);
        if (!coords || !coords.lat || !coords.lon) {
          throw new Error('Invalid coordinates received for city');
        }
        console.log("Got coordinates:", coords);
        data = await getWeatherData(coords.lat, coords.lon);
      } else {
        throw new Error('City name or coordinates required');
      }
      
      console.log("Weather data received:", data);
      
      // Validate that we have the required data
      if (!data || !data.current || !data.daily || !data.current.weather) {
        console.error("Invalid data format received:", data);
        throw new Error('Invalid weather data format received');
      }
      
      setWeatherData(data);
      setCity(cityName);
      console.log("Weather data set successfully for:", cityName);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('Error fetching weather data:', err);
      
      // Show the error as an alert for better visibility
      alert(`Error loading weather data: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch city suggestions
  const fetchCitySuggestions = async (query) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
      );
      const data = await response.json();
      setCitySuggestions(data);
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
      setCitySuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle input change with debounce
  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setNewCityInput(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      fetchCitySuggestions(value);
    }, 300); // 300ms debounce
  };

  // Handle city selection from suggestions
  const handleCitySelect = (suggestion) => {
    if (!suggestion) {
      console.error("Attempted to select null suggestion");
      return;
    }
    
    try {
      const cityName = suggestion.name || "";
      const cityNameWithState = suggestion.state 
        ? `${cityName}, ${suggestion.state}` 
        : cityName;
      const displayName = suggestion.country 
        ? `${cityNameWithState}, ${suggestion.country}` 
        : cityNameWithState;
      
      console.log("Selected city:", displayName, suggestion.lat, suggestion.lon);
      
      // Fetch weather for the selected city
      fetchCityWeather(displayName, suggestion.lat, suggestion.lon);
      
      // Reset input fields and close dropdown
      setNewCityInput('');
      setCitySuggestions([]);
      setShowAddCityInput(false);
    } catch (err) {
      console.error("Error in handleCitySelect:", err);
    }
  };

  // Handle form submission
  const handleAddCity = (e) => {
    e.preventDefault();
    if (newCityInput.trim()) {
      fetchCityWeather(newCityInput);
      setNewCityInput('');
      setCitySuggestions([]);
      setShowAddCityInput(false);
    }
  };

  // Handle city selection from navbar search
  const handleNavbarCitySelect = (cityName, lat, lon) => {
    console.log("Navbar city selected:", cityName, lat, lon);
    if (cityName && lat !== undefined && lon !== undefined) {
      fetchCityWeather(cityName, lat, lon);
    } else {
      console.error("Invalid city data received from Navbar:", { cityName, lat, lon });
      setError("Invalid city data received. Please try again.");
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddCityInput(false);
        setCitySuggestions([]);
      }
    };

    if (showAddCityInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddCityInput]);

  // Function to convert timestamp to weekday name
  const getWeekday = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Use weatherData if available, otherwise use mockWeatherData
  const displayData = weatherData || mockWeatherData;

  // Get the current weather condition for dynamic background
  const getWeatherCondition = () => {
    if (!displayData || !displayData.current || !displayData.current.weather || !displayData.current.weather[0]) {
      return 'clear'; // default
    }
    
    const condition = displayData.current.weather[0].main.toLowerCase();
    
    // Map weather conditions to background classes
    if (condition.includes('cloud')) return 'clouds';
    if (condition.includes('clear')) return 'clear';
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) return 'rain';
    if (condition.includes('snow')) return 'snow';
    if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) return 'mist';
    
    return 'clear'; // default fallback
  };

  // Initial data fetch on component mount
  useEffect(() => {
    fetchCityWeather('Bangalore');
  }, []);
  
  // Update background class when weather changes
  useEffect(() => {
    const weatherContainer = document.querySelector('.weather-container');
    if (weatherContainer) {
      const weatherClass = getWeatherCondition();
      
      // Remove all weather classes first
      weatherContainer.classList.remove('clear', 'clouds', 'rain', 'snow', 'mist');
      
      // Add the current weather class
      weatherContainer.classList.add(weatherClass);
      
      // Log the current weather for debugging
      console.log('Current weather condition:', weatherClass);
    }
  }, [displayData]);

  // Handle navbar hiding on scroll
  useEffect(() => {
    let lastScrollY = 0;
    const navbar = document.querySelector('.mobile-navbar');
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Hide navbar when scrolling down, show when scrolling up
      if (scrollY > lastScrollY && scrollY > 60) {
        navbar?.classList.add('hidden');
      } else {
        navbar?.classList.remove('hidden');
      }
      
      lastScrollY = scrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`weather-container ${getWeatherCondition()}`}>
      <div className="mobile-wrapper">
        <div className="weather-card">
          {/* Use the Navbar component with onCitySelect prop */}
          <Navbar onCitySelect={handleNavbarCitySelect} />
          
          {/* Loading and Error states */}
          {loading && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {/* Mobile Temperature Display */}
          <div className="mobile-temperature-section">
            <div className="temp-box">
              <h1 className="current-temp">{Math.round(displayData.current.temp)}°C</h1>
              <div className="flex justify-center mb-2">
                <img 
                  src={`https://openweathermap.org/img/wn/${displayData.current.weather[0].icon}@2x.png`} 
                  alt={displayData.current.weather[0].description}
                  className="w-16 h-16"
                />
                <p className="text-lg capitalize">{displayData.current.weather[0].description}</p>
              </div>
              <div className="weather-stats">
                <div className="stat">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 010-1.5h2.25a.75.75 0 010 1.5H17.25zm-6 8.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm-6-6a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm9.75 0a.75.75 0 010-1.5H21a.75.75 0 010 1.5h-2.25z" clipRule="evenodd" />
                  </svg>
                  <span>{Math.round(displayData.current.wind_speed)} m/s</span>
                </div>
                <div className="stat">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                    <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                  </svg>
                  <span>{displayData.current.humidity}%</span>
                </div>
                <div className="stat">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
                  </svg>
                  <span>{displayData.current.clouds}%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Forecast Days */}
          <div className="mobile-forecast-days">
            <div className="forecast-days">
              {displayData.daily.slice(0, 7).map((day, index) => (
                <div key={index} className={`day-forecast ${index === 0 ? 'active' : ''}`}>
                  <p className="day-name">{getWeekday(day.dt)}</p>
                  <img 
                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                    alt={day.weather[0].description}
                    className="w-10 h-10"
                  />
                  <div className="day-temp">
                    <span className="temp">{Math.round(day.temp.max)}°</span>
                    <span className="text-gray-400 ml-1">{Math.round(day.temp.min)}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="main-content">
            <div className="header">
              <div className="weather-forecast">
                <p>Weather Forecast</p>
              </div>
              <div className="header-right">
                <div className="location-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <span>{city}</span>
                </div>
              </div>
            </div>
            
            <div className="weather-info">
              <div className="current-weather">
                <div className="weather-details">
                  <h1 className="weather-title capitalize">{displayData.current.weather[0].main}</h1>
                  <p className="weather-description capitalize">
                    {displayData.current.weather[0].description}. 
                    <br />Wind speed: {displayData.current.wind_speed} m/s.
                    <br />Humidity: {displayData.current.humidity}%.
                  </p>
                  
                  <div className="forecast-days">
                    {displayData.daily.slice(0, 7).map((day, index) => (
                      <div key={index} className={`day-forecast ${index === 0 ? 'active' : ''}`}>
                        <p className="day-name">{getWeekday(day.dt)}</p>
                        <img 
                          src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                          alt={day.weather[0].description}
                          className="w-10 h-10"
                        />
                        <div className="day-temp">
                          <span className="temp">{Math.round(day.temp.max)}°</span>
                          <span className="text-gray-400 ml-1">{Math.round(day.temp.min)}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="temperature-display">
                  <div className="temp-box">
                    <h1 className="current-temp">{Math.round(displayData.current.temp)}°C</h1>
                    <div className="flex justify-center mb-4">
                      <img 
                        src={`https://openweathermap.org/img/wn/${displayData.current.weather[0].icon}@2x.png`} 
                        alt={displayData.current.weather[0].description}
                        className="w-20 h-20"
                      />
                    </div>
                    <div className="weather-stats">
                      <div className="stat">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 010-1.5h2.25a.75.75 0 010 1.5H17.25zm-6 8.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm-6-6a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm9.75 0a.75.75 0 010-1.5H21a.75.75 0 010 1.5h-2.25z" clipRule="evenodd" />
                        </svg>
                        <span>{Math.round(displayData.current.wind_speed)} m/s</span>
                      </div>
                      <div className="stat">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                          <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                        </svg>
                        <span>{displayData.current.humidity}%</span>
                      </div>
                      <div className="stat">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" clipRule="evenodd" />
                        </svg>
                        <span>{displayData.current.clouds}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="other-locations">
                <div className="location-box">
                  <div className="location-info">
                    <p className="country">India</p>
                    <div className="location-name-temp">
                      <h3>Bangalore</h3>
                      <h3 className="other-temp" onClick={() => fetchCityWeather('Bangalore')}>
                        25°
                      </h3>
                    </div>
                    <p className="condition">
                      Clear
                    </p>
                  </div>
                </div>
                
                <div className="location-box">
                  <div className="location-info">
                    <p className="country">India</p>
                    <div className="location-name-temp">
                      <h3>Mumbai</h3>
                      <h3 className="other-temp" onClick={() => fetchCityWeather('Mumbai')}>
                        28°
                      </h3>
                    </div>
                    <p className="condition">
                      Partly Cloudy
                    </p>
                  </div>
                </div>
                
                <div className="location-box">
                  <div className="location-info">
                    <p className="country">India</p>
                    <div className="location-name-temp">
                      <h3>Delhi</h3>
                      <h3 className="other-temp" onClick={() => fetchCityWeather('Delhi')}>
                        30°
                      </h3>
                    </div>
                    <p className="condition">
                      Sunny
                    </p>
                  </div>
                </div>
                
                <div className="location-box add-location" onClick={() => setShowAddCityInput(true)}>
                  <div className="add-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Add City Modal */}
          {showAddCityInput && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div 
                ref={modalRef} 
                className="bg-white rounded-lg p-6 w-80 max-w-md relative shadow-xl"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-800">Add New City</h3>
                <form onSubmit={handleAddCity}>
                  <div className="mb-4 relative">
                    <input
                      type="text"
                      value={newCityInput}
                      onChange={handleCityInputChange}
                      placeholder="Enter city name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    
                    {/* Loading indicator for suggestions */}
                    {loadingSuggestions && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                    
                    {/* City suggestions dropdown */}
                    {citySuggestions.length > 0 && (
                      <div className="suggestion-dropdown absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-auto">
                        {citySuggestions.map((suggestion, index) => {
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
                                borderBottom: index < citySuggestions.length - 1 ? '1px solid #edf2f7' : 'none',
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
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCityInput(false);
                        setCitySuggestions([]);
                        setNewCityInput('');
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                      disabled={loadingSuggestions}
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;