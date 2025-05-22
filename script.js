async function getWeather() {
  const city = document.getElementById("cityInput").value;
  const apiKey = "95c62b7117a5626c694d8b5782f2b9ad"; 

  if (!city) {
    alert("Please enter a city name.");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();

    document.getElementById("cityName").textContent = data.name;
    document.getElementById("description").textContent = data.weather[0].description;
    document.getElementById("temperature").textContent = `${data.main.temp} °C`;
    document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  } catch (error) {
    alert("Error: " + error.message);
  }
}
