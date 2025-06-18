const apiKey = 'ТВОЙ_API_КЛЮЧ_ОТ_OPENWEATHERMAP';

const weatherDiv = document.getElementById('weather');
const forecastDiv = document.getElementById('forecast');
const cityInput = document.getElementById('cityInput');

function createWeatherHTML(data) {
  return `
    <div class="weather-main">${data.name}, ${data.sys.country}</div>
    <img class="icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="${data.weather[0].description}" />
    <div class="weather-desc">${data.weather[0].description}</div>
    <div class="temp">${Math.round(data.main.temp)} °C</div>
    <div>Ветер: ${data.wind.speed} м/с</div>
    <div>Влажность: ${data.main.humidity}%</div>
  `;
}

function createForecastHTML(daily) {
  return daily.slice(1, 4).map(day => {
    const date = new Date(day.dt * 1000);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const dayName = date.toLocaleDateString('ru-RU', options);

    return `
      <div class="forecast-day">
        <h4>${dayName}</h4>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" width="50" height="50"/>
        <div>${day.weather[0].description}</div>
        <div>Днём: ${Math.round(day.temp.day)} °C</div>
        <div>Ночью: ${Math.round(day.temp.night)} °C</div>
      </div>
    `;
  }).join('');
}

async function getWeatherByCoords(lat, lon) {
  try {
    const weatherResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ru`);
    const weatherData = await weatherResp.json();

    const forecastResp = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${apiKey}&units=metric&lang=ru`);
    const forecastData = await forecastResp.json();

    weatherDiv.innerHTML = createWeatherHTML(weatherData);
    forecastDiv.innerHTML = createForecastHTML(forecastData.daily);
  } catch (err) {
    alert('Ошибка при получении данных погоды');
    console.error(err);
  }
}

async function getWeatherByCity(city) {
  try {
    const weatherResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`);
    const weatherData = await weatherResp.json();

    if (weatherData.cod !== 200) {
      alert('Город не найден');
      return;
    }

    const { coord } = weatherData;
    const forecastResp = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=current,minutely,hourly,alerts&appid=${apiKey}&units=metric&lang=ru`);
    const forecastData = await forecastResp.json();

    weatherDiv.innerHTML = createWeatherHTML(weatherData);
    forecastDiv.innerHTML = createForecastHTML(forecastData.daily);
  } catch (err) {
    alert('Ошибка при получении данных погоды');
    console.error(err);
  }
}

document.getElementById('searchBtn').addEventListener('click', () => {
  const city = cityInput.value.trim();
  if(city) {
    getWeatherByCity(city);
  } else {
    alert('Введите название города');
  }
});

document.getElementById('geoBtn').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      getWeatherByCoords(position.coords.latitude, position.coords.longitude);
    }, () => {
      alert('Разрешение на геолокацию отклонено');
    });
  } else {
    alert('Геолокация не поддерживается вашим браузером');
  }
});