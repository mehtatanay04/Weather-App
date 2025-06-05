# WeatherSphere 🌤️  
Modern weather forecasting at your fingertips  

WeatherSphere is a sleek, responsive web application that delivers real-time weather updates using the WeatherAPI. It provides current conditions, hourly forecasts, and a 7-day outlook, all displayed in Celsius. With dynamic backgrounds, skeleton loading states, and smooth animations, WeatherSphere offers an engaging user experience.

## ✨ Features  

- **Current Weather**: View temperature, condition, high/low, feels-like, humidity, and wind speed.  
- **Hourly Forecast**: 12-hour forecast with temperature and weather icons.  
- **Daily Forecast**: 7-day forecast with high/low temperatures.  
- **Location Search**: Search cities with WeatherAPI's autocomplete.  
- **Geolocation**: Auto-detects user location (with permission).  
- **Responsive Design**: Optimized for desktop, tablet, and mobile.  
- **Dynamic Backgrounds**: Gradients change based on weather and day/night.  
- **Skeleton Loading**: Smooth placeholders during data fetch.  
- **Fade-in Animations**: Content loads with elegant transitions.  

## 🛠️ Technologies  

| Technology       | Purpose                     | Source                          |
|------------------|-----------------------------|---------------------------------|
| HTML5            | Structure                   |                                 |
| CSS3             | Styling & Animations        |                                 |
| JavaScript       | Logic & API Integration     |                                 |
| WeatherAPI       | Weather Data                | [WeatherAPI](https://www.weatherapi.com/) |
| Font Awesome     | Icons                       | [Font Awesome](https://fontawesome.com/) |
| Google Fonts     | Poppins Font                | [Google Fonts](https://fonts.google.com/) |

## 🚀 Setup  

### 📂 Project Files  
Ensure these files are present:  
- `index.html` - Application structure  
- `styles.css` - Styling and animations  
- `script.js` - JavaScript logic  
- `README.md` - This documentation  

### 🔑 Get a WeatherAPI Key  
1. Sign up at [WeatherAPI](https://www.weatherapi.com/)  
2. Replace the placeholder in `script.js`:  
   ```javascript
   const API_KEY = 'your_actual_api_key_here';
