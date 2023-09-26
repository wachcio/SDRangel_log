import HamGridSquare from './HamGridSquare.js';
import LatLon from 'https://cdn.jsdelivr.net/npm/geodesy@2/latlon-ellipsoidal-vincenty.js';
//import L from './node_modules/leaflet/dist/leaflet.js';

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);
const longestQSO = [];

const getCountry = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const country = response.data.address?.country || 'Unknown';
    return country;
  } catch (error) {
    console.error('Error fetching country:', error);
    return 'Unknown';
  }
};

document.getElementById('updateMap').addEventListener('click', async () => {
  longestQSO.length = 0;
  const baseQTH = document.getElementById('baseQTH').value;
  const log = document.getElementById('log').value;

  const startQTH = HamGridSquare.toLatLon(baseQTH);

  const communicationData = await parseAndCalculateDistance(
    log,
    startQTH.lat,
    startQTH.lon
  );

  // Usuwanie istniejących markerów i linii na mapie
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
      map.removeLayer(layer);
    }
  });

  // Tworzenie polilinii od wybranej pozycji do operatora
  const startPoint = new L.latLng(startQTH.lat, startQTH.lon);
  const startPointMarker = L.marker([startQTH.lat, startQTH.lon]).addTo(map);
  startPointMarker.bindPopup(`Base`);

  communicationData.forEach((communication) => {
    // Usunięcie elementów z operatorLat i operatorLon równymi 0

    const operatorLink = `https://www.qrz.com/db/${communication.operator}`;
    const marker = L.marker([
      communication.operatorLat,
      communication.operatorLon,
    ]).addTo(map);

    marker.bindPopup(
      `Operator: <a href="${operatorLink}" target="_blank">${communication.operator}</a><br>Operator QTH: ${communication.operatorQth}<br>Dystans: ${communication.roundedDistance} km<br>Data nasłuchu: ${communication.dateTime},<br>Pasmo: ${communication.band}`
    );

    // Tworzenie punktu końcowego dla linii
    const endPoint = new L.latLng(
      communication.operatorLat,
      communication.operatorLon
    );

    // Obliczanie dystansu geodezyjnego przy użyciu biblioteki geodesy
    const distance = startPoint.distanceTo(endPoint) / 1000; // Dystans w kilometrach

    // Dodawanie polilinii
    const line = L.polyline([startPoint, endPoint], { color: 'red' }).addTo(
      map
    );

    // Dodawanie etykiety z dystansem
    line.bindPopup(`Distance: ${distance.toFixed(2)} km`);

    longestQSO.push(
      `Operator: <a href="${operatorLink}" target="_blank">${
        communication.operator
      }</a><br> Dystans: ${distance.toFixed(2)} km, Kraj: ${
        communication.operatorCountry
      }<br>Data nasłuchu: ${communication.dateTime},<br>Operator QTH: ${
        communication.operatorQth
      },<br>Pasmo: ${communication.band}`
    );
  });

  // Centrowanie mapy na nowych danych
  map.setView([startQTH.lat, startQTH.lon], 6);

  document.getElementById(
    'longestQSO'
  ).innerHTML = `<p>${longestQSO[0]}</p><p>${longestQSO[1]}</p><p>${longestQSO[2]}</p>`;
});

const parseAndCalculateDistance = async (
  log,
  targetCoordsLat,
  targetCoordsLon
) => {
  const lines = log.split('\n');
  let results = [];
  const seenOperators = new Set();

  for (const line of lines) {
    if (line.includes('CQ')) {
      const parts = line.split(' ');
      const dt = parts[0];
      //format 230926_163700
      const y = Number(`20${dt[0]}${dt[1]}`);
      const m = Number(`${dt[2]}${dt[3]}`) - 1;
      const d = Number(`${dt[4]}${dt[5]}`);
      const h = Number(`${dt[7]}${dt[8]}`);
      const mi = Number(`${dt[9]}${dt[10]}`);
      const s = Number(`${dt[11]}${dt[12]}`);
      const dateTime = new Date(y, m, d, h, mi, s).toLocaleString('pl-PL');
      console.log(parts);

      const bandIx = parts.findIndex((element) => element.includes('.'));
      // console.log(bandIx);

      // let band = Number(parts[4].split('.')[0]);
      let band = Number(parts[bandIx].split('.')[0]);
      console.log(band);

      switch (band) {
        case 1:
          band = '160m';
          break;
        case 3:
          band = '80m';
          break;
        case 5:
          band = '60m';
          break;
        case 7:
          band = '40m';
          break;
        case 10:
          band = '30m';
          break;
        case 14:
          band = '20m';
          break;
        case 18:
          band = '17m';
          break;
        case 21:
          band = '15m';
          break;
        case 24:
          band = '12m';
          break;
        case 28:
          band = '10m';
          break;
        case 50:
          band = '6m';
          break;
        case 70:
          band = '4m';
          break;
        case 144:
          band = '2m';
          break;
        case 222:
          band = '1.25m';
          break;
        case 430:
          band = '70cm';

          break;
        default:
          band = '';
      }

      const cqIndex = parts.indexOf('CQ');

      if (cqIndex !== -1 && cqIndex + 2 < parts.length) {
        const operatorQth = parts[parts.length - 1];
        const operatorCoords = HamGridSquare.toLatLon(operatorQth);

        if (!isNaN(operatorCoords.lat) && !isNaN(operatorCoords.lon)) {
          const targetPoint = new LatLon(targetCoordsLat, targetCoordsLon);
          const operatorPoint = new LatLon(
            operatorCoords.lat,
            operatorCoords.lon
          );
          const distance = targetPoint.distanceTo(operatorPoint) / 1000;

          if (!isNaN(distance)) {
            const operator = parts[cqIndex + 1];
            const roundedDistance = Math.round(distance);

            if (!seenOperators.has(operator)) {
              seenOperators.add(operator);
              results.push({
                operator: operator,
                dateTime: dateTime,
                band: band,
                operatorQth: operatorQth,
                operatorLat: operatorCoords.lat,
                operatorLon: operatorCoords.lon,
                // operatorCountry: country,
                roundedDistance: roundedDistance,
              });
            }
          }
        }
      }
    }
  }

  results.sort((a, b) => b.roundedDistance - a.roundedDistance);
  results = results.filter((x) => x.operatorLat !== 0 && x.operatorLon !== 0);

  for (let index = 0; index < 3; index++) {
    // Pobieranie kraju operatora na podstawie współrzędnych
    console.log(results[index]);

    const country = await getCountry(
      results[index].operatorLat,
      results[index].operatorLon
    );

    results[index].operatorCountry = country;
  }

  // console.log(results);

  return results;
};
