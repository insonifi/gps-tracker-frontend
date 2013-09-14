onmessage = function (event) {
    var path = [],
        limit = 100; /* limit path waypoints */
    path = event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    });
    postMessage(path.slice(0, limit));
}