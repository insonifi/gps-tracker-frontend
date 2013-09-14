onmessage = function (event) {
    var start = event.data.start,
        end = event.data.end,
        waypoints = event.data.waypoints;
    postMessage(waypoints.filter(function (item) {
        return (item.timestamp >= start && item.timestamp <= end);
    }));
}