"use strict";

const hourly = {
  place: JSON.parse(localStorage.getItem('vars')).place,
  units: JSON.parse(localStorage.getItem('units')),

  dayNight(sr, ss, h) {
    let dn = '';
    if (sr <= h && h <= ss) { dn = '-d'; } else { dn = '-n'; }
    return dn;
  },

  getWndDir(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.floor(((degrees + 11.25) % 360) / 22.5);
    return directions[index];
  },

  tempColour(temp) {
    const ranges = [-Infinity, 0, 5, 10, 15, 20, 25];
    const colors = ['#00ffff', '#3399ff', '#3366cc', '#3319ff', '#ff6600', '#ff0000', '#993300'];
    for (let i = ranges.length - 1; i >= 0; i--) {
      if (temp >= ranges[i]) return colors[i];
    }
  },

  cloudColour(cloud) {
    const ranges = [0, 20, 40, 60, 80];
    const colors = ['#eeeeee', '#dddddd', '#cccccc', '#bbbbbb', '#aaaaaa'];
    for (let i = ranges.length - 1; i >= 0; i--) {
      if (cloud >= ranges[i]) return colors[i];
    }
  },

  wndSpdColour(wndSpd) {
    const ranges = [0, 2, 5, 7, 9, 12, 14, 17, 20, 25];
    const colors = [
      '#888',
      '#555',
      '#333',
      '#b3b300',
      '#ff9900',
      '#b36b00',
      '#ff5050',
      '#e60000',
      '#800000;font-weight:bold',
      '#ff0000;font-weight:bold',
    ];
    for (let i = ranges.length - 1; i >= 0; i--) {
      if (wndSpd >= ranges[i]) return colors[i];
    }
  },

  convertSpd(spd) {
    let s = 0;
    if (this.units.speed === 'kt') {
      s = spd * 1.944;
    } else if (this.units.speed == 'mph') {
      s = spd * 2.236936;
    } else if (this.units.speed === 'Bf') {
      s = (spd / 0.836) ** (2 / 3)
    }
    return s;
  },

  convertTemp(temp) {
    let t = 0;
    if (this.units.temp === 'F') {
      t = ((temp * 1.8) + 32);
    }
    else {
      t = temp;
    }
    return t;
  },

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

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

    for (let i = 0; i < 48; i++) {
      const ts = fc[i].dt + data.timezone_offset;
      const temp = this.convertTemp(fc[i].temp).toFixed(1);
      const tbg = this.tempColour(fc[i].temp);
      const symbol = fc[i].weather[0].icon;
      const cond = fc[i].weather[0].description;
      const wndSpd = this.convertSpd(fc[i].wind_speed).toFixed(0);
      const wsp = this.wndSpdColour(fc[i].wind_speed);
      const wndDir = fc[i].wind_deg;
      let gust = '';
      fc[i].wind_gust ? gust = `/${this.convertSpd(fc[i].wind_gust).toFixed(0)}` : gust = '';
      const pres = fc[i].pressure;
      let rain = '';
      fc[i].rain ? rain = `<b>${fc[i].rain['1h'].toFixed(1)}mm</b>` : rain = '0mm';
      const cloud = fc[i].clouds;

      const time = new Date(ts * 1000);
      const ftime = time.getHours().toString().padStart(2, 0);
      const day = days[time.getDay()];

      const dn = this.dayNight(Number(sunriseHour), Number(sunsetHour), ftime);
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
          <td style="background-color: ${this.cloudColour(cloud)}">${cloud}&percnt;</td><td style="color:${wsp}">
    ${wndSpd}${gust}${this.units.speed}</td><td>${this.getWndDir(wndDir)}</td><td>${pres}mb</td></tr>`;
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

