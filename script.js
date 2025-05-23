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

  } catch (err) {
    alert("Error: " + err.message);
  }
}
