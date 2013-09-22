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
        addressA: toMyString(waypoints[0].timestamp),
        addressB: toMyString(waypoints[length - 1].timestamp),
        start: waypoints[0].timestamp,
        end: waypoints[length - 1].timestamp,
        distance: 0
    })
    /* iterate trough waypoints */
    for (i = 0; i < length; i += 1) {
        previous = current || waypoints[i].timestamp;
        current = waypoints[i].timestamp;
        previous_coords = current_coords || [waypoints[i].lat, waypoints[i].long];
        current_coords = [waypoints[i].lat, waypoints[i].long];
        if (current - previous > parking_time) { /* assume next trip of time gap exceeds parking time */
            if (trips[trip_idx].end === trips[trip_idx].start) {
                continue;
            }
            trips[trip_idx].end = previous;
            trips[trip_idx].addressB = current.toMyString();
            trips[trip_idx].distance += calculateDistance(previous_coords, current_coords);
            trips[0].distance += trips[trip_idx].distance;
            trip_idx += 1;
        }
        if (!trips[trip_idx]) {
            trips[trip_idx] = {
                start: current,
                end: 0,
                addressA: toMyString(current),
                distance: 0
            };
        }
    }
    /* Append last waypoint */
    trips[trip_idx].end = current;
    trips[trip_idx].addressB = toMyString(current);
    trips[trip_idx].distance += calculateDistance(previous_coords, current_coords);
    trips[0].distance += trips[trip_idx].distance;
    /* set end boundary */
    trips[0].addressB = toMyString(current);
    tripsBuffer = jsonToArrayBuffer(trips);
    self.postMessage(tripsBuffer, [tripsBuffer]);
};