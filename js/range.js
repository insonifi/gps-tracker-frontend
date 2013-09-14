onmessage = function (event) {
    var path = event.data.filter(function (item) {
        return (item.timestamp >= start && item.timestamp <= end);
    })
    postMessage(path);
}