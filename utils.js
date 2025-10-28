export function  getHash() {
  return "7f8871108ffeac097a03c40598d0232f";
}

export function  convertSpd(speed, unit) {
  switch (unit) {
    case 'kt': return speed * 1.944;
    case 'mph': return speed * 2.236936;
    case 'Bf': return (speed / 0.836) ** (2 / 3);
    default: return speed;
  }
}

export function  convertTemp(temp, unit) {
  return unit === 'F' ? (temp * 1.8) + 32 : temp;
}

export function  calcGust(gust, unit) {
  return gust > 0 ? `/${convertSpd(gust, unit).toFixed(0)}` : '';
}

export function  getWndDir(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.floor(((degrees + 11.25) % 360) / 22.5);
  return directions[index];
}

export function  dayNight(sr, ss, h) {
  let dn = '';
  if (sr <= h && h <= ss) { dn = '-d'; } else { dn = '-n'; }
  return dn;
}

export function  tempColour(temp) {
  const ranges = [-Infinity, 0, 5, 10, 15, 20, 25];
  const colors = ['#00ffff', '#3399ff', '#3366cc', '#3319ff', '#ff6600', '#ff0000', '#993300'];
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (temp >= ranges[i]) return colors[i];
  }
}

export function  cloudColour(cloud) {
  const ranges = [0, 20, 40, 60, 80];
  const colors = ['#eeeeee', '#dddddd', '#cccccc', '#bbbbbb', '#aaaaaa'];
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (cloud >= ranges[i]) return colors[i];
  }
}

export function  wndSpdColour(wndSpd) {
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
}
