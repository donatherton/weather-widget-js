"use strict"
function FiveDays() {
  const appid = getAppid();
  function dayNight(sr, ss, h) {
    let dn;
    if (sr <= h && h <= ss) { dn = '-d'; } else { dn = '-n'; }
    return dn;
  }

  function tempColour(temp) {
    let Tbg;
    switch (true) {
      case temp < 0: Tbg = '#00ffff'; break;
      case temp >= 0 && temp < 5: Tbg = '#3399ff'; break;
      case temp >= 5 && temp < 10: Tbg = '#3366cc'; break;
      case temp >= 10 && temp < 15: Tbg = '#3319ff'; break;
      case temp >= 15 && temp < 20: Tbg = '#ff6600'; break;
      case temp >= 20 && temp < 25: Tbg = '#ff0000'; break;
      case temp >= 25: Tbg = '#993300';
    }
    return Tbg;
  }

  function cloudColour(cloud) {
    let Clbg;
    switch (true) {
      case cloud >= 0 && cloud < 20: Clbg = '#eeeeee'; break;
      case cloud >= 20 && cloud < 40: Clbg = '#dddddd'; break;
      case cloud >= 40 && cloud < 60: Clbg = '#cccccc'; break;
      case cloud >= 60 && cloud < 80: Clbg= '#bbbbbb'; break;
      case cloud >= 80: Clbg = '#aaaaaa';
    }
    return Clbg;
  }

  function wndSpdColour(wndSpd) {
    let Wsp;
    switch (true) {
      case wndSpd < 2: Wsp = '#888'; break;
      case wndSpd >= 2 && wndSpd < 5: Wsp = '#555'; break;
      case wndSpd >= 5 && wndSpd < 7: Wsp = '#333'; break;
      case wndSpd >= 7 && wndSpd < 9: Wsp = '#b3b300'; break;
      case wndSpd >= 9 && wndSpd < 12: Wsp = '#ff9900'; break;
      case wndSpd >= 12 && wndSpd < 14: Wsp = '#b36b00'; break;
      case wndSpd >= 14 && wndSpd < 17: Wsp = '#ff5050'; break;
      case wndSpd >= 17 && wndSpd < 20: Wsp = '#e60000'; break;
      case wndSpd >= 20 && wndSpd < 25: Wsp = '#800000;font-weight:bold'; break;
      case wndSpd >= 25: Wsp = '#ff0000;font-weight:bold';
    }
    return Wsp;
  }

  function get_wnd_dir(wnd) {
    let wndDir = wnd;
    switch (true) {
      case (wndDir <= 11):  wndDir = 'N'; break;
      case (wndDir > 11 && wndDir <= 33): wndDir = 'NNE'; break;
      case (wndDir > 33 && wndDir <= 56):  wndDir = 'NE'; break;
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

  function convertSpd(spd) {
    let s;
    if (units.speed === 'kt') {
      s = spd * 1.944;
    } else if (units.speed == 'mph') {
      s = spd * 2.236936;
    } else if (units.speed === 'Bf') {
      s = (spd / 0.836) ** (2 / 3)
    }
    return s;
  }

  function convertTemp(temp) {
    let t;
    if (units.temp === 'F') {
      t = ((temp * 1.8) + 32);
    }
    else {
      t = temp;
    }
    return t;
  }

  function initWidget(data) {

    let sunrise = new Date(data.city.sunrise * 1000);
    let sunset = new Date(data.city.sunset * 1000);
    sunrise = new Date(sunrise);
    const sunriseHour = sunrise.getHours().toString().padStart(2, 0);
    sunset = new Date(sunset);
    const sunsetHour = sunset.getHours().toString().padStart(2, 0);

    for (let i = 0; i < 40; i++) {
      let time = data.list[i].dt * 1000;
      const temp = convertTemp(data.list[i].main.temp - 273.15).toFixed(1);
      const tbg = tempColour(data.list[i].main.temp -273.15);

      const symbol = data.list[i].weather[0].icon;
      const cond = data.list[i].weather[0].description;
      let cloud = data.list[i].clouds.all;
      const wndSpd = convertSpd(data.list[i].wind.speed).toFixed(0);
      const wsp = wndSpdColour(data.list[i].wind.speed);
      let gust;
      if (data.list[i].wind.gust) {
        gust = data.list[i].wind.gust;
        gust = '/' + convertSpd(gust).toFixed(0);
      } else {
        gust = '';
      }
      let wndDir = get_wnd_dir(data.list[i].wind.deg);
      let prs = data.list[i].main.pressure;
      let rain;
      if (data.list[i]['rain']) {
        rain = data.list[i]['rain']['3h'].toFixed(1);
      } else rain = '0';

      if (rain > 0) {
        rain = `<b>${rain}mm</b>`;
      } else {
        rain = '0mm';
      }

      time = new Date(time);
      const ftime = time.getHours().toString().padStart(2, 0);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];
      const day = days[time.getDay()];

      const dn = dayNight(Number(sunriseHour), Number(sunsetHour), ftime);
      let dnColour;
      if (dn === '-d') dnColour = 'style="background-color:#fff"';
      else if (dn === '-n') dnColour = 'style="background-color:#ddd"';

      document.getElementById('forecast').innerHTML +=
        `<tr class="forecast"${dnColour}><td><strong>${day} ${ftime}h</strong></td>
             <td style="padding-right:3px;color:${tbg}"><strong>${temp}&deg;${units.temp}</strong></td>
             <td><image src="PNG/${symbol}.png" alt="${cond}" width="30" height="30"></td>
             <td style="font-variant:small-caps;">${cond}</td><td>${rain}</td>
             <td style="background-color: ${cloudColour(cloud)}">${cloud}&percnt;</td><td style="color:${wsp}">${wndSpd}${gust}${units.speed}</td><td>${wndDir}</td><td>${prs}mb</td></tr>`;
    }
  }

  const vars = JSON.parse(localStorage.getItem('vars'));
  const units = JSON.parse(localStorage.getItem('units'));

  const { lat } = vars;
  const { lon } = vars;
  const { place } = vars;

  document.getElementById('container').innerHTML = 
    `<table>
      <thead>
        <tr><td colspan="3"><button class="back_button" onclick="history.back()">Go back</button></td>
          <td colspan="6"><h3>5 day forecast for ${place}</h3></td></tr>
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
      <tbody id="forecast">`;

  document.getElementById('container').innerHTML += 
    `</tbody>
   </table>`

  if (lat && lon && appid) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Network error'), 5000);
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${appid}`,
      { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response not ok: ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => initWidget(result))
      .catch(err => alert(`Error: ${err}`))
  }
}

const fiveDays = new FiveDays();
