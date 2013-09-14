onmessage = function (event) {
    postMessage(event.data.filter(function (item) {
        return (item.timestamp >= start && item.timestamp <= end);
    }));
}