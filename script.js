const API_KEY = 'e73023adc2f24712bb444845252305'; // Replace with your actual key

// DOM Elements
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const themeBtn = document.getElementById('themeBtn');
const unitToggle = document.getElementById('unitToggle');
const searchModal = document.getElementById('searchModal');
const closeSearch = document.getElementById('closeSearch');
const searchInput = document.getElementById('searchInput');
const searchSubmit = document.getElementById('searchSubmit');
const searchResults = document.getElementById('searchResults');
const favoriteList = document.getElementById('favoriteList');
const recentList = document.getElementById('recentList');
const cityElement = document.getElementById('city');
const dateElement = document.getElementById('date');
const weatherIcon = document.getElementById('weatherIcon');
const temperatureElement = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const highTempElement = document.getElementById('highTemp');
const lowTempElement = document.getElementById('lowTemp');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
const alertsSection = document.getElementById('alertsSection');
const alerts = document.getElementById('alerts');
const weatherMap = document.getElementById('weatherMap');
const body = document.body;
const loader = document.getElementById('loader');

// State
let currentLocation = null;
let isCelsius = true;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let cachedWeather = JSON.parse(localStorage.getItem('cachedWeather')) || null;

// Initialize map
let map = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    searchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        searchInput.focus();
        updateFavorites();
        updateRecentSearches();
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

    currentLocationBtn.addEventListener('click', handleCurrentLocation);
    unitToggle.addEventListener('change', () => {
        isCelsius = !unitToggle.checked;
        if (currentLocation) fetchWeatherData(currentLocation);
        else if (cachedWeather) {
            updateCurrentWeather(cachedWeather);
            updateHourlyForecast(cachedWeather);
            updateDailyForecast(cachedWeather);
        }
    });

    themeBtn.addEventListener('click', () => {
        body.classList.toggle('light');
        localStorage.setItem('theme', body.classList.contains('light') ? 'light' : 'dark');
        if (currentLocation) fetchWeatherData(currentLocation);
        else if (cachedWeather) updateBackground(cachedWeather.current.condition.text, cachedWeather.current.is_day);
    });

    // Set default to dark mode unless light mode is saved
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light');
    } else {
        body.classList.remove('light');
        localStorage.setItem('theme', 'dark');
    }

    // Load cached data if offline
    if (!navigator.onLine && cachedWeather) {
        updateCurrentWeather(cachedWeather);
        updateHourlyForecast(cachedWeather);
        updateDailyForecast(cachedWeather);
        updateAlerts(cachedWeather);
        updateMap(cachedWeather.location.lat, cachedWeather.location.lon);
        updateBackground(cachedWeather.current.condition.text, cachedWeather.current.is_day);
        hideLoading();
    } else {
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
                    currentLocation = "New York";
                    fetchWeatherData(currentLocation);
                }
            );
        } else {
            currentLocation = "New York";
            fetchWeatherData(currentLocation);
        }
    }
});

// Handle current location
async function handleCurrentLocation() {
    if (navigator.geolocation) {
        try {
            showLoading();
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            const { latitude, longitude } = position.coords;
            currentLocation = `${latitude},${longitude}`;
            await fetchWeatherData(currentLocation);
        } catch (error) {
            console.error("Error getting current location:", error);
            alert("Unable to get current location. Please ensure location services are enabled.");
        } finally {
            hideLoading();
        }
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

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
                <button class="save-btn" data-lat="${location.lat}" data-lon="${location.lon}" data-name="${location.name}">
                    <i class="fas ${favorites.some(f => f.lat === location.lat && f.lon === location.lon) ? 'fa-star' : 'fa-star-o'}"></i>
                </button>
            `;
            resultItem.querySelector('.save-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(location);
                updateFavorites();
            });
            resultItem.addEventListener('click', () => {
                currentLocation = `${location.lat},${location.lon}`;
                addRecentSearch(location);
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

// Manage favorites
function toggleFavorite(location) {
    const index = favorites.findIndex(f => f.lat === location.lat && f.lon === location.lon);
    if (index === -1) {
        favorites.push({ name: location.name, lat: location.lat, lon: location.lon });
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateFavorites() {
    favoriteList.innerHTML = '';
    favorites.forEach(location => {
        const item = document.createElement('div');
        item.className = 'favorite-item content-loaded';
        item.innerHTML = `
            <h4>${location.name}</h4>
            <button class="save-btn" data-lat="${location.lat}" data-lon="${location.lon}">
                <i class="fas fa-star"></i>
            </button>
        `;
        item.addEventListener('click', () => {
            currentLocation = `${location.lat},${location.lon}`;
            addRecentSearch(location);
            fetchWeatherData(currentLocation);
            searchModal.classList.remove('active');
        });
        item.querySelector('.save-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(location);
            updateFavorites();
        });
        favoriteList.appendChild(item);
    });
}

// Manage recent searches
function addRecentSearch(location) {
    const existing = recentSearches.findIndex(r => r.lat === location.lat && r.lon === location.lon);
    if (existing !== -1) {
        recentSearches.splice(existing, 1);
    }
    recentSearches.unshift({ name: location.name, lat: location.lat, lon: location.lon });
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    updateRecentSearches();
}

function updateRecentSearches() {
    recentList.innerHTML = '';
    recentSearches.forEach(location => {
        const item = document.createElement('div');
        item.className = 'recent-item content-loaded';
        item.innerHTML = `<h4>${location.name}</h4>`;
        item.addEventListener('click', () => {
            currentLocation = `${location.lat},${location.lon}`;
            addRecentSearch(location);
            fetchWeatherData(currentLocation);
            searchModal.classList.remove('active');
        });
        recentList.appendChild(item);
    });
}

// Show/hide loading
function showLoading() {
    body.classList.add('loading');
    loader.style.display = 'block';
}

function hideLoading() {
    body.classList.remove('loading');
    loader.style.display = 'none';
}

// Fetch weather data
async function fetchWeatherData(location) {
    try {
        showLoading();
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=7&aqi=yes&alerts=yes`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        cachedWeather = data;
        localStorage.setItem('cachedWeather', JSON.stringify(cachedWeather));
        
        updateCurrentWeather(data);
        updateHourlyForecast(data);
        updateDailyForecast(data);
        updateAlerts(data);
        updateMap(data.location.lat, data.location.lon);
        updateBackground(data.current.condition.text, data.current.is_day);
        
        document.querySelectorAll('#city, #date, #weatherIcon, #temperature, #weatherDescription, .high-low span, .detail-card, .hourly-card, .daily-card')
            .forEach(el => el.classList.add('content-loaded'));
    } catch (error) {
        console.error("Error fetching weather data:", error);
        alert(`Error fetching weather data: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Update current weather
function updateCurrentWeather(data) {
    const { location, current } = data;
    
    cityElement.classList.remove('skeleton');
    dateElement.classList.remove('skeleton');
    weatherIcon.classList.remove('skeleton');
    temperatureElement.classList.remove('skeleton');
    weatherDescription.classList.remove('skeleton');
    highTempElement.classList.remove('skeleton');
    lowTempElement.classList.remove('skeleton');
    
    cityElement.textContent = `${location.name}, ${location.country || location.region || ''}`;
    dateElement.textContent = new Date(location.localtime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
    
    temperatureElement.textContent = Math.round(isCelsius ? current.temp_c : current.temp_f);
    weatherDescription.textContent = current.condition.text;
    highTempElement.textContent = `H:${Math.round(isCelsius ? data.forecast.forecastday[0].day.maxtemp_c : data.forecast.forecastday[0].day.maxtemp_f)}°`;
    lowTempElement.textContent = `L:${Math.round(isCelsius ? data.forecast.forecastday[0].day.mintemp_c : data.forecast.forecastday[0].day.mintemp_f)}°`;
    
    const iconClass = getWeatherIconClass(current.condition.code, current.is_day);
    weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    weatherIcon.className = `weather-icon ${current.condition.text.toLowerCase().includes('rain') ? 'rain' : current.condition.text.toLowerCase().includes('cloud') ? 'cloudy' : ''}`;
    
    document.querySelectorAll('.detail-card').forEach(card => {
        card.classList.remove('skeleton');
        card.innerHTML = '';
    });
    
    const aqiValue = current.air_quality && current.air_quality['us-epa-index'] ? getAqiLabel(current.air_quality['us-epa-index']) : 'N/A';
    const aqiColor = current.air_quality && current.air_quality['us-epa-index'] ? getAqiColor(current.air_quality['us-epa-index']) : 'var(--skeleton-bg)';
    const details = [
        { icon: 'fa-temperature-low', value: `${Math.round(isCelsius ? current.feelslike_c : current.feelslike_f)}°`, label: 'Feels Like' },
        { icon: 'fa-tint', value: `${current.humidity}%`, label: 'Humidity' },
        { icon: 'fa-wind', value: `${current.wind_mph} mph ${current.wind_dir}`, label: 'Wind' },
        { icon: 'fa-leaf', value: aqiValue, label: 'AQI', style: `background: ${aqiColor}; padding: 2px 8px; border-radius: 5px;` }
    ];
    
    document.querySelectorAll('.detail-card').forEach((card, index) => {
        const detail = details[index];
        card.innerHTML = `
            <i class="fas ${detail.icon}"></i>
            <div class="value" style="${detail.style || ''}">${detail.value}</div>
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
    
    for (let i = 0; i < 12; i++) {
        const hourIndex = (currentHour + i) % 24;
        const hour = hourlyData[hourIndex];
        
        const hourCard = document.createElement('div');
        hourCard.className = 'hourly-card content-loaded';
        
        const time = new Date(hour.time);
        const timeString = time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        }).replace(':00', '');
        
        const iconClass = getWeatherIconClass(hour.condition.code, hour.is_day);
        
        hourCard.innerHTML = `
            <div class="time">${i === 0 ? 'Now' : timeString}</div>
            <div class="hourly-icon"><i class="fas ${iconClass}"></i></div>
            <div class="hourly-temp">${Math.round(isCelsius ? hour.temp_c : hour.temp_f)}°</div>
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
        
        const iconClass = getWeatherIconClass(day.day.condition.code, 1);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'daily-card content-loaded';
        dayCard.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="daily-icon"><i class="fas ${iconClass}"></i></div>
            <div class="temps">
                <div class="high">${Math.round(isCelsius ? day.day.maxtemp_c : day.day.maxtemp_f)}°</div>
                <div class="low">${Math.round(isCelsius ? day.day.mintemp_c : day.day.mintemp_f)}°</div>
            </div>
        `;
        
        dailyForecast.appendChild(dayCard);
    });
}

// Update alerts
function updateAlerts(data) {
    alerts.innerHTML = '';
    if (data.alerts && data.alerts.alert && data.alerts.alert.length > 0) {
        alertsSection.style.display = 'block';
        data.alerts.alert.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert content-loaded';
            alertDiv.innerHTML = `
                <h4>${alert.event}</h4>
                <p>${alert.desc}</p>
            `;
            alerts.appendChild(alertDiv);
        });
    } else {
        alertsSection.style.display = 'none';
    }
}

// Update map
function updateMap(lat, lon) {
    if (map) map.remove();
    map = L.map('weatherMap').setView([lat, lon], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.marker([lat, lon]).addTo(map);
}

// Update background
function updateBackground(conditionText, isDay) {
    const condition = conditionText ? conditionText.toLowerCase() : '';
    console.log('Updating background with condition:', condition, 'isDay:', isDay, 'Light mode:', body.classList.contains('light'));

    if (body.classList.contains('light')) {
        if (!isDay) {
            body.style.background = 'var(--night-light-gradient)';
        } else if (condition.includes('sunny') || condition.includes('clear')) {
            body.style.background = 'var(--day-light-gradient)';
        } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm')) {
            body.style.background = 'var(--rain-light-gradient)';
        } else if (condition.includes('cloud') || condition.includes('overcast')) {
            body.style.background = 'var(--cloud-light-gradient)';
        } else {
            console.warn('Unknown weather condition, defaulting to day-light-gradient');
            body.style.background = 'var(--day-light-gradient)';
        }
    } else {
        if (!isDay) {
            body.style.background = 'var(--night-dark-gradient)';
        } else if (condition.includes('sunny') || condition.includes('clear')) {
            body.style.background = 'var(--day-dark-gradient)';
        } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('storm')) {
            body.style.background = 'var(--rain-dark-gradient)';
        } else if (condition.includes('cloud') || condition.includes('overcast')) {
            body.style.background = 'var(--cloud-dark-gradient)';
        } else {
            console.warn('Unknown weather condition, defaulting to day-dark-gradient');
            body.style.background = 'var(--day-dark-gradient)';
        }
    }
}

// AQI label and color
function getAqiLabel(index) {
    switch (index) {
        case 1: return 'Good';
        case 2: return 'Moderate';
        case 3: return 'Unhealthy for Sensitive Groups';
        case 4: return 'Unhealthy';
        case 5: return 'Very Unhealthy';
        case 6: return 'Hazardous';
        default: return 'N/A';
    }
}

function getAqiColor(index) {
    switch (index) {
        case 1: return 'var(--aqi-good)';
        case 2: return 'var(--aqi-moderate)';
        case 3: return 'var(--aqi-unhealthy)';
        case 4: return 'var(--aqi-very-unhealthy)';
        case 5: case 6: return 'var(--aqi-hazardous)';
        default: return 'var(--skeleton-bg)';
    }
}

// Weather icon mapping
function getWeatherIconClass(conditionCode, isDay) {
    const dayIcons = {
        1000: 'fa-sun',
        1003: 'fa-cloud-sun',
        1006: 'fa-cloud',
        1009: 'fa-cloud',
        1030: 'fa-smog',
        1063: 'fa-cloud-rain',
        1066: 'fa-snowflake',
        1069: 'fa-cloud-meatball',
        1072: 'fa-cloud-rain',
        1087: 'fa-bolt',
        1114: 'fa-wind',
        1117: 'fa-wind',
        1135: 'fa-smog',
        1147: 'fa-smog',
        1150: 'fa-cloud-rain',
        1153: 'fa-cloud-rain',
        1168: 'fa-cloud-rain',
        1171: 'fa-cloud-rain',
        1180: 'fa-cloud-rain',
        1183: 'fa-cloud-rain',
        1186: 'fa-cloud-rain',
        1189: 'fa-cloud-rain',
        1192: 'fa-cloud-showers-heavy',
        1195: 'fa-cloud-showers-heavy',
        1198: 'fa-temperature-low',
        1201: 'fa-temperature-low',
        1204: 'fa-cloud-meatball',
        1207: 'fa-cloud-meatball',
        1210: 'fa-snowflake',
        1213: 'fa-snowflake',
        1216: 'fa-snowflake',
        1219: 'fa-snowflake',
        1222: 'fa-snowflake',
        1225: 'fa-snowflake',
        1237: 'fa-icicles',
        1240: 'fa-cloud-showers-heavy',
        1243: 'fa-cloud-showers-heavy',
        1246: 'fa-cloud-showers-heavy',
        1249: 'fa-cloud-meatball',
        1252: 'fa-cloud-meatball',
        1255: 'fa-snowflake',
        1258: 'fa-snowflake',
        1261: 'fa-icicles',
        1264: 'fa-icicles',
        1273: 'fa-bolt',
        1276: 'fa-bolt',
        1279: 'fa-bolt',
        1282: 'fa-bolt',
    };
    
    const nightIcons = {
        1000: 'fa-moon',
        1003: 'fa-cloud-moon',
    };
    
    const iconMap = isDay ? dayIcons : { ...dayIcons, ...nightIcons };
    return iconMap[conditionCode] || 'fa-cloud';
}