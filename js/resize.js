window.onload = function () {
    var checkInterval = setInterval(function () {
        if (document.readyState === "complete") {
            L.container = document.querySelector('.angular-leaflet-map');
            // L.container.style.position = 'absolute';
            L.container.style.width = (window.innerWidth - 30) + 'px';
            L.container.style.height = (window.innerHeight - 20) + 'px';
            clearInterval(checkInterval);
        }
    }, 100)
}
window.onresize = function () {
    L.container.style.width = (window.innerWidth - 30) + 'px';
    L.container.style.height = (window.innerHeight - 20) + 'px';
}