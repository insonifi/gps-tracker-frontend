var arrayBufferToJSON = function (buf) {
    var string = '', i, len, array = new Uint16Array(buf);
    for (i = 0, len = array.length; i< len; i += 1) {
        string += String.fromCharCode(array[i]);
    }
    return JSON.parse(string);
},
jsonToArrayBuffer = function (json) {
    var str = JSON.stringify(json),
        buf = new ArrayBuffer(str.length*2), // 2 bytes for each char
        bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
},
limit = 200; /* path display limit */

onmessage = function (event) {
    postMessage(jsonToArrayBuffer((arrayBufferToJSON(event.data).map(function (item) {
        return {
            lat: item.lat,
            lng: item.long,
        }
    })).slice(0, limit)));
}