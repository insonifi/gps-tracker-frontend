onmessage = function (event) {
    var path = [];
    path = event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    });
    postMessage(path);
}