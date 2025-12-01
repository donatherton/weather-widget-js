import { convertTemp, convertSpd, calcGust, getWndDir, dayNight, tempColour, cloudColour, wndSpdColour } from './utils.js';

'use strict';

const hourly = {
  place: JSON.parse(localStorage.getItem('vars')).place,
  units: JSON.parse(localStorage.getItem('units')),

  renderWidget(result) {
    const data = JSON.parse(result);
    let forecastTable = '';

    let sunrise = data.current.sunrise + data.timezone_offset;
    let sunset = data.current.sunset + data.timezone_offset;
    sunrise = new Date(sunrise * 1000);
    const sunriseHour = sunrise.getHours().toString().padStart(2, 0);
    sunset = new Date(sunset * 1000);
    const sunsetHour = sunset.getHours().toString().padStart(2, 0);
    const tempUnit = this.units.temp;
    const spdUnit = this.units.speed;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

    for (let item of data.hourly) {
      const ts = item.dt + data.timezone_offset;
      const temp = convertTemp(item.temp, tempUnit).toFixed(1);
      const tbg = tempColour(item.temp);
      const { icon, description } = item.weather[0];
      const wndSpd = convertSpd(item.wind_speed, spdUnit).toFixed(0);
      const wspColour = wndSpdColour(item.wind_speed);
      const wndDir = getWndDir(item.wind_deg);
      const gust = calcGust(item.wind_gust, spdUnit);
      const gustColour = wndSpdColour(item.wind_gust);
      const { pressure } = item;
      let rain = '';
      item.rain ? rain = `<b>${item.rain['1h'].toFixed(1)}mm</b>` : rain = '0mm';
      const cloud = item.clouds;
      const clColour = cloudColour(cloud);

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
           <td style="padding-right:3px;color:${tbg}"><strong>${temp}&deg;${tempUnit}</strong></td>
           <td><image src="PNG/${icon}.png" alt="${description}" width="30" height="30"></td>
           <td style="font-variant:small-caps;">${description}</td><td>${rain}</td>
           <td style="background-color: ${clColour}">${cloud}&percnt;</td><td>
           <span style="color: ${wspColour}">${wndSpd}</span><span style="color: ${gustColour}">${gust}</span>&nbsp;${spdUnit}</td>
           <td>${wndDir}</td><td>${pressure}mb</td></tr>`;
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
  },
};

const data = sessionStorage.getItem('weather_data');
if (data) {
  hourly.renderWidget(data);
} else alert('No data');

