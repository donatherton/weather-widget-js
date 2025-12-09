import { getHash, convertSpd, convertTemp, calcGust, getWndDir } from './utils.js';

'use strict';
/* Check whether prefs in storage, save defaults if not */ 
localStorage.units || localStorage.setItem('units', '{"temp": "C", "speed": "mph"}');
localStorage.vars || localStorage.setItem('vars', '{"lat": 50.15, "lon": -5.07, "place": "Falmouth"}');

const widget = {
  hash: getHash(),
  vars: JSON.parse(localStorage.getItem('vars')),
  units: JSON.parse(localStorage.getItem('units')),
  loader: document.getElementById('loading'),
  dayArray: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

  renderWidget() {
    const tempPrefs = ['C', 'F'];
    const tempUnit = this.units.temp;
    const tempPrefsDiv = this.generateRadioButtons(tempPrefs, tempUnit, 'tempUnits');

    const spdPrefs = ['mph', 'kt', 'kph', 'Bf'];
    const spdUnit = this.units.speed;
    const spdPrefsDiv = this.generateRadioButtons(spdPrefs, spdUnit, 'spdUnits');

    const result = JSON.parse(sessionStorage.getItem('weather_data'));

    // Current conditions
    const data = result.current;

    const d = new Date((data.dt + result.timezone_offset) * 1000);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');

    const temp = convertTemp(data.temp, tempUnit).toFixed(1);
    const feelsLike = convertTemp(data.feels_like, tempUnit).toFixed(1);
    const { icon, description } = data.weather[0];
    const windSpd = convertSpd(data.wind_speed, spdUnit).toFixed(0);
    const gust = calcGust(data.wind_gust, spdUnit);
    const windDir = getWndDir(data.wind_deg);
    const { pressure, humidity } = data;

    const sunrise = new Date((data.sunrise + result.timezone_offset) * 1000);
    const sunriseHour = sunrise.getHours().toString().padStart(2, '0');
    const sunriseMin = sunrise.getMinutes().toString().padStart(2, '0');
    const sunset = new Date((data.sunset + result.timezone_offset) * 1000);
    const sunsetHour = sunset.getHours().toString().padStart(2, '0');
    const sunsetMin = sunset.getMinutes().toString().padStart(2, '0');
    let warnings = '';
    if (result.alerts) warnings = this.formatWarnings(result.alerts);

    document.getElementById('search').innerHTML = 
    `<form id="searchForm">
      <p><label for="loc">Location search </label>
      <input id="loc" type="text" name="loc">
      <input type="submit" name="submit" value="Go"></p>
     </form>
     <div id="results"></div>`;
    document.getElementById('searchForm').addEventListener('submit', e => this.callSearchApi(e));

    document.getElementById('container').innerHTML =
      `<table><tbody>
        <tr><td colspan="3" style="padding:10px;"><h3>${this.vars.place}</h3>
        <P><span style="font-size:large;font-weight:bold">${temp}&deg;${tempUnit}</span> f/l ${feelsLike}&deg;${tempUnit}</p>
        <p style="font-variant:small-caps;">${description}<br>
        <img src="PNG/${icon}.png" width="80" height="80" alt="${description}"></p></td>
        <td colspan="4" style="padding:10px;"><p>Wind: ${windSpd}${gust}${spdUnit} ${windDir}<br>
        Pressure: ${pressure}mb<br>
        Humidity: ${humidity}&percnt;</p>
        <p>Sunrise: ${sunriseHour}:${sunriseMin}<br>Sunset: ${sunsetHour}:${sunsetMin}</p>
        <p>Updated: ${h}:${m}:${s}</p>
        <div class="tooltip">
        <span class="tooltiptext">Hover / tap on items in table below for more info</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
        </svg>
        </div>
        </td></tr>
        <tr>${this.dailyForecast(result.daily, tempUnit, spdUnit, d)}</tr>
        </td></tr></tbody>
      </table>
      </div>`;

    document.getElementById('footer').innerHTML =
      `${warnings}
         <p id="links"><a href='hourly.html'>Hourly 48h</a>
         <a href="5-days.html">3 hourly 5 days</a>
         <a href="radar/radar.html">Radar</a></p>
         <div id="tempPrefs">
          ${tempPrefsDiv}
         </div>
         <div id="spdPrefs">
          ${spdPrefsDiv}
         </div>
       <p>Weather data provided by <a href="https://openweathermap.org/" target="_blank">OpenWeather</a></p>`;
    document.getElementById('tempUnits').addEventListener('change', e => this.changeUnits(e));
    document.getElementById('spdUnits').addEventListener('change', e => this.changeUnits(e));
    this.toggleWarnings(document.querySelector('.warning-btn'));
  },

  dailyForecast(data, tempUnit, spdUnit, d) {
    let forecastTable = '';
    for (let i = 0; i < 5; i++) {
      d = new Date(data[i].dt * 1000).getDay();
      d = this.dayArray[d];

      const tempMax = convertTemp(data[i].temp.max, tempUnit).toFixed(0);
      const tempMin = convertTemp(data[i].temp.min, tempUnit).toFixed(0);
      const dailyDesc = data[i].weather[0].description.toUpperCase();
      const dailyIcon = data[i].weather[0].icon;
      const dailyWindSpd = convertSpd(data[i].wind_speed, spdUnit).toFixed(0);
      const dailyGust = calcGust(data[i].wind_gust, spdUnit);
      const dailyWindDir = getWndDir(data[i].wind_deg);
      let rain = '';
      data[i].rain ? rain = data[i].rain.toFixed(1) : rain = '0';
      const POP = Math.round(data[i].pop * 100);
      const dailyPres = Math.round(data[i].pressure);
      const { summary } = data[i];

      forecastTable +=
        `<td><div>${d}</div>
         <div class="tooltip"><span class="tooltiptext">Min/max temp</span>${tempMax}/${tempMin}&deg;${tempUnit}</div>
         <div class="tooltip"><span class="tooltiptext">${dailyDesc}</span>
         <img src="PNG/${dailyIcon}.png"
           width="30" height="30"
           alt="${dailyDesc}">       
         </div>
         <div class="tooltip"><span class="tooltiptext">Wind speed/gust</span>${dailyWindSpd}${dailyGust}${spdUnit}</div>
         <div class="tooltip"><span class="tooltiptext">Wind direction</span>${dailyWindDir}</div>
         <div class="tooltip"><span class="tooltiptext">Chance of rain</span>${POP}&percnt;</div>
         <div class="tooltip"><span class="tooltiptext">Amount of rain</span>${rain}mm</div>
         <div class="tooltip"><span class="tooltiptext">Pressure</span>${dailyPres}mb</div>
         <div class="tooltip"><span class="tooltiptext">${summary}</span>Summary</div>`;
    }

    return forecastTable;
  },

  generateRadioButtons(prefs, selectedUnit, name) {
    let prefsDiv = `<form id="${name}">`;
    for (const pref of prefs) {
      const checked = (pref === selectedUnit) ? 'checked' : '';
      prefsDiv += `<label><input type="radio" name="${name}" value="${pref}"  ${checked}>${pref}</label>`;
    }

    prefsDiv += '</form>';
    return prefsDiv;
  },

  changeUnits(e) {
    this.units = { ...this.units, [e.target.name === 'tempUnits' ? 'temp' : 'speed']: e.target.value };
    localStorage.setItem('units', JSON.stringify(this.units));
    this.renderWidget();
  },

  toggleWarnings(warningBtn) {
    if (!warningBtn) return;
    warningBtn.addEventListener('click', () => {
      Array.from(document.querySelectorAll('.warning-txt'))
        .forEach(w => {
          if (w.style.display === 'none') {
            w.style.display = 'block';
          } else {
            w.style.display = 'none';
          }
        });
    });
  },

  formatWarnings(warnings) {
    let warningsText = '<button class="warning-btn" title="Click to view">Weather Warning</button>';
    warnings.forEach(warning => {
       try {
        let start = new Date(warning.start * 1000);
        start = `${this.dayArray[start.getDay()]}, ${start.getHours().toString().padStart(2, '0')}hrs`;
        let end = new Date(warning.end * 1000);
        end = `${this.dayArray[end.getDay()]}, ${end.getHours().toString().padStart(2, '0')}hrs`;
        const event = `<strong>${warning.event}</strong>`;
        const desc = warning.description.replace(/\n/g, '');
        const warningText = `<div class="warning-txt" style="display:none">
                              <p>${event}</p>
                              <p>${start} - ${end}</p>
                              <p style="text-align:left">${desc}</p>
                            </div>`
        warningsText += warningText;
       } catch(err) {
        console.log(err);
      }
    });
      return warningsText;
  },

  renderSearchResults(result) {
    document.getElementById('results').innerHTML = '';
    if (result.length > 0) {
      result.forEach(res => {
        const link = document.createElement('p');
        link.textContent = `${res.name} ${res.state || res.country}`;
        document.getElementById('results').append(link);
        link.addEventListener('click', () => this.locationSelected(res.lat, res.lon, res.name, res.state || res.country));
      });
    } else document.getElementById('results').innerHTML = '<p>No results</p>';
  },

  locationSelected(lat, lon, place, state) {
    localStorage.setItem('vars', `{"lat": ${lat}, "lon": ${lon}, "place": "${place} ${state}"}`);
    this.vars = JSON.parse(`{"lat": ${lat}, "lon": ${lon}, "place": "${place} ${state}"}`);
    this.callWeatherApi();
  },

  callSearchApi(e) {
    e.preventDefault(); // Needed to stop calling new html doc on submit which cancels fetch
    const loc = document.getElementById('loc').value;
    if (loc && this.hash) {
      this.callFetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${loc}&limit=5&appid=${this.hash}`,
        this.renderSearchResults.bind(this)
      );
    }
  },

  callWeatherApi() {
    const { lat, lon } = this.vars;
    if (lat && lon && this.hash) {
      this.callFetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${this.hash}`,
        this.weatherApiCallback.bind(this)
      );
    }
  },

  weatherApiCallback(response) {
    sessionStorage.setItem('weather_data', JSON.stringify(response));
    this.renderWidget();
  },

  callFetch(url, callback) {
    this.loader.classList.add('display');
    fetch(url)
      .then(response => {
        this.loader.classList.remove('display');
        if (!response.ok) {
          throw new Error(`Network response not ok: ${response.statusText}`);
        }

        return response.json();
      })
      .then(result => callback(result))
      .catch(err => alert(`Error: ${err}`))
  },
};

widget.callWeatherApi();
