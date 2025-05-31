// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentDateTime = document.getElementById('currentDateTime');
const weatherBackground = document.getElementById('weatherBackground');

// Weather API
const apiKey = 'e73023adc2f24712bb444845252305'; // WeatherAPI key
const unsplashAccessKey = 'cFMxysi6jHLdvjsbZxSgZwXlJ5iS2cD8HtLPkdNcRfU'; // Unsplash access key

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Set up event listeners
  searchBtn.addEventListener('click', getWeather);
  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getWeather();
  });

  // Try to get user's location automatically
  getLocation();
});

// Try to get user's geolocation
function getLocation() {
  console.log('Requesting location permission...');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location access granted');
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        console.error('Location access denied:', error);
        showAlert('Location access denied. Using default location (New York).');
        // Fallback to New York coordinates
        getWeatherByCoords(40.7128, -74.0060);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    console.error('Geolocation not supported');
    showAlert('Geolocation not supported. Using default location (New York).');
    // Fallback to New York coordinates
    getWeatherByCoords(40.7128, -74.0060);
  }
}

function setDefaultState() {
  console.log('Setting default state');
  document.getElementById('cityName').textContent = 'Search for a location';
  document.getElementById('description').textContent = '--';
  document.getElementById('temperature').textContent = '--°';
  document.getElementById('humidity').textContent = '--%';
  document.getElementById('wind').textContent = '-- km/h';
  document.getElementById('precip').textContent = '-- mm';
  document.getElementById('feelsLike').textContent = '--°';
  document.getElementById('weatherIcon').src = 'https://cdn.weatherapi.com/weather/64x64/day/116.png';
  weatherBackground.style.backgroundImage = 'linear-gradient(135deg, #4361ee, #3a0ca3)';
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  console.log(`Fetching weather for coordinates: ${lat}, ${lon}`);
  showLoading(true);
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3`;
  
  try {
    const response = await fetch(url);
    console.log('Weather API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);
    
    cityInput.value = data.location.name;
    updateCurrentWeather(data);
    updateForecast(data.forecast.forecastday);
    updateWeatherBackground(data.current.condition.text, data.location.name);
    
  } catch (error) {
    console.error('Error fetching weather:', error);
    showAlert('Error fetching weather data. Please try again.');
    setDefaultState();
  } finally {
    showLoading(false);
  }
}

// Update weather background based on conditions
async function updateWeatherBackground(weatherCondition, locationName) {
  console.log('Updating background for:', weatherCondition);
  const condition = weatherCondition.toLowerCase();
  let query = '';
  
  if (condition.includes('rain')) {
    query = 'rainy+weather';
  } else if (condition.includes('sun') || condition.includes('clear')) {
    query = 'sunny+weather';
  } else if (condition.includes('cloud')) {
    query = 'cloudy+weather';
  } else if (condition.includes('snow')) {
    query = 'snow+weather';
  } else if (condition.includes('storm')) {
    query = 'storm+weather';
  } else if (condition.includes('fog') || condition.includes('mist')) {
    query = 'foggy+weather';
  } else {
    query = `${locationName}+landscape`;
  }

  try {
    console.log('Fetching background image from Unsplash...');
    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${query}&client_id=${unsplashAccessKey}&orientation=landscape`;
    const response = await fetch(unsplashUrl);
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Unsplash data received');
    
    if (data.urls && data.urls.regular) {
      weatherBackground.style.backgroundImage = `url(${data.urls.regular})`;
      console.log('Background image set successfully');
    } else {
      throw new Error('No image available from Unsplash');
    }
  } catch (error) {
    console.error('Error fetching background:', error);
    setWeatherBasedGradient(condition);
  }
}

function setWeatherBasedGradient(condition) {
  console.log('Setting weather-based gradient');
  let gradient = 'linear-gradient(135deg, #4361ee, #3a0ca3)'; // default
  
  if (condition.includes('rain')) {
    gradient = 'linear-gradient(135deg, #4b6cb7, #182848)';
  } else if (condition.includes('sun') || condition.includes('clear')) {
    gradient = 'linear-gradient(135deg, #f46b45, #eea849)';
  } else if (condition.includes('cloud')) {
    gradient = 'linear-gradient(135deg, #757f9a, #d7dde8)';
  } else if (condition.includes('snow')) {
    gradient = 'linear-gradient(135deg, #e6dada, #274046)';
  } else if (condition.includes('storm')) {
    gradient = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
  } else if (condition.includes('fog') || condition.includes('mist')) {
    gradient = 'linear-gradient(135deg, #606c88, #3f4c6b)';
  }
  
  weatherBackground.style.backgroundImage = gradient;
}

// Update current weather display
function updateCurrentWeather(data) {
  console.log('Updating current weather display');
  const { current, location, forecast } = data;
  
  document.getElementById('cityName').textContent = `${location.name}, ${location.country}`;
  document.getElementById('description').textContent = current.condition.text;
  document.getElementById('weatherIcon').src = 'https:' + current.condition.icon;
  document.getElementById('temperature').textContent = `${Math.round(current.temp_c)}°`;
  document.getElementById('humidity').textContent = `${current.humidity}%`;
  document.getElementById('wind').textContent = `${current.wind_kph} km/h`;
  
  // Use today's total precipitation instead of current precipitation
  const todaysPrecip = forecast.forecastday[0].day.totalprecip_mm;
  document.getElementById('precip').textContent = `${Math.max(todaysPrecip, current.precip_mm)} mm`;
  
  document.getElementById('feelsLike').textContent = `${Math.round(current.feelslike_c)}°`;
}

// Update forecast display
function updateForecast(forecastDays) {
  console.log('Updating forecast display');
  const forecastContainer = document.getElementById('forecastContainer');
  forecastContainer.innerHTML = `
    <div class="forecast-title">
      <i class="fas fa-calendar-alt"></i> 3-Day Forecast
    </div>
    <div class="forecast-items"></div>
  `;
  
  const forecastItems = forecastContainer.querySelector('.forecast-items');
  
  forecastDays.forEach(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const maxTemp = Math.round(day.day.maxtemp_c);
    const minTemp = Math.round(day.day.mintemp_c);
    
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <img class="forecast-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
      <div class="forecast-temp">
        <span class="forecast-temp-max">${maxTemp}°</span>
        <span class="forecast-temp-min">${minTemp}°</span>
      </div>
    `;
    
    forecastItems.appendChild(forecastItem);
  });
}

// Show loading state
function showLoading(isLoading) {
  console.log(isLoading ? 'Showing loading state' : 'Hiding loading state');
  const card = document.querySelector('.card');
  if (isLoading) {
    card.classList.add('loading');
  } else {
    card.classList.remove('loading');
  }
}

// Show alert message
function showAlert(message) {
  console.log('Showing alert:', message);
  const alert = document.createElement('div');
  alert.className = 'alert-message';
  alert.textContent = message;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// Get weather data by city name
async function getWeather() {
  const city = cityInput.value.trim();
  if (!city) {
    showAlert('Please enter a city name');
    return;
  }

  console.log(`Fetching weather for city: ${city}`);
  showLoading(true);
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3`;

  try {
    const response = await fetch(url);
    console.log('Weather API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);
    
    updateCurrentWeather(data);
    updateForecast(data.forecast.forecastday);
    updateWeatherBackground(data.current.condition.text, data.location.name);
    
  } catch (error) {
    console.error('Error fetching weather:', error);
    showAlert('Error: City not found. Please try another location.');
    setDefaultState();
  } finally {
    showLoading(false);
  }
}

// Update current date and time
function updateDateTime() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  currentDateTime.textContent = now.toLocaleDateString('en-US', options);
}