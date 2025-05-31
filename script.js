// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentDateTime = document.getElementById('currentDateTime');
const weatherBackground = document.getElementById('weatherBackground');

// Weather API
const apiKey = 'e73023adc2f24712bb444845252305'; // Replace with your WeatherAPI key
const unsplashAccessKey = 'cFMxysi6jHLdvjsbZxSgZwXlJ5iS2cD8HtLPkdNcRfU'; // Your Unsplash access key

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
  
  // Set default background
  weatherBackground.style.backgroundImage = 'linear-gradient(135deg, #4361ee, #3a0ca3)';
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
  
  // Use Unsplash API for real backgrounds
  try {
    const unsplashUrl = `https://api.unsplash.com/photos/random?query=${query}&client_id=${unsplashAccessKey}&orientation=landscape`;
    const response = await fetch(unsplashUrl);
    const data = await response.json();
    weatherBackground.style.backgroundImage = `url(${data.urls.regular})`;
  } catch (error) {
    console.error('Error fetching background:', error);
    // Fallback to default gradient
    weatherBackground.style.backgroundImage = 'linear-gradient(135deg, #4361ee, #3a0ca3)';
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

// Update forecast display
function updateForecast(forecastDays) {
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
    updateWeatherBackground(data.current.condition.text, data.location.name);
    
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

// Event listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') getWeather();
});