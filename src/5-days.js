import { getHash, convertTemp, convertSpd, calcGust, getWndDir, dayNight, tempColour, cloudColour, wndSpdColour } from './utils.js';

"use strict"

const fiveDays = {
  hash: getHash(),
  loader: document.getElementById('loading'),
  vars: JSON.parse(localStorage.getItem('vars')),
  units: JSON.parse(localStorage.getItem('units')),

  renderWidget(data) {
    let forecastTable = '';
    const city = data.city;

    let sunrise = new Date((city.sunrise + city.timezone) * 1000);
    let sunset = new Date((city.sunset + city.timezone) * 1000);
    sunrise = new Date(sunrise);
    const sunriseHour = sunrise.getHours().toString().padStart(2, 0);
    sunset = new Date(sunset);
    const sunsetHour = sunset.getHours().toString().padStart(2, 0);
    const tempUnit = this.units.temp;
    const spdUnit = this.units.speed;

    for (let item of data.list) {
      let time = (item.dt + city.timezone) * 1000;
      const temp = convertTemp(item.main.temp - 273.15, tempUnit).toFixed(1);
      const tbg = tempColour(item.main.temp -273.15);

      const symbol = item.weather[0].icon;
      const cond = item.weather[0].description;
      const cloud = item.clouds.all;
      const clColour = cloudColour(item.clouds.all);
      const wndSpd = convertSpd(item.wind.speed, spdUnit).toFixed(0);
      const wspColour = wndSpdColour(item.wind.speed);
      const gust = calcGust(item.wind.gust, spdUnit);
      const gustColour = wndSpdColour(item.wind.gust);
      const wndDir = getWndDir(item.wind.deg);
      const prs = item.main.pressure;
      let rain = '';
      item['rain'] ? rain = `<b>${item['rain']['3h'].toFixed(1)}mm</b>` : rain = '0mm';

      time = new Date(time);
      const ftime = time.getHours().toString().padStart(2, 0);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
      const day = days[time.getDay()];

      const dn = dayNight(Number(sunriseHour), Number(sunsetHour), ftime);
      let dnColour = '';
      if (dn === '-d') dnColour = 'style="background-color:#fff"';
      else if (dn === '-n') dnColour = 'style="background-color:#ddd"';

      forecastTable +=
        `<tr class="forecast"${dnColour}><td><strong>${day} ${ftime}h</strong></td>
           <td style="padding-right:3px;color:${tbg}"><strong>${temp}&deg;${tempUnit}</strong></td>
           <td><image src="PNG/${symbol}.png" alt="${cond}" width="30" height="30"></td>
           <td style="font-variant:small-caps;">${cond}</td><td>${rain}</td>
           <td style="background-color: ${clColour}">${cloud}&percnt;</td><td>
           <span style="color: ${wspColour}">${wndSpd}</span><span style="color: ${gustColour}">${gust}</span>&nbsp;${spdUnit}</td>
           <td>${wndDir}</td><td>${prs}mb</td></tr>`;
    }

    document.getElementById('container').innerHTML = 
    `<table>
      <thead>
        <tr><td colspan="3"><button class="back_button" onclick="history.back()">Back</button></td>
          <td colspan="6"><h3>5 day forecast for ${this.vars.place}</h3></td></tr>
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

  callApi() {
    const { lat, lon } = this.vars;
    if (lat && lon && this.hash) {
      this.loader.classList.add("display");   
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.hash}`)
        .then(response => {
          this.loader.classList.remove("display");
          if (!response.ok) {
            throw new Error(`Network response not ok: ${response.statusText}`);
          }
          return response.json();
        })
        .then(result => this.renderWidget(result))
        .catch(err => alert(`Error: ${err}`))
    }
  }
}

fiveDays.callApi();
