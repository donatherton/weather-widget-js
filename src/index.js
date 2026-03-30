'use strict';

import {
 getHash, convertSpd, convertTemp, calcGust, getWndDir, showError,
} from './utils.js';

/**
 * Main widget object handling weather display, search, and location services.
 * @namespace Widget
 */
const Widget = {
  apiKey: getHash(),
  defaultUnits: '{ "temp": "C", "speed": "mph" }',
  defaultVars: '{ "lat": 50.15, "lon": -5.07, "place": "Falmouth" }',
  forecastDays: 5,
  searchLimit: 5,
  geocodeUrl: 'https://api.openweathermap.org/geo/1.0/direct',
  reverseGeoUrl: 'https://api.openweathermap.org/geo/1.0/reverse',
  weatherUrl: 'https://api.openweathermap.org/data/3.0/onecall',
  refreshInterval: 600000,
  vars: null,
  units: null,
  loader: document.getElementById('loading'),
  dayArray: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  refreshTimer: null,

  /**
   * Initializes the widget by loading stored preferences, setting up UI,
   * fetching weather data, and starting auto-refresh.
   */
  init() {
    this.loadStorage();
    this.createSearch();
    this.createFooter();
    this.callWeatherApi();
    this.startAutoRefresh();
  },

  /**
   * Loads unit and location preferences from localStorage.
   * Sets defaults if not present or invalid.
   */
  loadStorage() {
    localStorage.units || localStorage.setItem('units', this.defaultUnits);
    localStorage.vars || localStorage.setItem('vars', this.defaultVars);

    try {
      this.vars = JSON.parse(localStorage.getItem('vars'));
    } catch {
      showError('Invalid location data. I\'ll try resetting defaults');
      localStorage.setItem('vars', this.defaultVars);
      this.loadStorage();
    }

    try {
      this.units = JSON.parse(localStorage.getItem('units'));
    } catch {
      showError('Invalid units data. I\'ll try resetting defaults');
      localStorage.setItem('units', this.defaultUnits);
      this.loadStorage();
    }
  },

  /**
   * Creates the location search form with geolocation button.
   */
  createSearch() {
    document.getElementById('search').innerHTML = `
    <form id="searchForm">
      <p><label for="loc">Location search </label>
      <input id="loc" type="text" name="loc" aria-label="Location search">
      <input type="submit" name="submit" value="Go">
      <button type="button" id="geoBtn" title="Use my location" aria-label="Use my location"><img src="./PNG/location.svg" height="15" alt="Use my location"></button></p>
    </form>
    <div id="results" aria-live="polite"></div>`;
    document.getElementById('searchForm').addEventListener('submit', e => this.callSearchApi(e));
    document.getElementById('geoBtn').addEventListener('click', () => this.handleGeolocation());
  },

  /**
   * Creates the footer with navigation links and unit preference controls.
   */
  createFooter() {
    const tempPrefs = ['C', 'F'];
    const tempPrefsDiv = this.generateRadioButtons(tempPrefs, this.units.temp, 'tempUnits', 'Temperature');

    const spdPrefs = ['mph', 'kt', 'kph', 'Bf'];
    const spdPrefsDiv = this.generateRadioButtons(spdPrefs, this.units.speed, 'spdUnits', 'Speed');

    document.getElementById('footer').innerHTML = `     
       <p id="links"><a href='hourly.html'>Hourly 48h</a>
       <a href="5-days.html">3 hourly 5 days</a>
       <a href="radar/radar.html">Radar</a></p>
       <div id="tempPrefs" role="group" aria-label="Temperature units">
        ${tempPrefsDiv}
       </div>
       <div id="spdPrefs" role="group" aria-label="Speed units">
        ${spdPrefsDiv}
       </div>
     <p>Weather data provided by <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeather</a></p>`;
    document.getElementById('tempUnits').addEventListener('change', e => this.changeUnits(e));
    document.getElementById('spdUnits').addEventListener('change', e => this.changeUnits(e));
  },

  /**
   * Renders the main weather widget with current conditions and daily forecast.
   */
  renderWidget() {
    const storedData = sessionStorage.getItem('weather_data');
    if (!storedData) {
      showError('No weather data available');
      return;
    }

    let result;
    try {
      result = JSON.parse(storedData);
    } catch (err) {
      showError(`Failed to parse weather data: ${err}`);
      return;
    }

    if (!result.current) {
      showError('Invalid weather data format');
      return;
    }

    const data = result.current;
    const d = new Date((data.dt + result.timezone_offset) * 1000);
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');

    const temp = convertTemp(data.temp, this.units.temp).toFixed(1);
    const feelsLike = convertTemp(data.feels_like, this.units.temp).toFixed(1);
    const { icon, description } = data.weather[0];
    const windSpd = convertSpd(data.wind_speed, this.units.speed).toFixed(0);
    const gust = calcGust(data.wind_gust, this.units.speed);
    const windDir = getWndDir(data.wind_deg);
    const { pressure, humidity } = data;

    const sunrise = new Date((data.sunrise + result.timezone_offset) * 1000);
    const sunriseHour = sunrise.getUTCHours().toString().padStart(2, '0');
    const sunriseMin = sunrise.getMinutes().toString().padStart(2, '0');
    const sunset = new Date((data.sunset + result.timezone_offset) * 1000);
    const sunsetHour = sunset.getUTCHours().toString().padStart(2, '0');
    const sunsetMin = sunset.getMinutes().toString().padStart(2, '0');

    const warnings = result.alerts ? this.formatWarnings(result.alerts) : '';
    const safePlace = this.escapeHtml(this.vars.place);
    const safeState = this.escapeHtml(this.vars.state);
    const safeDescription = this.escapeHtml(description);

    document.getElementById('container').innerHTML = `
      <table><tbody>
        <tr>
          <td colspan="3" class="cell-pad">
            <h3>${safePlace}</h3>
            <h4>${safeState}</h4>
            <p><span style="font-size:large;font-weight:bold">${temp}&deg;${this.units.temp}</span> f/l ${feelsLike}&deg;${this.units.temp}</p>
            <p class="temp-smallcaps">${safeDescription}<br>
            <img src="PNG/${icon}.png" width="80" height="80" alt="${safeDescription}"></p>
          </td>
          <td colspan="4" class="cell-pad">
            <p>Wind: ${windSpd}${gust}${this.units.speed} ${windDir}<br>
            Pressure: ${pressure}mb<br>
            Humidity: ${humidity}&percnt;</p>
            <p>Sunrise: ${sunriseHour}:${sunriseMin}<br>Sunset: ${sunsetHour}:${sunsetMin}</p>
            <p>Updated: ${h}:${m}:${s}</p>
            <div class="tooltip">
            <span class="tooltiptext">Hover / tap on items in table below for more info</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
            </svg>
            </div>
          </td>
        </tr>
        <tr>${this.dailyForecast(result.daily)}</tr>
      </tbody></table>
      ${warnings}`;
    this.toggleWarnings(document.querySelector('.warning-btn'));
  },

  /**
   * Generates HTML for the daily forecast row.
   * @param {Array} data - Array of daily forecast data
   * @returns {string} HTML string for daily forecast cells
   */
  dailyForecast(data) {
    let forecastTable = '';
    const limit = Math.min(this.forecastDays, data.length);

    for (let i = 0; i < limit; i++) {
      const dayDate = new Date(data[i].dt * 1000).getDay();
      const dayName = this.dayArray[dayDate];
      const tempMax = convertTemp(data[i].temp.max, this.units.temp).toFixed(0);
      const tempMin = convertTemp(data[i].temp.min, this.units.temp).toFixed(0);
      const dailyDesc = data[i].weather[0].description.toUpperCase();
      const safeDailyDesc = this.escapeHtml(dailyDesc);
      const dailyIcon = data[i].weather[0].icon;
      const dailyWindSpd = convertSpd(data[i].wind_speed, this.units.speed).toFixed(0);
      const dailyGust = calcGust(data[i].wind_gust, this.units.speed);
      const dailyWindDir = getWndDir(data[i].wind_deg);
      const rain = data[i].rain ? data[i].rain.toFixed(1) : '0';
      const POP = Math.round(data[i].pop * 100);
      const dailyPres = Math.round(data[i].pressure);
      const summary = this.escapeHtml(data[i].summary || '');

      forecastTable += `
        <td><div>${dayName}</div>
         <div class="tooltip"><span class="tooltiptext">Min/max temp</span>${tempMax}/${tempMin}&deg;${this.units.temp}</div>
         <div class="tooltip"><span class="tooltiptext">${safeDailyDesc}</span>
         <img src="PNG/${dailyIcon}.png"
           width="30" height="30"
           alt="${safeDailyDesc}">       
         </div>
         <div class="tooltip"><span class="tooltiptext">Wind speed/gust</span>${dailyWindSpd}${dailyGust}${this.units.speed}</div>
         <div class="tooltip"><span class="tooltiptext">Wind direction</span>${dailyWindDir}</div>
         <div class="tooltip"><span class="tooltiptext">Chance of rain</span>${POP}&percnt;</div>
         <div class="tooltip"><span class="tooltiptext">Amount of rain</span>${rain}mm</div>
         <div class="tooltip"><span class="tooltiptext">Pressure</span>${dailyPres}mb</div>
         <div class="tooltip"><span class="tooltiptext">${summary}</span>Summary</div>`;
    }

    return forecastTable;
  },

  /**
   * Generates HTML for a group of radio buttons.
   * @param {string[]} prefs - Array of option values
   * @param {string} selectedUnit - Currently selected value
   * @param {string} name - Name attribute for radio inputs
   * @param {string} label - Label text for the group
   * @returns {string} HTML string of radio button form
   */
  generateRadioButtons(prefs, selectedUnit, name, label) {
    let prefsDiv = `<form id="${name}" role="group" aria-label="${label}">`;
    for (const pref of prefs) {
      const checked = (pref === selectedUnit) ? 'checked' : '';
      prefsDiv += `<label><input type="radio" name="${name}" value="${pref}" ${checked}>${pref}</label>`;
    }

    prefsDiv += '</form>';
    return prefsDiv;
  },

  /**
   * Handles unit preference changes.
   * @param {Event} e - Change event from radio button
   */
  changeUnits(e) {
    this.units = { ...this.units, [e.target.name === 'tempUnits' ? 'temp' : 'speed']: e.target.value };
    localStorage.setItem('units', JSON.stringify(this.units));
    this.renderWidget();
  },

  /**
   * Toggles visibility of weather warnings when button is clicked.
   * @param {HTMLElement} warningBtn - The warning button element
   */
  toggleWarnings(warningBtn) {
    if (!warningBtn) {
return;
}

    warningBtn.addEventListener('click', () => {
      const warningTexts = document.querySelectorAll('.warning-txt');
      const isHidden = warningTexts[0]?.style.display === 'none';
      warningTexts.forEach(w => {
        w.style.display = isHidden ? 'block' : 'none';
      });
      warningBtn.setAttribute('aria-expanded', isHidden);
    });
  },

  /**
   * Formats weather alert data into HTML.
   * @param {Array} warnings - Array of weather warning objects
   * @returns {string} HTML string of formatted warnings
   */
  formatWarnings(warnings) {
    let warningsText = '<button class="warning-btn" title="Click to view" aria-expanded="false">⚠️ Weather Warning</button>';
    warnings.forEach(warning => {
      try {
        let start = new Date(warning.start * 1000);
        start = `${this.dayArray[start.getDay()]}, ${start.getHours().toString().padStart(2, '0')}hrs`;
        let end = new Date(warning.end * 1000);
        end = `${this.dayArray[end.getDay()]}, ${end.getHours().toString().padStart(2, '0')}hrs`;
        const event = `<strong>${this.escapeHtml(warning.event)}</strong>`;
        const desc = this.escapeHtml(warning.description.replace(/\n/g, ''));
        const warningText = `<div class="warning-txt" aria-live="polite">
                              <p>${event}</p>
                              <p>${start} - ${end}</p>
                              <p>${desc}</p>
                            </div>`;
        warningsText += warningText;
      } catch (err) {
        console.error('Error formatting warning:', err);
      }
    });
    return warningsText;
  },

  /**
   * Renders location search results as clickable buttons.
   * @param {Array} result - Array of location result objects
   */
  renderSearchResults(result) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    if (result && result.length > 0) {
      result.forEach(res => {
        const link = document.createElement('p');
        link.textContent = `${res.name} ${res.state || res.country}`;
        link.setAttribute('role', 'button');
        link.setAttribute('tabindex', '0');
        link.addEventListener('click', () => this.locationSelected(res.lat, res.lon, res.name, res.state || res.country));
        link.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.locationSelected(res.lat, res.lon, res.name, res.state || res.country);
          }
        });
        resultsContainer.append(link);
      });
    } else {
      resultsContainer.innerHTML = '<p>No results</p>';
    }
  },

  /**
   * Handles location selection and updates stored preferences.
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {string} place - Place name
   * @param {string} state - State or country
   */
  locationSelected(lat, lon, place, state) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      showError('Invalid location coordinates');
      return;
    }

    //const fullPlace = `${place} ${state}`;
    const vars = {
 lat, lon, place, state,
};
    localStorage.setItem('vars', JSON.stringify(vars));
    this.vars = vars;
    document.getElementById('results').innerHTML = '';
    this.callWeatherApi();
  },

  /**
   * Handles geolocation button click, requesting user location.
   */
  handleGeolocation() {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser');
      return;
    }

    this.loader.classList.add('display');
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const url = `${this.reverseGeoUrl}?lat=${latitude}&lon=${longitude}&limit=${this.searchLimit}&appid=${this.apiKey}`;
        this.callFetch(url, this.renderSearchResults.bind(this));
      },
      () => {
        showError('Unable to get your location');
        this.loader.classList.remove('display');
      },
      {timeout: 10000},
    );
  },

  /**
   * Handles location search form submission.
   * @param {Event} e - Submit event
   */
  callSearchApi(e) {
    e.preventDefault();
    const loc = document.getElementById('loc').value.trim();
    if (!loc) {
      showError('Please enter a location');
      return;
    }

    if (!this.apiKey) {
      showError('API key not configured');
      return;
    }

    const encodedLoc = encodeURIComponent(loc);
    const url = `${this.geocodeUrl}?q=${encodedLoc}&limit=${this.searchLimit}&appid=${this.apiKey}`;
    this.callFetch(url, this.renderSearchResults.bind(this));
  },

  /**
   * Fetches weather data from the API.
   */
  callWeatherApi() {
    const { lat, lon } = this.vars;
    if (!lat || !lon) {
      showError('Invalid location');
      return;
    }

    if (!this.apiKey) {
      showError('API key not configured');
      return;
    }

    const url = `${this.weatherUrl}?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${this.apiKey}`;
    this.callFetch(url, this.weatherApiCallback.bind(this));
  },

  /**
   * Callback for weather API response, stores data and triggers render.
   * @param {Object} response - API response data
   */
  weatherApiCallback(response) {
    if (!response) {
      showError('Empty response from weather API');
      return;
    }

    try {
      sessionStorage.setItem('weather_data', JSON.stringify(response));
      this.renderWidget();
    } catch (err) {
      showError(`Failed to save weather data: ${err.message}`);
    }
  },

  /**
   * Makes a fetch request with loading indicator and error handling.
   * @param {string} url - URL to fetch
   * @param {Function} callback - Function to call with parsed response
   */
  callFetch(url, callback) {
    this.loader.classList.add('display');
    fetch(url)
      .then(response => {
        this.loader.classList.remove('display');
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key');
          }

          if (response.status === 429) {
            throw new Error('API rate limit exceeded');
          }

          throw new Error(`Network error: ${response.status}`);
        }

        return response.json();
      })
      .then(result => {
        if (result.cod && result.message) {
          throw new Error(result.message);
        }

        callback(result);
      })
      .catch(err => {
        showError(err.message);
        this.loader.classList.remove('display');
      });
  },

  /**
   * Starts automatic weather data refresh at configured interval.
   */
  startAutoRefresh() {
    setInterval(() => {
      this.callWeatherApi();
    }, this.refreshInterval);
  },

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for HTML insertion
   */
  escapeHtml(str) {
    if (!str) {
return '';
}

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};

Widget.init();
