onmessage = function (event) {
    var range = [];
    console.log('[range] process', event.data.length, 'waypoints');
    event.data.filter(function (item) {
        return (item.timestamp >= start && item.timestamp <= end);
    })
    console.log('[range] done');
    postMessage(range);
}