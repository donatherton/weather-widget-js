/* On 2-2-2026 RainViewer removed satellite layers and restricted radar to
 * one colour scheme and max zoom 7. I'll keep the code for these for now
 * for possible re-use later */
'use strict';

/**
 * Radar widget object for displaying weather radar animation on a map.
 * @namespace Radar
 */
const Radar = {
  vars: null,
  data: {},
  radarOrSat: 'radar',
  radarLayer: [],
  satLayer: [],
  mapLayer: null,
  currentFrame: 0,
  ts: '',
  frame: null,
  colors: 0,
  smooth: 0,
  snow: 0,
  animation: 0,
  playBtn: document.getElementById('play'),
  map: null,
  rainviewerApiUrl: 'https://api.rainviewer.com/public/weather-maps.json',
  osmTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  /**
   * Initializes the radar widget by setting up event listeners,
   * creating the map, and fetching radar data.
   */
  init() {
    this.vars = this.loadVars();
    // document.getElementById('radar').addEventListener('click', e => this.setRadarOrSat(e));
    // document.getElementById('satellite').addEventListener('click', e => this.setRadarOrSat(e));
    document.getElementById('prevFrame').addEventListener('click', e => this.nextButton(e));
    document.getElementById('nextFrame').addEventListener('click', e => this.nextButton(e));
    this.playBtn.addEventListener('click', e => this.playStop(e));
    this.createMap();
    this.callApi();
  },

  /**
   * Displays an error message to the user in the page.
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    const container = document.getElementById('controls');
    if (container) {
      container.innerHTML = '';
      container.appendChild(errorDiv);
    }
  },

  /**
   * Loads and parses location variables from localStorage with fallback.
   * @returns {Object} Location variables with lat, lon, and place
   */
  loadVars() {
    try {
      return JSON.parse(localStorage.getItem('vars'));
    } catch {
      return { lat: 51.5, lon: 0, place: 'London' };
    }
  },

  /**
   * Handles radar/satellite toggle selection.
   * @param {Event} e - Click event from radio button
   */
  // setRadarOrSat(e) {
  //   this.radarOrSat = e.target.id;
  //   this.createRadarLayer();
  //   this.animation = 0;
  //   document.getElementById('play').value = '>>';
  // },

  /**
   * Creates the Leaflet map centered on the stored location.
   */
  createMap() {
    this.map = L.map('mapid', { maxZoom: 7, zoomControl: false}).setView([this.vars.lat, this.vars.lon], 7);
    L.tileLayer(this.osmTileUrl, {
      attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | Radar data &copy; <a href="https://rainviewer.com">RainViewer</a>'
    }).addTo(this.map);
    new L.CircleMarker([this.vars.lat, this.vars.lon]).addTo(this.map);
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);
  },

  /**
   * Handles frame navigation button clicks.
   * @param {Event} e - Click event from prev/next button
   */
  nextButton(e) {
    const next = e.target.id === 'nextFrame' ? 1 : -1;
    this.changeFrame(next);
  },

  /**
   * Changes the current radar frame by the specified offset.
   * @param {number} next - Frame offset (1 for next, -1 for previous)
   */
  changeFrame(next) {
    this.currentFrame += next;
    if (this.currentFrame > this.frame.length - 1) {
      this.currentFrame -= 1;
    }
    if (this.currentFrame < 0) {
      this.currentFrame += 1;
    }
    this.renderLayer(this.currentFrame);
    this.animation = 0;
  },

  /**
   * Toggles between play and stop states for radar animation.
   */
  playStop() {
    if (this.animation) {
      clearTimeout(this.animation);
      this.animation = 0;
      document.getElementById('play').value = '>>';
    } else {
      if (this.currentFrame >= this.mapLayer.length - 1) {
        this.currentFrame = 0;
        for (let i = this.mapLayer.length - 1; i >= 0; i--) {
          this.renderLayer(i);
        }
      }
      for (let i = this.currentFrame; i < this.mapLayer.length; i++) {
        this.mapLayer[i].addTo(this.map).setOpacity(0);
      }

      this.animation = 1;
      this.playAnimation();
    }
  },

  /**
   * Recursively plays the radar animation frame by frame.
   */
  playAnimation() {
    if (this.animation && this.currentFrame < this.mapLayer.length) {
      this.playBtn.value = '| |';
      this.mapLayer[this.currentFrame].setOpacity(0.7);
      this.displayTime(this.frame[this.currentFrame].time);
      if (this.mapLayer[this.currentFrame - 1]) {
        this.map.removeLayer(this.mapLayer[this.currentFrame - 1]);
      }
      this.currentFrame += 1;
      this.animation = setTimeout(() => this.playAnimation(), 1000);
      if (this.currentFrame === this.mapLayer.length) {
        this.animation = 0;
        this.playBtn.value = '>>';
      }
    }
  },

  /**
   * Updates the timestamp display for the current frame.
   * @param {number} t - Unix timestamp in seconds
   */
  displayTime(t) {
    const timeStamp = new Date(t * 1000);
    this.ts = `${timeStamp.getHours().toString().padStart(2, '0')}:${timeStamp.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('time').innerHTML = `Frame time: ${this.ts}`;
  },

  /**
   * Creates the radar or satellite layer based on current mode.
   */
  createRadarLayer() {
    if (this.radarOrSat === 'radar') {
      this.mapLayer = this.radarLayer;
      this.frame = this.data.radar.past;
      this.colors = 8;
      this.smooth = 1;
      this.snow = 1;
      this.currentFrame = this.frame.length - 1;
    } else {
      this.mapLayer = this.satLayer;
      this.frame = this.data.satellite.infrared;
      this.colors = 0;
      this.smooth = 0;
      this.snow = 0;
      this.currentFrame = this.frame.length - 1;
    }

    this.renderLayer(this.currentFrame);
  },

  /**
   * Renders a specific radar frame on the map.
   * @param {number} newFrame - Frame index to render
   */
  renderLayer(newFrame) {
    this.radarLayer.forEach(layer => this.map.removeLayer(layer));
    this.satLayer.forEach(layer => this.map.removeLayer(layer));
    if (this.frame[newFrame]) {
      this.mapLayer[newFrame] ||= new L.TileLayer(`${this.data.host}${this.frame[newFrame].path}/256/{z}/{x}/{y}/${this.colors}/${this.smooth}_${this.snow}.png`,
        {
          tileSize: 256,
          opacity: 0.7,
        }
      );

      this.map.addLayer(this.mapLayer[newFrame]);
      this.displayTime(this.frame[newFrame].time);
    }
  },

  /**
   * Fetches radar data from RainViewer API.
   */
  callApi() {
    fetch(this.rainviewerApiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response not ok: ${response.statusText}`);
        }

        return response.json();
      })
      .then(result => {
        this.data = result;
        this.createRadarLayer();
      })
      .catch(err => this.showError(`Error: ${err}`));
  },
};

Radar.init();
