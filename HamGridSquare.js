// import fs from 'fs';
// import LatLon from 'geodesy/latlon-ellipsoidal-vincenty.js';
import LatLon, {
  Dms,
} from 'https://cdn.jsdelivr.net/npm/geodesy@2/latlon-ellipsoidal-vincenty.js';

export default {
  toLatLon: (grid, obj) => {
    // console.log({ grid });

    const returnLatLonConstructor = typeof LatLon === 'function';
    const returnObj = typeof obj === 'object';
    let lat = 0.0;
    let lon = 0.0;
    const aNum = 'a'.charCodeAt(0);
    const numA = 'A'.charCodeAt(0);

    function lat4(g) {
      return 10 * (g.charCodeAt(1) - numA) + parseInt(g.charAt(3)) - 90;
    }

    function lon4(g) {
      return 20 * (g.charCodeAt(0) - numA) + 2 * parseInt(g.charAt(2)) - 180;
    }

    if (grid.length != 4 && grid.length != 6) {
      // console.log('gridSquareToLatLon: grid must be 4 or 6 chars: ' + grid);
      //   return({0,0});
    }

    if (/^[A-X][A-X][0-9][0-9]$/.test(grid)) {
      lat = lat4(grid) + 0.5;
      lon = lon4(grid) + 1;
    } else if (/^[A-X][A-X][0-9][0-9][A-X,a-x][A-X,a-x]$/.test(grid)) {
      lat = lat4(grid) + (1.0 / 60.0) * 2.5 * (grid.charCodeAt(5) - numA + 0.5);
      lon = lon4(grid) + (1.0 / 60.0) * 5 * (grid.charCodeAt(4) - numA + 0.5);
    } else {
      // console.log('gridSquareToLatLon: invalid grid: ' + grid);
      //   return;
    }

    if (returnLatLonConstructor) return new LatLon(lat, lon);
    if (returnObj) {
      obj.lat = lat;
      obj.lon = lon;
      return obj;
    }
    return [lat, lon];
  },

  fromLatLon: (param1, param2) => {
    let lat = -100.0;
    let lon = 0.0;
    let adjLat, adjLon, GLat, GLon, nLat, nLon, gLat, gLon, rLat, rLon;
    const U = 'ABCDEFGHIJKLMNOPQRSTUVWX';
    const L = U.toLowerCase();

    function toNum(x) {
      if (typeof x === 'number') return x;
      if (typeof x === 'string') return parseFloat(x);
      console.log('HamGridSquare -- toNum -- can not convert input: ' + x);
      return NaN;
    }

    if (typeof param1 === 'object') {
      if (param1.length === 2) {
        lat = toNum(param1[0]);
        lon = toNum(param1[1]);
      } else if ('lat' in param1 && 'lon' in param1) {
        lat =
          typeof param1.lat === 'function'
            ? toNum(param1.lat())
            : toNum(param1.lat);
        lon =
          typeof param1.lon === 'function'
            ? toNum(param1.lon())
            : toNum(param1.lon);
      } else if ('latitude' in param1 && 'longitude' in param1) {
        lat =
          typeof param1.latitude === 'function'
            ? toNum(param1.latitude())
            : toNum(param1.latitude);
        lon =
          typeof param1.longitude === 'function'
            ? toNum(param1.longitude())
            : toNum(param1.longitude);
      } else {
        console.log('HamGridSquare -- can not convert object -- ' + param1);
        return { lat: NaN, lon: NaN };
      }
    } else {
      lat = toNum(param1);
      lon = toNum(param2);
    }

    if (isNaN(lat)) {
      console.log('lat is NaN');
      return { lat: NaN, lon: lon };
    }
    if (isNaN(lon)) {
      console.log('lon is NaN');
      return { lat: lat, lon: NaN };
    }
    if (Math.abs(lat) === 90.0) {
      console.log('grid squares invalid at N/S poles');
      return { lat: NaN, lon: lon };
    }
    if (Math.abs(lat) > 90) {
      console.log('invalid latitude: ' + lat);
      return { lat: NaN, lon: lon };
    }
    if (Math.abs(lon) > 180) {
      console.log('invalid longitude: ' + lon);
      return { lat: lat, lon: NaN };
    }
    adjLat = lat + 90;
    adjLon = lon + 180;
    GLat = U[Math.trunc(adjLat / 10)];
    GLon = U[Math.trunc(adjLon / 20)];
    nLat = '' + Math.trunc(adjLat % 10);
    nLon = '' + Math.trunc((adjLon / 2) % 10);
    rLat = (adjLat - Math.trunc(adjLat)) * 60;
    rLon = (adjLon - 2 * Math.trunc(adjLon / 2)) * 60;
    gLat = L[Math.trunc(rLat / 2.5)];
    gLon = L[Math.trunc(rLon / 5)];
    return GLon + GLat + nLon + nLat + gLon + gLat;
  },
};

// if (process.argv.length !== 4) {
//   console.log('Usage: node script.js <logFilePath> <targetQth>');
// } else {
//   const logFilePath = process.argv[2];
//   const targetQth = process.argv[3];

//   const sortedResults = parseAndCalculateDistance(logFilePath, targetQth);

//   for (const result of sortedResults) {
//     console.log(
//       `Operator: ${result.operator}, Operator QTH: ${result.operatorQth}, Rounded Distance: ${result.roundedDistance} km`
//     );
//   }
// }
