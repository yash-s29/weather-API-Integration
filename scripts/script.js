const cityInput = document.getElementById("searchCity");
const themeToggleBtn = document.getElementById("toggleThemeBtn");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}

const backgroundsList = [
  "day1.jpg", "day2.jpg", "day3.jpg",
  "cloudy1.jpg", "cloudy2.jpg"
];

function setRandomBackground() {
  const randomBg = backgroundsList[Math.floor(Math.random() * backgroundsList.length)];
  fadeInBackground(`media/${randomBg}`);
}
setRandomBackground();

cityInput.addEventListener("keyup", async (event) => {
  if (event.key !== "Enter") return;
  const city = cityInput.value.trim();
  if (!city) return showError("Please enter a city name...");

  showLoader();

  const apiKey = "b1fd6e14799699504191b6bdbcadfc35";
  const unit = "metric";
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`;

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    if (weatherData.cod === 200) {
      updateWeatherUI(weatherData);
      updateForecastUI(forecastData);
      updateBackgroundByWeather(weatherData.weather[0].main, weatherData.sys.sunrise, weatherData.sys.sunset);
    } else {
      showError("City Not Found");
    }
  } catch (error) {
    console.error("API Error:", error);
    showError("Unable to fetch weather data.");
  }
});

function updateBackgroundByWeather(weatherType, sunrise, sunset) {
  const now = Math.floor(Date.now() / 1000);
  const isDay = now >= sunrise && now <= sunset;
  const type = weatherType.toLowerCase();
  let imageName = "fallback.jpg";

  if (type.includes("rain") || type.includes("storm")) {
    imageName = isDay ? "rainy_day.gif" : "rainy_night.gif";
  } else if (type.includes("cloud")) {
    imageName = isDay ? "cloudy_day.gif" : "cloudy_night.gif";
  } else if (type.includes("clear") || type.includes("sun")) {
    imageName = isDay ? "sunny_day.gif" : "clear_night.gif";
  }

  fadeInBackground(`media/${imageName}`);
}

function fadeInBackground(imageUrl) {
  const overlay = document.createElement("div");
  overlay.classList.add("bg-overlay");
  overlay.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}')`;

  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
  });

  const allOverlays = document.querySelectorAll(".bg-overlay");
  if (allOverlays.length > 1) {
    setTimeout(() => {
      allOverlays[0].remove(); // remove the old one
    }, 1200);
  }
}

function showLoader() {
  ["locationName", "temperatureValue", "weatherType"].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<img src="icons/loader.gif" alt="Loading..." style="height: 30px;">`;
  });
}

function showError(msg) {
  document.getElementById("locationName").textContent = msg;
  document.getElementById("temperatureValue").textContent = "";
  document.getElementById("weatherType").textContent = "";
}

function updateWeatherUI(data) {
  const { name, main, weather, wind, visibility, sys } = data;

  document.getElementById("locationName").textContent = name;
  document.getElementById("temperatureValue").innerHTML = `${Math.round(main.temp)}<sup>°C</sup>`;
  document.getElementById("weatherType").textContent = weather[0].description;

  document.getElementById("realFeelAdditionalValue").innerHTML = `${Math.round(main.feels_like)}<sup>°C</sup>`;
  document.getElementById("windSpeedAdditionalValue").textContent = `${wind.speed} km/h`;
  document.getElementById("windDirectionAdditionalValue").textContent = `${wind.deg}°`;
  document.getElementById("visibilityAdditionalValue").textContent = `${(visibility / 1000).toFixed(1)} km`;
  document.getElementById("pressureAdditionalValue").textContent = `${main.pressure} hPa`;
  document.getElementById("maxTemperatureAdditionalValue").innerHTML = `${Math.round(main.temp_max)}<sup>°C</sup>`;
  document.getElementById("minTemperatureAdditionalValue").innerHTML = `${Math.round(main.temp_min)}<sup>°C</sup>`;
  document.getElementById("humidityAdditionalValue").textContent = `${main.humidity}%`;
  document.getElementById("sunriseAdditionalValue").textContent = formatTime(sys.sunrise);
  document.getElementById("sunsetAdditionalValue").textContent = formatTime(sys.sunset);
}

function updateForecastUI(data) {
  const forecastContainer = document.getElementById("forecast-container");
  forecastContainer.innerHTML = "";

  const dailyForecasts = {};

  data.list.forEach(entry => {
    const dateTime = new Date(entry.dt * 1000);
    const date = dateTime.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });

    if (!dailyForecasts[date]) {
      dailyForecasts[date] = {
        date,
        icon: entry.weather[0].icon,
        maxTemp: -Infinity,
        minTemp: Infinity,
        weatherType: entry.weather[0].description
      };
    }

    dailyForecasts[date].maxTemp = Math.max(dailyForecasts[date].maxTemp, entry.main.temp_max);
    dailyForecasts[date].minTemp = Math.min(dailyForecasts[date].minTemp, entry.main.temp_min);
  });

  Object.values(dailyForecasts).forEach(day => {
    const forecastCard = document.createElement("div");
    forecastCard.classList.add("daily-forecast-card");
    forecastCard.innerHTML = `
      <p class="daily-forecast-date">${day.date}</p>
      <div class="daily-forecast-logo">
        <img class="animated-weather-icon" src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.weatherType}">
      </div>
      <div class="max-min-temperature-daily-forecast">
        <span class="max-daily-forecast">${Math.round(day.maxTemp)}<sup>°C</sup></span>
        <span class="min-daily-forecast">${Math.round(day.minTemp)}<sup>°C</sup></span>
      </div>
      <p class="weather-type-daily-forecast">${day.weatherType}</p>
    `;
    forecastContainer.appendChild(forecastCard);
  });

  const forecastLabel = document.querySelector(".daily-forecast-label");
  if (forecastLabel) {
    forecastLabel.style.fontSize = "36px";
    forecastLabel.style.textTransform = "uppercase";
    forecastLabel.style.letterSpacing = "1px";
    forecastLabel.style.fontWeight = "700";
    forecastLabel.style.textAlign = "center";
  }
}

function formatTime(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
