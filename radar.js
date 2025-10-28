'use strict';

(function Radar() {
    const vars = JSON.parse(localStorage.getItem('vars'));
    const { lat, lon } = vars;
    let data = {};
    let radarOrSat = 'radar';
    const radarLayer = [];
    const satLayer = [];
    let mapLayer = null;// Will refer to either radarLayer or satLayer
    let currentFrame = 0;
    let ts = '';
    let frame = null;
    let colors = 0;
    let smooth = 0;
    let snow = 0;
    let animation = 0;
    const playBtn = document.getElementById('play');

    document.getElementById('radar').addEventListener('click', e => setRadarOrSat(e));
    document.getElementById('satellite').addEventListener('click', e => setRadarOrSat(e));
    document.getElementById('prevFrame').addEventListener('click', e => nextButton(e));
    document.getElementById('nextFrame').addEventListener('click', e => nextButton(e));
    playBtn.addEventListener('click', playStop);

    const map = L.map('mapid', { maxZoom: 10, zoomControl: false}).setView([lat, lon], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | Radar data &copy; <a href="https://rainviewer.com">RainViewer</a>'
    }).addTo(map);
    const mark = new L.CircleMarker([lat, lon]).addTo(map);
    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);

    callApi();

    function setRadarOrSat(e) {
        radarOrSat = e.target.id;
        createRadarLayer();
        animation = 0;
    }

    function nextButton(e) {
        let next = 0;
        e.target.id === 'nextFrame' ? next = 1 : next = -1;
        changeFrame(next);
    }

    function changeFrame(next) {
        currentFrame += next;
        if (currentFrame > frame.length-1) currentFrame -= 1;
        if (currentFrame < 0) currentFrame += 1;
        renderLayer(currentFrame);
        animation = 0;
    }

    function playStop() {
        if (animation) {
            clearTimeout(animation);
            animation = 0;
            document.getElementById('play').value = '>>';
        }
        else {
            if (currentFrame >= mapLayer.length - 1) {
                currentFrame = 0;
                for (let i = mapLayer.length - 1; i >= 0; i--) {
                    renderLayer(i);
                }
            }
            for (let i = currentFrame; i < mapLayer.length; i++) {
                mapLayer[i].addTo(map).setOpacity(0);
            }
            animation = 1;
            playAnimation();
        }
    }

    function playAnimation() { 
        if (animation && currentFrame < mapLayer.length) {
            playBtn.value = '||';
            mapLayer[currentFrame].setOpacity(0.7);
            displayTime(frame[currentFrame].time);
            if (mapLayer[currentFrame - 1]) map.removeLayer(mapLayer[currentFrame - 1]);
            currentFrame += 1;
            animation = setTimeout(() => playAnimation(), 1000);
            // Detect anination end
            if (currentFrame === mapLayer.length) {
                animation = 0;
                playBtn.value = '>>';
            }
        }
    }

    function displayTime(t) {
        const timeStamp = new Date(t * 1000);
        ts = `${timeStamp.getHours().toString().padStart(2, '0')}:${timeStamp.getMinutes().toString().padStart(2, '0')}`
        document.getElementById('time').innerHTML = `Frame time: ${ts}`;
    }

    function createRadarLayer() {
        if (radarOrSat === 'radar') {
            mapLayer = radarLayer;
            frame = data.radar.past;
            colors = 8;
            smooth = 1;
            snow = 1;
            currentFrame = frame.length - 1;
        }
        else {
            mapLayer = satLayer;
            frame = data.satellite.infrared;
            colors = 0;
            smooth = 0;
            snow = 0;
            currentFrame = frame.length - 1;
        }
        renderLayer(currentFrame);
    }

    function renderLayer(newFrame) { 
        radarLayer.forEach(layer => map.removeLayer(layer));
        satLayer.forEach(layer => map.removeLayer(layer));
        if (frame[newFrame]) {                                              
            if (!mapLayer[newFrame]) {
                mapLayer[newFrame] = 
                    new L.TileLayer(`${data.host}${frame[newFrame].path}/256/{z}/{x}/{y}/${colors}/${smooth}_${snow}.png`,
                        {
                            tileSize: 256,
                            opacity: 0.7
                        });
            };
            map.addLayer(mapLayer[newFrame]);
            displayTime(frame[newFrame].time);                
        }
    }

    function callApi() {
        //displayLoading();
        fetch(`https://api.rainviewer.com/public/weather-maps.json`)
            .then(response => {
                //hideLoading();
                if (!response.ok) {
                    throw new Error(`Network response not ok: ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                data = result;
                createRadarLayer();
            })
        .catch(err => alert(`Error: ${err}`));
    }
})()
