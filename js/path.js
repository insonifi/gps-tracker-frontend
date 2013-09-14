onmessage = function (event) {
    postMessage(event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    }));
}