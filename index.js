"use strict";

function Widget() {
  const hash = getHash();
  // Get location from local storage if it's there, defaults if not
  const vars = JSON.parse(localStorage.getItem('vars')) || {"lat": 50.15, "lon": -5.07, "place": "Falmouth"};
  // If units in storage ok or set defaults
  localStorage.units || localStorage.setItem('units', '{"temp": "C", "speed": "mph"}');
  const units = JSON.parse(localStorage.getItem('units'));
  const loader = document.getElementById('loading');
  const dayArray = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  initSearchForm();
  loadUrlParams();
  saveVars();
  callApi();

  function initWidget() {
    const tempPrefs = ['C', 'F'];
    const tempUnit = units.temp; // Example selected temperature unit
    const tempPrefsDiv = generateRadioButtons(tempPrefs, tempUnit, 'tempUnits');

    const spdPrefs = ['mph', 'kt', 'Bf'];
    const spdUnit = units.speed; // Example selected speed unit
    const spdPrefsDiv = generateRadioButtons(spdPrefs, spdUnit, 'spdUnits');

    let result = JSON.parse(sessionStorage.getItem('weather_data'));

    // Current conditions
    let data = result.current;

    let d = new Date((data.dt + result.timezone_offset) * 1000);
    const h = d.getUTCHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');

    const temp = convertTemp(data.temp, tempUnit).toFixed(1);
    const feelsLike = convertTemp(data.feels_like, tempUnit).toFixed(1);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;
    const windSpd = convertSpd(data.wind_speed, spdUnit).toFixed(0);
    const gust = calcGust(data.wind_gust, spdUnit);        
    const windDir = getWndDir(data.wind_deg);
    const pres = data.pressure;
    const hum = data.humidity

    const sunrise = new Date((data.sunrise + result.timezone_offset) * 1000);
    const sunriseHour = sunrise.getUTCHours().toString().padStart(2, '0');
    const sunriseMin = sunrise.getMinutes().toString().padStart(2, '0');
    const sunset = new Date((data.sunset + result.timezone_offset) * 1000);
    const sunsetHour = sunset.getUTCHours().toString().padStart(2, '0');
    const sunsetMin = sunset.getMinutes().toString().padStart(2, '0');
    let warnings;
    result.alerts ? warnings = formatWarnings(result.alerts) : warnings = '';

    document.getElementById('container').innerHTML =
      `<table><tbody>
      <tr><td colspan="3" style="padding:10px;"><h3>${vars.place}</h3>
      <P><span style="font-size:large;font-weight:bold">${temp}&deg;${tempUnit}</span> f/l ${feelsLike}&deg;${tempUnit}</p>
      <p style="font-variant:small-caps;">${desc}<br>
      <img src="PNG/${icon}.png" width="80" height="80" alt="${desc}"></p></td>
      <td colspan="4" style="padding:10px;"><p>Wind: ${windSpd}${gust}${spdUnit} ${windDir}<br>
      Pressure: ${pres}mb<br>
      Humidity: ${hum}&percnt;</p>
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
      <tr id="forecast">`;
    document.getElementById('searchForm').addEventListener('submit', searchLocation);

    // 7 day forecast;
    data = result.daily;

    document.getElementById('forecast').innerHTML = '';

    for (let i = 0; i < 5; i++) {
      d = new Date(data[i].dt * 1000).getDay();
      d = dayArray[d];

      const tempMax = convertTemp(data[i].temp.max, tempUnit).toFixed(0);
      const tempMin = convertTemp(data[i].temp.min, tempUnit).toFixed(0);
      const dailyDesc = data[i].weather[0].description.toUpperCase();
      const dailyIcon = data[i].weather[0].icon;
      const dailyWindSpd = convertSpd(data[i].wind_speed, spdUnit).toFixed(0);
      const dailyGust = calcGust(data[i].wind_gust, spdUnit);
      const dailyWindDir = getWndDir(data[i].wind_deg);
      let rain;
      data[i].rain ? rain = data[i].rain.toFixed(1) : rain = '0';
      const POP = Math.round(data[i].pop * 100);
      const dailyPres = Math.round(data[i].pressure);
      const summary = data[i].summary;

      document.getElementById('forecast').innerHTML +=
        `<td><table><tr><td>${d}</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">Min/max temp</span>${tempMax}/${tempMin}&deg;${tempUnit}</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">${dailyDesc}</span>
         <img src="PNG/${dailyIcon}.png"
         width="30" height="30"
         alt="${dailyDesc}">       
         </td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">Wind speed/gust</span>${dailyWindSpd}${dailyGust}${spdUnit}</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">Wind direction</span>${dailyWindDir}</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">Chance of rain</span>${POP}&percnt;</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">Amount of rain</span>${rain}mm</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">Pressure</span>${dailyPres}mb</td></tr>
         <tr><td class="tooltip"><span class="tooltiptext">${summary}</span>Summary</td></tr>
       </table>`;
    }
    document.getElementById('container').innerHTML += `</td></tr></tbody></table></div>`;

    document.getElementById('footer').innerHTML =
      `${warnings}<p><a href='hourly.html'>Hourly 48h</a>
         <a href="5-days.html">3 hourly 5 days</a>
         <a href="radar.html">Radar</a>
         <div id="tempPrefs">
          ${tempPrefsDiv}
         </div>
         <div id="spdPrefs">
          ${spdPrefsDiv}
         </div>
       <p>Weather data provided by <a href="https://openweathermap.org/" target="_blank">OpenWeather</a></p>`;
    document.getElementById('tempUnits').addEventListener('change', changeUnits);
    document.getElementById('spdUnits').addEventListener('change', changeUnits);
  }

  // Show spinner during fetch
  function displayLoading() {
      loader.classList.add("display");
      // to stop loading after some time
      setTimeout(() => {
          loader.classList.remove("display");
      }, 10000);
  }

  // Hide spinner 
  function hideLoading() {
      loader.classList.remove("display");
  }

  function calcGust(gust, spdUnit) {
    let g;
    gust > 0 ? g = `/${convertSpd(gust, spdUnit).toFixed(0)}` : g = '';
    return g;
  }

  function generateRadioButtons(prefs, selectedUnit, name) {
    let prefsDiv = `<form id="${name}">`;
    for (const pref of prefs) {
      const checked = (pref === selectedUnit) ? 'checked' : '';
      prefsDiv += `<label><input type="radio" name="${name}" value="${pref}"  ${checked}>${pref}</label>`;
    }
    prefsDiv += '</form>';
    return prefsDiv;
  }

  function convertSpd(spd, spdUnit) {
    let s;
    switch (spdUnit) {
      case ('mph'): s = spd * 2.236936; break;
      case ('kt'): s = spd * 1.944; break;
      case ('Bf'): s = (spd / 0.836) ** (2 / 3);
    }
    return s;
  }

  function convertTemp(temp, tempUnit) { //console.log(tempUnit);
    let t;
    if (tempUnit === 'F') {
      t = ((temp * 1.8) + 32);
    }
    else {
      t = temp;
    }
    return t;
  }

  function getWndDir(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.floor(((degrees + 11.25) % 360) / 22.5);
    return directions[index];
  }

  function changeUnits(e) {
    const tmp = units;
    if (e.target.name === 'tempUnits') {
      tmp.temp = e.target.value;
    } else tmp.speed = e.target.value;
    localStorage.setItem('units', JSON.stringify(tmp));
    initWidget();
  }

  function formatWarnings(warnings) {
    let warningsText = '';
    warnings.forEach(warning => {
      try {
        let start = new Date(warning.start * 1000);
        start = `${dayArray[start.getDay()]}, ${start.getHours().toString().padStart(2, '0')}hrs`;
        let end = new Date(warning.end * 1000);
        end = `${dayArray[end.getDay()]}, ${end.getHours().toString().padStart(2, '0')}hrs`;
        const event = `<strong>${warning.event}</strong>`;
        const desc = warning.description.replace(/\n/g, '<br>');
        const warningText = `<p><strong>Weather warning</strong></p>
                            <p>${start} - ${end}</p>
                            <p>${event}</p>
                            <p>${desc}</p>`
        warningsText += warningText;
      }
      catch(err) {
        console.log(err);
      }
    });
      return warningsText;
  }

  function getLocation(result) {
    document.getElementById('results').innerHTML = '';

    if (result.length > 0) {
      result.forEach(res => {
        document.getElementById('results').innerHTML +=
          `<p><a href="index.html?lat=${res.lat.toFixed(2)}&lon=${res.lon.toFixed(2)}&place=${res.name || ''}">${res.name} ${res.state || ''} ${res.country || ''}</a></p>`;
      });
    } else document.getElementById('results').innerHTML = '<p>No results</p>';
  }

  function searchLocation(e) {
    e.preventDefault(); // Needed to stop calling new html doc on submit which cancels fetch
    displayLoading();
    const loc = document.getElementById('loc').value;
    const controller = new AbortController();
    setTimeout(() => controller.abort('Network error'), 5000);

    if (loc && hash) {
      fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${loc}&limit=5&appid=${hash}`,
        { signal: controller.signal })
        .then(response => {
          hideLoading();
          if (!response.ok) {
            throw new Error(`Network response not ok: ${response.statusText}`);
          }
          return response.json();
        })
        .then(result => getLocation(result))
        .catch(err => alert(`Error: ${err}`))
    }
  }

  function initSearchForm() {
    document.getElementById('search').innerHTML = 
      `<form id="searchForm">
      <p><label for="loc">Location search </label>
        <input id="loc" type="text" name="loc">
        <input type="submit" name="submit" value="Go"></p>
   </form>
   <div id="results"></div>`;
    document.getElementById('searchForm').addEventListener('submit', searchLocation);
  }

  // If url has parameters (after search) change to those
  function loadUrlParams() {
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
      vars[key] = decodeURI(value);
    });
  };

  function saveVars() {
    const { lat, lon, place } = vars;
    if (lat && lon && place) {
      localStorage.setItem('vars', JSON.stringify(vars));
    }
  }

  function callApi() {
    const { lat, lon } = vars;
    if (lat && lon && hash) {
            displayLoading();     
      const apiRequest = new XMLHttpRequest();
            apiRequest.open("GET", `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${hash}`, true);
            apiRequest.onload = () => {
            hideLoading();
                sessionStorage.setItem("weather_data", apiRequest.response);
                initWidget()
            };
            apiRequest.send();

      //displayLoading();
      //const controller = new AbortController();
      //setTimeout(() => controller.abort('Network error'), 10000);
      //fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${hash}`,
      //  { signal: controller.signal })
      //  .then(response => {
      //    hideLoading();
      //    if (!response.ok) {
      //      throw new Error(`Network response not ok: ${response.statusText}`);
      //    }
      //    return response.json();
      //  })
      //  .then(result => {
      //    sessionStorage.setItem("weather_data", JSON.stringify(result));
      //    initWidget()
      //  })
      //  .catch(err => alert(`Error: ${err}`))
    }
  }
}

const widget = new Widget();
