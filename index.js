"use strict";

function Widget() {
  const appid = appidStore.getAppid();

  function initWidget() { console.log(appid);
    // Helper functions
    function calcGust(gust) {
      let g;
      if (gust > 0) { g = `/${convertSpd(gust).toFixed(0)}`; } else g = '';
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

    function convertSpd(spd) {
      let s;
      if (spdUnit === 'kt') {
        s = spd * 1.944;
      } else if (spdUnit == 'mph') {
        s = spd * 2.236936;
      } else if (spdUnit === 'Bf') {
        s = (spd / 0.836) ** (2 / 3)
      }
      return s;
    }

    function convertTemp(temp) {
      let t;
      if (tempUnit === 'F') {
        t = ((temp * 1.8) + 32);
      }
      else {
        t = temp;
      }
      return t;
    }

    function getWndDir(wnd) {
      let wndDir = wnd;
      switch (true) {
        case (wndDir <= 11):   wndDir = 'N'; break;
        case (wndDir > 11 && wndDir <= 33): wndDir = 'NNE'; break;
        case (wndDir > 33 && wndDir <= 56):   wndDir = 'NE'; break;
        case (wndDir > 56 && wndDir <= 78): wndDir = 'ENE'; break;
        case (wndDir > 78 && wndDir <= 101): wndDir = 'E'; break;
        case (wndDir > 101 && wndDir <= 123): wndDir = 'ESE'; break;
        case (wndDir > 123 && wndDir <= 146): wndDir = 'SE'; break;
        case (wndDir > 146 && wndDir <= 168): wndDir = 'SSE'; break;
        case (wndDir > 168 && wndDir <= 190): wndDir = 'S'; break;
        case (wndDir > 190 && wndDir <= 213): wndDir = 'SSW'; break;
        case (wndDir > 213 && wndDir <= 235): wndDir = 'SW'; break;
        case (wndDir > 235 && wndDir <= 258): wndDir = 'WSW'; break;
        case (wndDir > 258 && wndDir <= 280): wndDir = 'W'; break;
        case (wndDir > 280 && wndDir <= 303): wndDir = 'WNW'; break;
        case (wndDir > 303 && wndDir <= 325): wndDir = 'NW'; break;
        case (wndDir > 325 && wndDir <= 347): wndDir = 'NNW'; break;
        case (wndDir > 347 && wndDir <= 360): wndDir = 'N';
      }
      return wndDir;
    }

    const units = JSON.parse(localStorage.getItem('units'));

    const tempPrefs = ['C', 'F'];
    const tempUnit = units.temp; // Example selected temperature unit
    const tempPrefsDiv = generateRadioButtons(tempPrefs, tempUnit, 'tempUnits');

    const spdPrefs = ['mph', 'kt', 'Bf'];
    const spdUnit = units.speed; // Example selected speed unit
    const spdPrefsDiv = generateRadioButtons(spdPrefs, spdUnit, 'spdUnits');

    let result = JSON.parse(sessionStorage.getItem('weather_data'));
    let data = result.current;

    let d = new Date(data.dt * 1000);
    const h = d.getHours().toString().padStart(2, 0);
    const m = d.getMinutes().toString().padStart(2, 0);
    const s = d.getSeconds().toString().padStart(2, 0);

    const temp = convertTemp(data.temp).toFixed(1);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;
    const windSpd = convertSpd(data.wind_speed).toFixed(0);
    const gust = calcGust(data.wind_gust);        
    const windDir = getWndDir(data.wind_deg);
    const pres = data.pressure;
    const hum = data.humidity

    const sunrise = new Date(data.sunrise * 1000);
    const sunriseHour = sunrise.getHours().toString().padStart(2, 0);
    const sunriseMin = sunrise.getMinutes().toString().padStart(2, 0);
    const sunset = new Date(data.sunset * 1000);
    const sunsetHour = sunset.getHours().toString().padStart(2, 0);
    const sunsetMin = sunset.getMinutes().toString().padStart(2, 0);

    document.getElementById('container').innerHTML =
      `<table><tbody>
      <tr><td colspan="3" style="padding:10px;"><h3>${place}</h3>
      <h3>${temp}&deg;${tempUnit}</h3>
      <p style="font-variant:small-caps;">${desc}<br>
      <img src="PNG/${icon}.png" width="60" height="60" alt="${desc}"></p></td>
      <td colspan="4" style="padding:10px;"><p>Wind: ${windSpd}${gust}${spdUnit} ${windDir}<br>
      Pressure: ${pres}mb<br>
      Humidity: ${hum}&percnt;</p>
      <p>Sunrise: ${sunriseHour}:${sunriseMin}<br>Sunset: ${sunsetHour}:${sunsetMin}</p>
      <p>Updated: ${h}:${m}:${s}</p></td></tr>
      <tr id="forecast">`;
    document.getElementById('searchForm').addEventListener('submit', searchLocation);

    // 7 day forecast;
    data = result.daily;

    document.getElementById('forecast').innerHTML = '';

    for (let i = 0; i < 5; i++) {
      d = new Date(data[i].dt * 1000);
      d = d.getDay();
      switch (d) {
        case 0: d = 'Sun'; break;
        case 1: d = 'Mon'; break;
        case 2: d = 'Tue'; break;
        case 3: d = 'Wed'; break;
        case 4: d = 'Thu'; break;
        case 5: d = 'Fri'; break;
        case 6: d = 'Sat';
      }

      const tempMax = convertTemp(data[i].temp.max).toFixed(0);
      const tempMin = convertTemp(data[i].temp.min).toFixed(0);
      const dailyDesc = data[i].weather[0].description.toUpperCase();
      const dailyIcon = data[i].weather[0].icon;
      const dailyWindSpd = convertSpd(data[i].wind_speed).toFixed(0);
      const dailyGust = calcGust(data[i].wind_gust);
      const dailyWindDir = getWndDir(data[i].wind_deg);
      let rain;
      if (data[i].rain) {
        rain = data[i].rain.toFixed(1);
      } else rain = '0';
      const POP = Math.round(data[i].pop * 100);
      const dailyPres = Math.round(data[i].pressure);

      document.getElementById('forecast').innerHTML +=
        `<td><table><tr><td>${d}</td></tr>
       <tr><td title="Min/max temp">${tempMax}/${tempMin}&deg;${tempUnit}</td></tr>
       <tr><td title="${dailyDesc}">
       <img src="PNG/${dailyIcon}.png"
       width="30" height="30"
       alt="${dailyDesc}"
       title="${dailyDesc}"></td></tr>
       <tr><td title="Wind speed/gust">${dailyWindSpd}${dailyGust}${spdUnit}</td></tr>
       <tr><td title="Wind direction">${dailyWindDir}</td></tr>
       <tr><td title="Chance of rain">${POP}&percnt;</td></tr>
       <tr><td title="Amount of rain">${rain}mm</td></tr>
       <tr><td title="Pressure">${dailyPres}mb</td></tr>
     </table>`;
    }
    document.getElementById('container').innerHTML += '</td></tr></tbody></table></div>';

    document.getElementById('footer').innerHTML =
      `<p><a href='hourly.html'>Hourly 48h</a>
         <a href="5-days.html">3 hourly 5 days</a>
         <a href="radar.html">Rainfall radar</a></p>
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


  function changeUnits(e) {
    const tmp = JSON.parse(localStorage.getItem('units'));
    if (e.target.name === 'tempUnits') {
      tmp.temp = e.target.value;
    } else tmp.speed = e.target.value;
    localStorage.setItem('units', JSON.stringify(tmp));
    initWidget();
  }

  document.getElementById('search').innerHTML = 
    `<form id="searchForm">
      <p><label for="loc">Location search </label>
        <input id="loc" type="text" name="loc"></p>
      <p><input type="submit" name="submit" value="OK"></p>
   </form>
   <div id="results"></div>`;

  function getLocation(result) {
    document.getElementById('results').innerHTML = '';

    if (result.length > 0) {
      result.forEach(res => {
        document.getElementById('results').innerHTML +=
          `<p><a href="index.html?lat=${res.lat}&lon=${res.lon}&place=${res.name}">${res.name}, ${res.state}, ${res.country}</a></p>`;
      });
    } else document.getElementById('results').innerHTML = '<p>No results</p>';
  }

  function searchLocation(e) {
    e.preventDefault(); // Needed to stop calling new html doc on submit which cancels fetch

    const loc = document.getElementById('loc').value;
    const controller = new AbortController();
    setTimeout(() => controller.abort('Network error'), 5000);

    if (loc && appid) {
      fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${loc}&limit=5&appid=${appid}`,
        { signal: controller.signal })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response not ok: ${response.statusText}`);
          }
          return response.json();
        })
        .then(result => getLocation(result))
      .catch(err => alert(`Error: ${err}`))
    }
  }

  document.getElementById('searchForm').addEventListener('submit', searchLocation);

  // Get location from local storage if it's there, empty object if not
  const vars = JSON.parse(localStorage.getItem('vars')) || {};
  // If units in storege ok or set defaults
  localStorage.units || localStorage.setItem('units', '{"temp": "C", "speed": "mph"}');

  // If url has parameters (after search) change to those
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => vars[key] = decodeURI(value));

  const { lat } = vars;
  const { lon } = vars;
  const { place } = vars;

  if (lat && lon && place) {
    localStorage.setItem('vars', JSON.stringify(vars));
  }

  //Send request for data
  if (lat && lon && appid) {
    const controller = new AbortController();
    setTimeout(() => controller.abort('Network error'), 5000);
    fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${appid}`,
      { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response not ok: ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        sessionStorage.setItem("weather_data", JSON.stringify(result));
        initWidget()
      })
    .catch(err => alert(`Error: ${err}`))
  }
}

const widget = new Widget();
