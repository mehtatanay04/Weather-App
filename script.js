async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const apiKey = "e73023adc2f24712bb444845252305"; // Replace with your WeatherAPI key

  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("City not found");
    const data = await res.json();

    document.getElementById("cityName").textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById("description").textContent = data.current.condition.text;
    document.getElementById("weatherIcon").src = "https:" + data.current.condition.icon;
    document.getElementById("temperature").textContent = `${data.current.temp_c} °C`;
    document.getElementById("precip").textContent = `${data.current.precip_mm} mm`;
    document.getElementById("humidity").textContent = `${data.current.humidity} %`;
    document.getElementById("wind").textContent = `${data.current.wind_kph} km/h`;

    applyWeatherEffect(data.current.condition.text.toLowerCase());

  } catch (err) {
    alert("Error: " + err.message);
  }
}

function applyWeatherEffect(description) {
  const animContainer = document.getElementById("weatherAnimation");
  animContainer.className = "";
  animContainer.innerHTML = "";

  if (description.includes("rain")) {
    animContainer.classList.add("rain");
  } else if (description.includes("sun") || description.includes("clear")) {
    const sun = document.createElement("div");
    sun.className = "sun";
    animContainer.appendChild(sun);
  } else if (description.includes("snow")) {
    for (let i = 0; i < 25; i++) {
      const flake = document.createElement("div");
      flake.className = "snowflake";
      flake.textContent = "❄";
      flake.style.left = Math.random() * 100 + "vw";
      flake.style.animationDuration = 4 + Math.random() * 3 + "s";
      flake.style.fontSize = 14 + Math.random() * 8 + "px";
      animContainer.appendChild(flake);
    }
  }
}

// Add event listener for Enter key to trigger getWeather
document.getElementById("cityInput").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    getWeather();
  }
});

// Add event listener for search icon click to trigger getWeather
document.querySelector(".search-icon").addEventListener("click", getWeather);