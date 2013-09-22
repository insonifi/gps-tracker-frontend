importScripts('distance.js');

Date.prototype.toMyString = function () {
    return this.getDate() + '.' 
        + (this.getMonth() + 1) + '. '
        + this.toLocaleTimeString().slice(0,5);
}

arrayBufferToJSON = function (buf) {
    return JSON.parse(String.fromCharCode.apply(null, new Uint16Array(buf)));
},
jsonToArrayBuffer = function (json) {
    var str = JSON.stringify(json),
        buf = new ArrayBuffer(str.length*2), // 2 bytes for each char
        bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

onmessage = function (event) {
    var i,
        trip_idx = 1,
        previous = null,
        current = null,
        previous_coords = null,
        current_coords = null,
        parking_time = 300 * 1000, /* 5mins */
        now = (new Date()).valueOf(),
        waypoints = arrayBufferToJSON(waypoints);
        trips = [],
        tripsBuffer = new ArrayBuffer(0),
        length = waypoints.length;
    /* set start boundary */
    trips.push({
        addressA: waypoints[0].timestamp.toMyString(),
        addressB: waypoints[length - 1].timestamp.toMyString(),
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
                addressA: current.toMyString(),
                distance: 0
            };
        }
    }
    /* Append last waypoint */
    trips[trip_idx].end = current;
    trips[trip_idx].addressB = current.toMyString();
    trips[trip_idx].distance += calculateDistance(previous_coords, current_coords);
    trips[0].distance += trips[trip_idx].distance;
    /* set end boundary */
    trips[0].addressB = current.toMyString();
    tripsBuffer = jsonToArrayBuffer(json);
    postMessage(tripsBuffer, [tripsBuffer]);
};