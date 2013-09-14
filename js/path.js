onmessage = function (event) {
    var path = [],
        limit = 500; /* limit to 500 waypoints */
    path = event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    });
    postMessage(path.slice(0, limit));
}