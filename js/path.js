onmessage = function (event) {
    var range = event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    });
    postMessage(range);
}