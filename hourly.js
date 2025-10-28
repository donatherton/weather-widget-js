import { convertTemp, convertSpd, calcGust, getWndDir, dayNight, tempColour, cloudColour, wndSpdColour } from './utils.js';

"use strict";

const hourly = {
  place: JSON.parse(localStorage.getItem('vars')).place,
  units: JSON.parse(localStorage.getItem('units')),

  renderWidget(result) {
    const data = JSON.parse(result);
    let forecastTable = '';

    const fc = data.hourly;
    
    let sunrise = data.current.sunrise + data.timezone_offset;
    let sunset = data.current.sunset + data.timezone_offset;
    sunrise = new Date(sunrise * 1000);
    const sunriseHour = sunrise.getHours().toString().padStart(2, 0);
    sunset = new Date(sunset * 1000);
    const sunsetHour = sunset.getHours().toString().padStart(2, 0);
    const tempUnit = this.units.temp;
    const spdUnit = this.units.speed;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

    for (let i in fc) {
      const ts = fc[i].dt + data.timezone_offset;
      const temp = convertTemp(fc[i].temp, tempUnit).toFixed(1);
      const tbg = tempColour(fc[i].temp);
      const symbol = fc[i].weather[0].icon;
      const cond = fc[i].weather[0].description;
      const wndSpd = convertSpd(fc[i].wind_speed, spdUnit).toFixed(0);
      const wsp = wndSpdColour(fc[i].wind_speed);
      const wndDir = fc[i].wind_deg;
      const gust = calcGust(fc[i].wind_gust, spdUnit);
      const pres = fc[i].pressure;
      let rain = '';
      fc[i].rain ? rain = `<b>${fc[i].rain['1h'].toFixed(1)}mm</b>` : rain = '0mm';
      const cloud = fc[i].clouds;

      const time = new Date(ts * 1000);
      const ftime = time.getHours().toString().padStart(2, 0);
      const day = days[time.getDay()];

      const dn = dayNight(Number(sunriseHour), Number(sunsetHour), ftime);
      let dnColour = '';
      if (dn === '-d') {
        dnColour = 'style="background-color:#fff"';
      } else if (dn === '-n') {
        dnColour = 'style="background-color:#ddd"';
      }

      forecastTable +=
        `<tr class="forecast"${dnColour}><td><strong>${day} ${ftime}h</strong></td>
           <td style="padding-right:3px;color:${tbg}"><strong>${temp}&deg;${this.units.temp}</strong></td>
           <td><image src="PNG/${symbol}.png" alt="${cond}" width="30" height="30"></td>
           <td style="font-variant:small-caps;">${cond}</td><td>${rain}</td>
           <td style="background-color: ${cloudColour(cloud)}">${cloud}&percnt;</td><td style="color:${wsp}">
        ${wndSpd}${gust}${this.units.speed}</td><td>${getWndDir(wndDir)}</td><td>${pres}mb</td></tr>`;
    }

    document.getElementById('container').innerHTML = 
    `<table>
      <thead>
        <tr><td colspan="3"><button class="back_button" onclick="history.back()">Back</button></td>
          <td colspan="6"><h3>48 hour forecast for ${this.place}</h3></td></tr>
        <tr>
          <td></td>
          <td>Temp</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>Rain</td>
          <td>Cloud</td>
          <td>Wind</td>
          <td>Dir</td>
          <td>Pres</td>
        </tr>
      </thead>
      <tbody>
        ${forecastTable}
      </tbody>
     </table>`;
  }
}

const data = sessionStorage.getItem('weather_data');
if (data) {
  hourly.renderWidget(data);
} else alert('No data');

