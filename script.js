// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentDateTime = document.getElementById('currentDateTime');
const forecastContainer = document.getElementById('forecastContainer');
const weatherAnimation = document.getElementById('weatherAnimation');

// Weather API
const apiKey = 'e73023adc2f24712bb444845252305'; // Your WeatherAPI key

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Try to get user's location automatically
  getLocation();
});

// Try to get user's geolocation
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // If location access granted, get weather by coordinates
        const { latitude, longitude } = position.coords;
        getWeatherByCoords(latitude, longitude);
      },
      (error) => {
        // If location access denied, show default message
        console.log('Location access denied:', error);
        showAlert('Location access denied. Please search for a city manually.');
        setDefaultState();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0
      }
    );
  } else {
    console.log('Geolocation is not supported by this browser.');
    showAlert('Geolocation is not supported. Please search for a city manually.');
    setDefaultState();
  }
}

function setDefaultState() {
  document.getElementById('cityName').textContent = 'Search for a location';
  document.getElementById('description').textContent = '--';
  document.getElementById('temperature').textContent = '--°';
  document.getElementById('humidity').textContent = '--%';
  document.getElementById('wind').textContent = '-- km/h';
  document.getElementById('precip').textContent = '-- mm';
  document.getElementById('feelsLike').textContent = '--°';
  document.getElementById('weatherIcon').src = 'https://cdn.weatherapi.com/weather/64x64/day/116.png';
}

// Get weather by coordinates
async function getWeatherByCoords(lat, lon) {
  showLoading(true);
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Location not found');
    const data = await response.json();
    
    // Update input field with current city name
    cityInput.value = data.location.name;
    
    updateCurrentWeather(data);
    updateForecast(data.forecast.forecastday);
    applyWeatherEffect(data.current.condition.text.toLowerCase());
    
  } catch (error) {
    console.error('Error fetching weather:', error);
    showAlert('Error fetching weather data. Please try again.');
    setDefaultState();
  } finally {
    showLoading(false);
  }
}

// Update current weather display
function updateCurrentWeather(data) {
  const { current, location } = data;
  
  document.getElementById('cityName').textContent = `${location.name}, ${location.country}`;
  document.getElementById('description').textContent = current.condition.text;
  document.getElementById('weatherIcon').src = 'https:' + current.condition.icon;
  document.getElementById('temperature').textContent = `${Math.round(current.temp_c)}°`;
  document.getElementById('humidity').textContent = `${current.humidity}%`;
  document.getElementById('wind').textContent = `${current.wind_kph} km/h`;
  document.getElementById('precip').textContent = `${current.precip_mm} mm`;
  document.getElementById('feelsLike').textContent = `${Math.round(current.feelslike_c)}°`;
}

// Show loading state
function showLoading(isLoading) {
  const card = document.querySelector('.card');
  if (isLoading) {
    card.classList.add('loading');
  } else {
    card.classList.remove('loading');
  }
}

// Show alert message
function showAlert(message) {
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

  showLoading(true);
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();
    
    updateCurrentWeather(data);
    updateForecast(data.forecast.forecastday);
    applyWeatherEffect(data.current.condition.text.toLowerCase());
    
  } catch (error) {
    console.error('Error fetching weather:', error);
    showAlert('Error: ' + error.message);
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

// Update forecast display
function updateForecast(forecastDays) {
  forecastContainer.innerHTML = '';
  
  forecastDays.forEach(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const maxTemp = Math.round(day.day.maxtemp_c);
    const minTemp = Math.round(day.day.mintemp_c);
    const iconUrl = 'https:' + day.day.condition.icon;
    
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <div class="forecast-day">${dayName}</div>
      <img src="${iconUrl}" alt="${day.day.condition.text}" class="forecast-icon" />
      <div class="forecast-temp">
        <span class="forecast-temp-max">${maxTemp}°</span>
        <span class="forecast-temp-min">${minTemp}°</span>
      </div>
    `;
    
    forecastContainer.appendChild(forecastItem);
  });
}

// Apply weather effects based on current conditions
function applyWeatherEffect(condition) {
  // Clear any existing effects
  weatherAnimation.innerHTML = '';
  weatherAnimation.className = 'weather-background';
  
  // Add appropriate effect based on condition
  if (condition.includes('sun') || condition.includes('clear')) {
    weatherAnimation.classList.add('sunny');
    const sun = document.createElement('div');
    sun.className = 'sun';
    weatherAnimation.appendChild(sun);
  } else if (condition.includes('rain') || condition.includes('drizzle')) {
    weatherAnimation.classList.add('rain');
    weatherAnimation.innerHTML = '<div class="rain-effect"></div>';
    createRaindrops();
  } else if (condition.includes('snow') || condition.includes('sleet')) {
    weatherAnimation.classList.add('snow');
    createSnowflakes();
  } else if (condition.includes('cloud') || condition.includes('overcast')) {
    weatherAnimation.classList.add('cloudy');
  }
}

// Create raindrops effect
function createRaindrops() {
  const rainContainer = document.createElement('div');
  rainContainer.className = 'rain-container';
  
  for (let i = 0; i < 50; i++) {
    const raindrop = document.createElement('div');
    raindrop.className = 'raindrop';
    raindrop.style.left = `${Math.random() * 100}%`;
    raindrop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
    raindrop.style.animationDelay = `${Math.random() * 0.5}s`;
    rainContainer.appendChild(raindrop);
  }
  
  weatherAnimation.appendChild(rainContainer);
}

// Create snowflakes effect
function createSnowflakes() {
  for (let i = 0; i < 50; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.innerHTML = '❄';
    snowflake.style.left = `${Math.random() * 100}%`;
    snowflake.style.animationDuration = `${5 + Math.random() * 10}s`;
    snowflake.style.animationDelay = `${Math.random() * 5}s`;
    snowflake.style.opacity = Math.random();
    snowflake.style.fontSize = `${10 + Math.random() * 10}px`;
    weatherAnimation.appendChild(snowflake);
  }
}

// Event listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') getWeather();
});