importScripts('distance.js');

function toMyString (timestamp) {
    var timestamp = new Date(timestamp);
    return timestamp.getDate() + '.' 
        + (timestamp.getMonth() + 1) + '. '
        + timestamp.toLocaleTimeString().slice(0,5);
}
/*
function arrayBufferToJSON (buf) {
    return JSON.parse(String.fromCharCode.apply(null, new Uint16Array(buf)));
};
*/
function arrayBufferToJSON (buf) {
    var string = '', i, len, array = new Uint16Array(buf);
    for (i = 0, len = array.length; i< len; i += 1) {
        string += String.fromCharCode(array[i]);
    }
    return JSON.parse(string);
};

function jsonToArrayBuffer (json) {
    var str = JSON.stringify(json),
        buf = new ArrayBuffer(str.length*2), // 2 bytes for each char
        bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

self.onmessage = function (event) {
    var i,
        trip_idx = 1,
        previous = null,
        current = null,
        previous_coords = null,
        current_coords = null,
        parking_time = 300 * 1000, /* 5mins */
        now = (new Date()).valueOf(),
        waypoints = arrayBufferToJSON(event.data),
        trips = [],
        tripsBuffer = new ArrayBuffer(0),
        length = waypoints.length;
    /* set start boundary */
    trips.push({
        time_start: toMyString(waypoints[0].timestamp),
        time_end: toMyString(waypoints[length - 1].timestamp),
        start: waypoints[0].timestamp,
        end: waypoints[length - 1].timestamp,
        w_start: {
            lat: waypoints[0].lat,
            lng: waypoints[0].lng
        },
        w_end: {
            lat: waypoints[length - 1].lat,
            lng: waypoints[length - 1].lng
        },
        distance: 0
    })
    /* iterate through waypoints */
    for (i = 0; i < length; i += 1) {
        previous = current || waypoints[i].timestamp;
        current = waypoints[i].timestamp;
        previous_coords = current_coords || [waypoints[i].lat, waypoints[i].lng];
        current_coords = [waypoints[i].lat, waypoints[i].lng];
        if (current - previous > parking_time) { /* assume next trip of time gap exceeds parking time */
            if (trips[trip_idx].end === trips[trip_idx].start) {
                continue;
            }
            trips[trip_idx].end = previous;
            trips[trip_idx].endIdx = i - 1;
            trips[trip_idx].time_end = toMyString(current);
            trips[trip_idx].w_end = {
                lat: waypoints[i - 1].lat,
                lng: waypoints[i - 1].lng
            };
            trips[trip_idx].distance += calculateDistance(previous_coords, current_coords);
            trips[0].distance += trips[trip_idx].distance;
            trip_idx += 1;
        }
        if (!trips[trip_idx]) {
            trips[trip_idx] = {
                start: current,
                startIdx: i,
                end: 0,
                endIdx: 0,
                time_start: toMyString(current),
                w_start: {
                    lat: waypoints[i].lat,
                    lng: waypoints[i].lng
                },
                w_end: {
                    lat: waypoints[i].lat,
                    lng: waypoints[i].lng
                },
                distance: 0
            };
        }
    }
    /* Append last waypoint */
    trips[trip_idx].end = current;
    trips[trip_idx].endIdx = i - 1;
    trips[trip_idx].time_end = toMyString(current);
    trips[trip_idx].distance += calculateDistance(previous_coords, current_coords);
    trips[trip_idx].w_end = {
        lat: waypoints[i - 1].lat,
        lng: waypoints[i - 1].lng
    };
    trips[0].distance += trips[trip_idx].distance;
    /* return Trips array */
    tripsBuffer = jsonToArrayBuffer(trips);
    self.postMessage(tripsBuffer, [tripsBuffer]);
};