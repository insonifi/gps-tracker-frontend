window.onload = function () {
    var margin = 24,
    checkInterval = setInterval(function () {
        if (document.readyState === "complete") {
            document.body.style.width = window.innerWidth - margin + 'px';
            document.body.style.height = window.innerHeight - margin + 'px';
            clearInterval(checkInterval);
        }
    }, 100);
}
window.onresize = function () {
    var margin = 24;
    document.body.style.width = window.innerWidth - margin + 'px';
    document.body.style.height = window.innerHeight - margin + 'px';
}