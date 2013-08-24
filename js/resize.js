
window.onresize = function () {
    var container = document.querySelector('.leaflet-container');
    // document.body.style.width = window.innerWidth + 'px';
    // document.body.style.height = window.innerHeight + 'px';
    container.style.width = (window.innerWidth - 30) + 'px';
    container.style.height = (window.innerHeight - 20) + 'px';
}