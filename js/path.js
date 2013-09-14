onmessage = function (event) {
    return event.data.map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    });
}