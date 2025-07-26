const cityInputMobile = document.getElementById("mobileSearchCity");

cityInputMobile.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    const city = cityInputMobile.value.trim();
    if (!city) {
      document.getElementById("locationName").innerHTML = "Enter a city name...";
      return;
    }

    showLoaders();

    const apiKey = "b1fd6e14799699504191b6bdbcadfc35";
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    fetch(weatherUrl)
      .then(res => res.json())
      .then(data => {
        if (data.cod !== 200) {
          showError("City Not Found");
          return;
        }

        const {
          name: location,
          main: { temp, feels_like, pressure, humidity, temp_max, temp_min },
          weather,
          wind: { speed, deg },
          visibility,
          sys: { sunrise, sunset }
        } = data;

        document.getElementById("locationName").innerHTML = location;
        document.getElementById("temperatureValue").innerHTML = `${Math.round(temp)}<sup>°C</sup>`;
        document.getElementById("weatherType").innerHTML = capitalize(weather[0].description);
        document.getElementById("realFeelAdditionalValue").innerHTML = `${Math.round(feels_like)}<sup>°C</sup>`;
        document.getElementById("windSpeedAdditionalValue").innerHTML = `${speed} km/h`;
        document.getElementById("windDirectionAdditionalValue").innerHTML = `${deg}°`;
        document.getElementById("visibilityAdditionalValue").innerHTML = `${visibility / 1000} km`;
        document.getElementById("pressureAdditionalValue").innerHTML = `${pressure} hPa`;
        document.getElementById("maxTemperatureAdditionalValue").innerHTML = `${Math.round(temp_max)}<sup>°C</sup>`;
        document.getElementById("minTemperatureAdditionalValue").innerHTML = `${Math.round(temp_min)}<sup>°C</sup>`;
        document.getElementById("humidityAdditionalValue").innerHTML = `${humidity}%`;
        document.getElementById("sunriseAdditionalValue").innerHTML = formatTime(sunrise);
        document.getElementById("sunsetAdditionalValue").innerHTML = formatTime(sunset);

        loadForecast(forecastUrl);
      })
      .catch(() => showError("Error fetching weather data"));
  }
});

function showLoaders() {
  const elements = ["locationName", "temperatureValue", "weatherType"];
  elements.forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = `<img src="icons/loader.gif" alt="Loading..." style="width:24px;">`;
  });
}

function showError(message) {
  document.getElementById("locationName").innerHTML = message;
  document.getElementById("temperatureValue").innerHTML = "";
  document.getElementById("weatherType").innerHTML = "";
  document.getElementById("forecast-container").innerHTML = "";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function loadForecast(forecastUrl) {
  fetch(forecastUrl)
    .then(res => res.json())
    .then(data => {
      const forecastContainer = document.getElementById("forecast-container");
      forecastContainer.innerHTML = "";

      const dailyData = {};

      data.list.forEach(entry => {
        const date = new Date(entry.dt * 1000).toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        });

        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            icon: entry.weather[0].icon,
            maxTemp: entry.main.temp_max,
            minTemp: entry.main.temp_min,
            weatherType: entry.weather[0].main
          };
        } else {
          dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, entry.main.temp_max);
          dailyData[date].minTemp = Math.min(dailyData[date].minTemp, entry.main.temp_min);
        }
      });

      Object.values(dailyData).forEach(day => {
        const card = document.createElement("div");
        card.classList.add("daily-forecast-card");

        card.innerHTML = `
          <p class="daily-forecast-date">${day.date}</p>
          <div class="daily-forecast-logo">
            <img class="imgs-as-icons" src="https://openweathermap.org/img/w/${day.icon}.png" alt="icon">
          </div>
          <div class="max-min-temperature-daily-forecast">
            <span class="max-daily-forecast">${Math.round(day.maxTemp)}<sup>°C</sup></span>
            <span class="min-daily-forecast">${Math.round(day.minTemp)}<sup>°C</sup></span>
          </div>
          <p class="weather-type-daily-forecast">${day.weatherType}</p>
        `;

        forecastContainer.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Forecast fetch error:", err);
      document.getElementById("forecast-container").innerHTML = "Forecast unavailable.";
    });
}
