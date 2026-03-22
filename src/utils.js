/**
 * Returns the OpenWeatherMap API key.
 * @returns {string} API key for weather data requests
 */
export function getHash() {
  return '7f8871108ffeac097a03c40598d0232f';
}

/**
 * Converts wind speed from m/s to specified unit.
 * @param {number} speed - Wind speed in meters per second (m/s)
 * @param {string} unit - Target unit: 'kt' (knots), 'mph', 'kph', or 'Bf' (Beaufort)
 * @returns {number} Converted wind speed
 */
export function convertSpd(speed, unit) {
  switch (unit) {
    case 'kt': return speed * 1.944;
    case 'mph': return speed * 2.236936;
    case 'kph': return speed * 3.6;
    case 'Bf': return beaufort(speed);
    default: return speed;
  }
}

/**
 * Calculates Beaufort scale from wind speed in m/s.
 * Beaufort scale ranges from 0 to 12.
 * @param {number} speed - Wind speed in meters per second
 * @returns {number} Beaufort scale value (0-12)
 */
function beaufort(speed) {
  let s = speed;
  s = (s / 0.836) ** (2 / 3);
  if (s > 12) {
s = 12;
}

  return s;
}

/**
 * Converts temperature between Celsius and Fahrenheit.
 * @param {number} temp - Temperature in Celsius
 * @param {string} unit - Target unit: 'F' for Fahrenheit, otherwise returns Celsius
 * @returns {number} Converted temperature
 */
export function convertTemp(temp, unit) {
  return unit === 'F' ? (temp * 1.8) + 32 : temp;
}

/**
 * Formats wind gust as a string suffix for display.
 * @param {number} gust - Wind gust speed in m/s
 * @param {string} unit - Unit for conversion (see convertSpd)
 * @returns {string} Formatted gust string (e.g., '/15') or empty string if no gust
 */
export function calcGust(gust, unit) {
  return gust > 0 ? `/${convertSpd(gust, unit).toFixed(0)}` : '';
}

/**
 * Converts wind direction in degrees to compass direction.
 * @param {number} degrees - Wind direction in degrees (0-360)
 * @returns {string} Compass direction (e.g., 'N', 'NE', 'SW')
 */
export function getWndDir(degrees) {
  const directions = ['N',
'NNE',
'NE',
'ENE',
'E',
'ESE',
'SE',
'SSE',
    'S',
'SSW',
'SW',
'WSW',
'W',
'WNW',
'NW',
'NNW'];
  const index = Math.floor(((degrees + 11.25) % 360) / 22.5);
  return directions[index];
}

/**
 * Returns a color based on wind speed for visual indicators.
 * @param {number} wndSpd - Wind speed
 * @returns {string} CSS color value (hex with optional styles, e.g., '#ff0000;font-weight:bold')
 */
export function wndSpdColour(wndSpd) {
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
    '#ff0000;font-weight:bold',
    '#800000;font-weight:bold',
  ];
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (wndSpd >= ranges[i]) {
return colors[i];
}
  }
}

/**
 * Determines whether it is day or night based on hours.
 * @param {number} sunriseHour - Hour of sunrise (0-23)
 * @param {number} sunsetHour - Hour of sunset (0-23)
 * @param {number} currentHour - Current hour (0-23)
 * @returns {string} '-d' for day, '-n' for night
 */
export function dayNight(sunriseHour, sunsetHour, currentHour) {
  if (sunriseHour <= currentHour && currentHour <= sunsetHour) {
    return '-d';
  }

    return '-n';
}

/**
 * Returns a color based on temperature for visual indicators.
 * @param {number} temp - Temperature in Celsius
 * @returns {string} CSS color value in hex format
 */
export function tempColour(temp) {
  const ranges = [-Infinity, 0, 5, 10, 15, 20, 25];
  const colors = ['#00ffff', '#3399ff', '#3366cc', '#3319ff', '#ff6600', '#ff0000', '#993300'];
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (temp >= ranges[i]) {
return colors[i];
}
  }
}

/**
 * Returns a color based on cloud coverage for visual indicators.
 * @param {number} cloud - Cloud coverage percentage (0-100)
 * @returns {string} CSS color value in hex format
 */
export function cloudColour(cloud) {
  const ranges = [0, 20, 40, 60, 80];
  const colors = ['#eeeeee', '#dddddd', '#cccccc', '#bbbbbb', '#aaaaaa'];
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (cloud >= ranges[i]) {
return colors[i];
}
  }
}

/**
 * Displays an error message to the user in the page.
 * @param {string} message - Error message to display
 */
export function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  const container = document.getElementById('container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(errorDiv);
  }
}
