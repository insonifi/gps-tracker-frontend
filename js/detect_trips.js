Date.prototype.toMyString = function () {
    return this.getDate() + '.' 
        + this.getMonth() + '. '
        + this.toTimeString().slice(0, 5);
}
onmessage = function (event) {
    var i,
        trip_idx = 1,
        previous = undefined,
        current = undefined,
        parking_time = 300 * 1000, /* 5mins */
        now = (new Date()).valueOf(),
        trips = [],
        length = event.data.length;
    /* set start boundary */
    trips.push({
        addressA: event.data[0].timestamp.toMyString(),
        addressB: event.data[length - 1].timestamp.toMyString(),
        start: event.data[0].timestamp,
        end: event.data[length - 1].timestamp
    })
    /* iterate trough waypoints */
    for (i = 0; i < length; i += 1) {
        previous = (event.data[i - 1] || event.data[i]).timestamp;
        current = event.data[i].timestamp;
        if (current - previous > parking_time) {
            if (trips[trip_idx].end === trips[trip_idx].start) {
                continue;
            }
            trips[trip_idx].end = previous;
            trips[trip_idx].addressB = current.toMyString();
            trip_idx += 1;
        }
        if (!trips[trip_idx]) {
            trips[trip_idx] = {
                start: current,
                end: 0,
                addressA: current.toMyString()
            };
        }
    }
    /* Append last waypoint */
    trips[trip_idx].end = current;
    trips[trip_idx].addressB = current.toMyString();
    /* set end boundary */
    trips[0].addressB = current.toMyString();
    postMessage(trips);
};