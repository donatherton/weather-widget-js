/* On 2-2-2026 RainViewer removed satellite layers and restricted radar to
 * one colour scheme and max zoom 7. I'll keep the code for these for now
 * for possible re-use later */
'use strict';

const Radar = {
  vars: JSON.parse(localStorage.getItem('vars')),
  data: {},
  radarOrSat: 'radar',
  radarLayer: [],
  satLayer: [],
  mapLayer: null,// Will reference either radarLayer or satLayer
  currentFrame: 0,
  ts: '',
  frame: null,
  colors : 0,
  smooth: 0,
  snow : 0,
  animation: 0,
  playBtn: document.getElementById('play'),
  map: null,

  init() {
    // document.getElementById('radar').addEventListener('click', e => setRadarOrSat(e));
    // document.getElementById('satellite').addEventListener('click', e => setRadarOrSat(e));
    document.getElementById('prevFrame').addEventListener('click', e => this.nextButton(e));
    document.getElementById('nextFrame').addEventListener('click', e => this.nextButton(e));
    this.playBtn.addEventListener('click', this.playStop);
    this.createMap();
    this.callApi();
  },

  createMap() {
    this.map = L.map('mapid', { maxZoom: 7, zoomControl: false}).setView([this.vars.lat, this.vars.lon], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | Radar data &copy; <a href="https://rainviewer.com">RainViewer</a>'
    }).addTo(this.map);
    const mark = new L.CircleMarker([this.vars.lat, this.vars.lon]).addTo(this.map);
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(this.map);
  },

  // function setRadarOrSat(e) {
  //     radarOrSat = e.target.id;
  //     createRadarLayer();
  //     animation = 0;
  //     document.getElementById('play').value = '>>';
  // }

  nextButton(e) {
    let next = 0;
    e.target.id === 'nextFrame' ? next = 1 : next = -1;
    this.changeFrame(next);
  },

  changeFrame(next) {
    this.currentFrame += next;
    if (this.currentFrame > this.frame.length - 1) this.currentFrame -= 1;
    if (this.currentFrame < 0) this.currentFrame += 1;
    this.renderLayer(this.currentFrame);
    this.animation = 0;
  },

  playStop() {
    if (this.animation) {
      clearTimeout(this.animation);
      this.animation = 0;
      document.getElementById('play').value = '>>';
    }
    else {
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

  playAnimation() { 
    if (this.animation && this.currentFrame < this.mapLayer.length) {
      playBtn.value = '| |';
      this.mapLayer[this.currentFrame].setOpacity(0.7);
      displayTime(this.frame[this.currentFrame].time);
      if (this.mapLayer[this.currentFrame - 1]) this.map.removeLayer(this.mapLayer[this.currentFrame - 1]);
      this.currentFrame += 1;
      this.animation = setTimeout(() => this.playAnimation(), 1000);
      // Detect anination end
      if (this.currentFrame === this.mapLayer.length) {
        this.animation = 0;
        playBtn.value = '>>';
      }
    }
  },

  displayTime(t) {
    const timeStamp = new Date(t * 1000);
    this.ts = `${timeStamp.getHours().toString().padStart(2, '0')}:${timeStamp.getMinutes().toString().padStart(2, '0')}`;
    document.getElementById('time').innerHTML = `Frame time: ${this.ts}`;
  },

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

  callApi() {
    //displayLoading();
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(response => {
        //hideLoading();
        if (!response.ok) {
          throw new Error(`Network response not ok: ${response.statusText}`);
        }

        return response.json();
      })
      .then(result => {
        this.data = result;
        this.createRadarLayer();
      })
      .catch(err => alert(`Error: ${err}`));
  },
}

Radar.init();
