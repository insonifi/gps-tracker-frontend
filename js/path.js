onmessage = function (event) {
    var path = [];
    console.log('[path] process', event.data.length, 'waypoints');
    event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    });
    console.log('[path] done');
    postMessage(path);
}