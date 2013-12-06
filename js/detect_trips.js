importScripts('distance.js');

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
        parking_time = 300 * 1000, /* 5mins */
        waypoints = arrayBufferToJSON(event.data),
        trips = [],
        prev_trip,
        trip_idx,
        tripsBuffer = new ArrayBuffer(0),
        length;
    /* set start boundary */
    trips[0]= {
        start: waypoints[0].timestamp,
        end: waypoints[waypoints.length - 1].timestamp,
        distance: 0
    };
    /* iterate through waypoints */
    trips.push({
        start: waypoints[0].timestamp,
        idx_start: 0,
        distance: 0
    });
    trip_idx = 1;
    for (i = 1, length = waypoints.length; i < length; i += 1) {
        if (waypoints[i].timestamp - waypoints[i - 1].timestamp > parking_time) {
            prev_trip = trips[trips.length - 1];
            if (prev_trip.distance === 0) {
                trips.pop();
            }
            prev_trip.end = waypoints[i - 1].timestamp;
            prev_trip.idx_end = i - 1;
            trips.push({
                start: waypoints[i].timestamp,
                idx_start: i,
                distance: 0
            })
            trip_idx = trips.length -1
            trips[0].distance += prev_trip.distance;
        } else {
            /* TODO: don't calculate distance between first waypoint of new trip and last one from previous */
            trips[trip_idx].distance += calculateDistance(
                [waypoints[i].lat,waypoints[i].lng], [waypoints[i - 1].lat, waypoints[i - 1].lng]
            )
        }
    }
    prev_trip = trips[trips.length - 1];
    prev_trip.end = waypoints[i - 1].timestamp;
    prev_trip.idx_end = i - 1;
    trips[0].distance += prev_trip.distance;
    /* return Trips array */
    tripsBuffer = jsonToArrayBuffer(trips);
    self.postMessage(tripsBuffer, [tripsBuffer]);
};