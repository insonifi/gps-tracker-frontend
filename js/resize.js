var container = document.querySelector('.leaflet-container');
window.onload = function () {
    container.style.width = (window.innerWidth - 30) + 'px';
    container.style.height = (window.innerHeight - 20) + 'px';
}

window.onresize = function () {
    container.style.width = (window.innerWidth - 30) + 'px';
    container.style.height = (window.innerHeight - 20) + 'px';
}