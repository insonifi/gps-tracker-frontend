onmessage = function (event) {
    return event.data.filter(function (item) {
        return (item.timestamp >= start && item.timestamp <= end);
    })
}