onmessage = function (event) {
    var range = [];
    range = event.data.filter(function (item) {
        return (item.timestamp >= start && item.timestamp <= end);
    })
    postMessage(range);
}