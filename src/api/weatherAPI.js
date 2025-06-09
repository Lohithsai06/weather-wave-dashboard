// src/api/weatherAPI.js

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export async function getCoordinates(city) {
  if (!city) {
    console.error("No city provided to getCoordinates");
    throw new Error("City name is required");
  }
  
  try {
    console.log(`Fetching coordinates for: ${city}`);
    const encodedCity = encodeURIComponent(city.trim());
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedCity}&limit=1&appid=${API_KEY}`;
    
    console.log(`API request URL: ${url.replace(API_KEY, 'API_KEY')}`);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Coordinates API response:", data);
    
    if (!data || data.length === 0) {
      throw new Error("City not found");
    }
    
    return { lat: data[0].lat, lon: data[0].lon };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    throw error;
  }
}

export async function getWeatherData(lat, lon) {
  if (lat === undefined || lon === undefined) {
    console.error("Invalid coordinates:", { lat, lon });
    throw new Error("Valid latitude and longitude are required");
  }
  
  try {
    console.log(`Fetching weather data for coordinates: lat=${lat}, lon=${lon}`);
    
    // Using the current weather API endpoint for simplicity and compatibility
    // This endpoint works with free API keys
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    
    console.log(`Weather API request URL: ${url.replace(API_KEY, 'API_KEY')}`);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Weather API responded with status: ${res.status}`);
    }
    
    const currentWeatherData = await res.json();
    console.log("Current weather data received:", currentWeatherData);
    
    // Now get forecast data
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    console.log(`Forecast API request URL: ${forecastUrl.replace(API_KEY, 'API_KEY')}`);
    
    const forecastRes = await fetch(forecastUrl);
    
    if (!forecastRes.ok) {
      throw new Error(`Forecast API responded with status: ${forecastRes.status}`);
    }
    
    const forecastData = await forecastRes.json();
    console.log("Forecast data received:", forecastData);
    
    // Format the data to match our expected format
    const formattedData = {
      current: {
        temp: currentWeatherData.main.temp,
        weather: currentWeatherData.weather,
        wind_speed: currentWeatherData.wind.speed,
        humidity: currentWeatherData.main.humidity,
        clouds: currentWeatherData.clouds.all
      },
      daily: formatForecastData(forecastData)
    };
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}

// Helper function to format 5-day forecast data into daily format
function formatForecastData(forecastData) {
  if (!forecastData || !forecastData.list || !Array.isArray(forecastData.list)) {
    return [];
  }
  
  // Group forecast data by day
  const dailyData = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyData[day]) {
      dailyData[day] = {
        dt: item.dt * 1000,
        temp: {
          min: item.main.temp_min,
          max: item.main.temp_max
        },
        weather: [item.weather[0]]
      };
    } else {
      // Update min/max temps if needed
      if (item.main.temp_min < dailyData[day].temp.min) {
        dailyData[day].temp.min = item.main.temp_min;
      }
      if (item.main.temp_max > dailyData[day].temp.max) {
        dailyData[day].temp.max = item.main.temp_max;
      }
    }
  });
  
  // Convert to array and take first 7 days (or less if not available)
  return Object.values(dailyData).slice(0, 7);
} 