//OpenWeatherMap API key
const apiKey = '9927eb6bea1a887db713a445185b9295'; //OpenWeatherMap API key

// Grabbing DOM elements
const weatherContainer = document.getElementById('weatherContainer');
const forecastContainer = document.getElementById('forecastContainer');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const recentDropdown = document.getElementById('recentDropdown');
const recentCitiesContainer = document.getElementById('recentCities');

// Base URL for the weather API
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// Fetch current weather data by city name
async function getWeatherData(city) {
   // Select the <main> element
   const mainElement = document.querySelector('main');
 
   // Remove any existing error div if it exists
   const existingErrorDiv = mainElement.querySelector('.error-message');
   if (existingErrorDiv) {
     existingErrorDiv.remove();
   }
 
  try {
    // API call to get current weather
    const response = await fetch(`${API_BASE}/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();

    // If city not found or error, throw an error
    if (data.cod !== 200) throw new Error(data.message);
    renderCurrentWeather(data);  // Display current weather
    getForecastData(data.coord.lat, data.coord.lon); // Fetch and display forecast using lat & lon
    saveRecentCity(city); // Save searched city to recent list
  } catch (error) {
   // Clear weather and forecast containers
   weatherContainer.innerHTML = '';
   forecastContainer.innerHTML = '';
 
   // Create the error div and paragraph
   const errorDiv = document.createElement('div');
   errorDiv.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto mt-4';
 
   const errorParagraph = document.createElement('p');
   errorParagraph.className = 'font-bold';
   errorParagraph.textContent = error.message;
 
   // Append paragraph to div
   errorDiv.appendChild(errorParagraph);
 
   // Append the error div to <main>
   mainElement.appendChild(errorDiv);
  }
}

// Fetch 5-day forecast data using coordinates
async function getForecastData(lat, lon) {
  try {
    // API call for forecast
    const response = await fetch(`${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    renderForecast(data.list); // Display forecast
  } catch (error) {
    // Error handling
    forecastContainer.innerHTML = `<p class='text-red-500'>Failed to load forecast</p>`;
  }
}

// Display current weather on the page
function renderCurrentWeather(data) {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const formattedDate = now.toLocaleDateString(undefined, options);
  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  weatherContainer.innerHTML = `
    <div class="text-center space-y-2 bg-white bg-opacity-70 rounded-lg p-7.5 border-3 border-pink-900">
      <p class="text-sm text-black font-bold">${formattedDate} | ${formattedTime}</p>
      <h2 class="text-xl font-semibold">${data.name}, ${data.sys.country}</h2>
      <p class="text-5xl font-bold">${Math.round(data.main.temp)}°C</p>
      <p class="capitalize text-lg">${data.weather[0].description}</p>
      <div class="flex justify-center gap-4 mt-2 text-sm text-gray-700">
        <p>💧 Humidity: ${data.main.humidity}%</p>
        <p>💨 Wind: ${data.wind.speed} m/s</p>
      </div>
    </div>`;
}

// Display forecast cards for the next 5 days
function renderForecast(list) {
  forecastContainer.innerHTML = '';

  // Filter forecast data to get only noon forecasts
  const daily = list.filter(item => item.dt_txt.includes('12:00:00'));
  
  // Render a card for each day's forecast
  daily.forEach(item => {
    const date = new Date(item.dt_txt);
    forecastContainer.innerHTML += `
      <div class="bg-white bg-opacity-80 rounded-lg p-3 text-center border-3 border-pink-900">
        <p class="font-semibold">${date.toDateString().slice(0, 10)}</p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" class="mx-auto" />
        <p>${Math.round(item.main.temp)}°C</p>
        <p>💧 ${item.main.humidity}%</p>
        <p>💨 ${item.wind.speed} m/s</p>
      </div>`;
  });
}

// Save searched city to localStorage (max 5 recent)
function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem('recentCities')) || [];

  // Remove city if already exists to avoid duplicates
  cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());
 
 // Add city to start of the list
  cities.unshift(city);

  // Keep only the 5 most recent cities
  cities = cities.slice(0, 5);

  // Save back to localStorage
  localStorage.setItem('recentCities', JSON.stringify(cities));
 
  // Update dropdown menu
  updateRecentDropdown();
}

// Update the recent cities dropdown
function updateRecentDropdown() {
  const cities = JSON.parse(localStorage.getItem('recentCities')) || [];
  
  // Add each city as an option
  recentDropdown.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
  
  // Show or hide recent cities container
  recentCitiesContainer.classList.toggle('hidden', cities.length === 0);
}

// Event listener for search button
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  // Empty input
  if (!city) {
    alert('Please enter a city name.');
    return;
  }

  // Numbers or symbols not allowed (only letters and spaces)
  const cityPattern = /^[a-zA-Z\s]+$/;
  if (!cityPattern.test(city)) {
    alert('City name should only contain letters.');
    return;
  }

  // Gibberish or invalid names (e.g. "dawdawfawf")
  // blocks it by checking length or uncommon patterns
  if (city.length > 15 || city.match(/(.)\1{3,}/)) {
    alert('Please enter a valid city name.');
    return;
  }
  getWeatherData(city); // Fetch and display weather
});

// Event listener for selecting from recent cities
recentDropdown.addEventListener('change', () => {
  const city = recentDropdown.value;
  if (city) getWeatherData(city); // Fetch weather for selected city
});

// Event listener for current location button
currentLocationBtn.addEventListener('click', () => {
  // Request geolocation
  navigator.geolocation.getCurrentPosition(async position => {
    const { latitude, longitude } = position.coords;
    try {
      // Fetch weather using coordinates
      const response = await fetch(`${API_BASE}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
      const data = await response.json();
      // Render and save location data
      renderCurrentWeather(data);
      getForecastData(latitude, longitude);
      saveRecentCity(data.name);
    } catch (error) {
      // Error fetching location weather
      weatherContainer.innerHTML = `<p class='text-red-500'>Could not get location weather</p>`;
    }
  }, () => {
    // Geolocation access denied
    alert('Geolocation permission denied.');
  });
});

// Load recent cities on startup
updateRecentDropdown();
