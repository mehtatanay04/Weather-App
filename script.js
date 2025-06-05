// API Key for WeatherAPI.com (you should replace this with your own key)
const API_KEY = 'e73023adc2f24712bb444845252305'; // Replace with your actual key

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const searchModal = document.getElementById('searchModal');
const closeSearch = document.getElementById('closeSearch');
const searchInput = document.getElementById('searchInput');
const searchSubmit = document.getElementById('searchSubmit');
const searchResults = document.getElementById('searchResults');

// Weather display elements
const cityElement = document.getElementById('city');
const dateElement = document.getElementById('date');
const weatherIcon = document.getElementById('weatherIcon');
const temperatureElement = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const highTempElement = document.getElementById('highTemp');
const lowTempElement = document.getElementById('lowTemp');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
const body = document.body;

// Current location
let currentLocation = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    searchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        searchInput.focus();
    });
    
    closeSearch.addEventListener('click', () => {
        searchModal.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    });
    
    searchSubmit.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                currentLocation = `${latitude},${longitude}`;
                fetchWeatherData(currentLocation);
            },
            error => {
                console.error("Error getting location:", error);
                // Default to New York if location access is denied
                currentLocation = "New York";
                fetchWeatherData(currentLocation);
            }
        );
    } else {
        // Geolocation not supported
        currentLocation = "New York";
        fetchWeatherData(currentLocation);
    }
});

// Handle location search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    try {
        showLoading();
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`);
        const data = await response.json();
        
        searchResults.innerHTML = '';
        
        if (data.length === 0) {
            searchResults.innerHTML = '<p>No locations found. Try a different search.</p>';
            return;
        }
        
        data.forEach(location => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item content-loaded';
            resultItem.innerHTML = `
                <h4>${location.name}, ${location.region || ''}</h4>
                <p>${location.country}</p>
            `;
            resultItem.addEventListener('click', () => {
                currentLocation = `${location.lat},${location.lon}`;
                fetchWeatherData(currentLocation);
                searchModal.classList.remove('active');
                searchInput.value = '';
                searchResults.innerHTML = '';
            });
            searchResults.appendChild(resultItem);
        });
    } catch (error) {
        console.error("Search error:", error);
        searchResults.innerHTML = '<p>Error searching for locations. Please try again.</p>';
    } finally {
        hideLoading();
    }
}

// Show loading state
function showLoading() {
    body.classList.add('loading');
}

// Hide loading state
function hideLoading() {
    body.classList.remove('loading');
}

// Fetch weather data from WeatherAPI
async function fetchWeatherData(location) {
    try {
        showLoading();
        
        // Fetch current weather and forecast
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=7&aqi=no&alerts=no`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        updateCurrentWeather(data);
        updateHourlyForecast(data);
        updateDailyForecast(data);
        updateBackground(data.current.condition.text, data.current.is_day);
        
        // Add fade-in animation to all content
        document.querySelectorAll('#city, #date, #weatherIcon, #temperature, #weatherDescription, .high-low span, .detail-card, .hourly-card, .daily-card')
            .forEach(el => {
                el.classList.add('content-loaded');
            });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert(`Error fetching weather data: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    const { location, current } = data;
    
    // Remove skeleton classes
    cityElement.classList.remove('skeleton');
    dateElement.classList.remove('skeleton');
    weatherIcon.classList.remove('skeleton');
    temperatureElement.classList.remove('skeleton');
    weatherDescription.classList.remove('skeleton');
    highTempElement.classList.remove('skeleton');
    lowTempElement.classList.remove('skeleton');
    
    // Update location and date
    cityElement.textContent = `${location.name}, ${location.country || location.region || ''}`;
    dateElement.textContent = new Date(location.localtime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
    
    // Update current weather
    temperatureElement.textContent = Math.round(current.temp_f);
    weatherDescription.textContent = current.condition.text;
    highTempElement.textContent = `H:${Math.round(data.forecast.forecastday[0].day.maxtemp_f)}°`;
    lowTempElement.textContent = `L:${Math.round(data.forecast.forecastday[0].day.mintemp_f)}°`;
    
    // Update weather icon
    const iconClass = getWeatherIconClass(current.condition.code, current.is_day);
    weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    // Update weather details
    document.querySelectorAll('.detail-card').forEach(card => {
        card.classList.remove('skeleton');
        card.innerHTML = ''; // Clear skeleton content
    });
    
    const details = [
        { icon: 'fa-temperature-low', value: `${Math.round(current.feelslike_f)}°`, label: 'Feels Like' },
        { icon: 'fa-tint', value: `${current.humidity}%`, label: 'Humidity' },
        { icon: 'fa-wind', value: `${current.wind_mph} mph ${current.wind_dir}`, label: 'Wind' }
    ];
    
    document.querySelectorAll('.detail-card').forEach((card, index) => {
        const detail = details[index];
        card.innerHTML = `
            <i class="fas ${detail.icon}"></i>
            <div class="value">${detail.value}</div>
            <div class="label">${detail.label}</div>
        `;
    });
}

// Update hourly forecast
function updateHourlyForecast(data) {
    const hourlyData = data.forecast.forecastday[0].hour;
    const now = new Date();
    const currentHour = now.getHours();
    
    hourlyForecast.innerHTML = '';
    
    // Show next 12 hours of forecast
    for (let i = 0; i < 12; i++) {
        const hourIndex = (currentHour + i) % 24;
        const hour = hourlyData[hourIndex];
        
        const hourCard = document.createElement('div');
        hourCard.className = 'hourly-card content-loaded';
        
        // Format time (e.g., "3 PM")
        const time = new Date(hour.time);
        const timeString = time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        }).replace(':00', '');
        
        const iconClass = getWeatherIconClass(hour.condition.code, hour.is_day);
        
        hourCard.innerHTML = `
            <div class="time">${i === 0 ? 'Now' : timeString}</div>
            <div class="hourly-icon"><i class="fas ${iconClass}"></i></div>
            <div class="hourly-temp">${Math.round(hour.temp_f)}°</div>
        `;
        
        hourlyForecast.appendChild(hourCard);
    }
}

// Update daily forecast
function updateDailyForecast(data) {
    const forecastDays = data.forecast.forecastday;
    
    dailyForecast.innerHTML = '';
    
    forecastDays.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const iconClass = getWeatherIconClass(day.day.condition.code, 1); // Always use day icons for daily forecast
        
        const dayCard = document.createElement('div');
        dayCard.className = 'daily-card content-loaded';
        dayCard.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="daily-icon"><i class="fas ${iconClass}"></i></div>
            <div class="temps">
                <div class="high">${Math.round(day.day.maxtemp_f)}°</div>
                <div class="low">${Math.round(day.day.mintemp_f)}°</div>
            </div>
        `;
        
        dailyForecast.appendChild(dayCard);
    });
}

// Update background based on weather and time of day
function updateBackground(conditionText, isDay) {
    const condition = conditionText.toLowerCase();
    
    if (!isDay) {
        body.style.background = 'var(--night-gradient)';
    } else if (condition.includes('sunny') || condition.includes('clear')) {
        body.style.background = 'var(--day-gradient)';
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm')) {
        body.style.background = 'var(--rain-gradient)';
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
        body.style.background = 'var(--cloud-gradient)';
    } else {
        body.style.background = 'var(--day-gradient)';
    }
}

// Map WeatherAPI condition codes to Font Awesome icons
function getWeatherIconClass(conditionCode, isDay) {
    // Day icons
    const dayIcons = {
        1000: 'fa-sun', // Sunny
        1003: 'fa-cloud-sun', // Partly cloudy
        1006: 'fa-cloud', // Cloudy
        1009: 'fa-cloud', // Overcast
        1030: 'fa-smog', // Mist
        1063: 'fa-cloud-rain', // Patchy rain possible
        1066: 'fa-snowflake', // Patchy snow possible
        1069: 'fa-cloud-meatball', // Patchy sleet possible
        1072: 'fa-cloud-rain', // Patchy freezing drizzle possible
        1087: 'fa-bolt', // Thundery outbreaks possible
        1114: 'fa-wind', // Blowing snow
        1117: 'fa-wind', // Blizzard
        1135: 'fa-smog', // Fog
        1147: 'fa-smog', // Freezing fog
        1150: 'fa-cloud-rain', // Patchy light drizzle
        1153: 'fa-cloud-rain', // Light drizzle
        1168: 'fa-cloud-rain', // Freezing drizzle
        1171: 'fa-cloud-rain', // Heavy freezing drizzle
        1180: 'fa-cloud-rain', // Patchy light rain
        1183: 'fa-cloud-rain', // Light rain
        1186: 'fa-cloud-rain', // Moderate rain at times
        1189: 'fa-cloud-rain', // Moderate rain
        1192: 'fa-cloud-showers-heavy', // Heavy rain at times
        1195: 'fa-cloud-showers-heavy', // Heavy rain
        1198: 'fa-temperature-low', // Light freezing rain
        1201: 'fa-temperature-low', // Moderate or heavy freezing rain
        1204: 'fa-cloud-meatball', // Light sleet
        1207: 'fa-cloud-meatball', // Moderate or heavy sleet
        1210: 'fa-snowflake', // Patchy light snow
        1213: 'fa-snowflake', // Light snow
        1216: 'fa-snowflake', // Patchy moderate snow
        1219: 'fa-snowflake', // Moderate snow
        1222: 'fa-snowflake', // Patchy heavy snow
        1225: 'fa-snowflake', // Heavy snow
        1237: 'fa-icicles', // Ice pellets
        1240: 'fa-cloud-showers-heavy', // Light rain shower
        1243: 'fa-cloud-showers-heavy', // Moderate or heavy rain shower
        1246: 'fa-cloud-showers-heavy', // Torrential rain shower
        1249: 'fa-cloud-meatball', // Light sleet showers
        1252: 'fa-cloud-meatball', // Moderate or heavy sleet showers
        1255: 'fa-snowflake', // Light snow showers
        1258: 'fa-snowflake', // Moderate or heavy snow showers
        1261: 'fa-icicles', // Light showers of ice pellets
        1264: 'fa-icicles', // Moderate or heavy showers of ice pellets
        1273: 'fa-bolt', // Patchy light rain with thunder
        1276: 'fa-bolt', // Moderate or heavy rain with thunder
        1279: 'fa-bolt', // Patchy light snow with thunder
        1282: 'fa-bolt', // Moderate or heavy snow with thunder
    };
    
    // Night icons (override some day icons for night)
    const nightIcons = {
        1000: 'fa-moon', // Clear
        1003: 'fa-cloud-moon', // Partly cloudy
    };
    
    const iconMap = isDay ? dayIcons : { ...dayIcons, ...nightIcons };
    return iconMap[conditionCode] || 'fa-cloud';
}