window.onload = function () {
    var margin = 15,
    checkInterval = setInterval(function () {
        if (document.readyState === "complete") {
            document.body.style.width = window.innerWidth - margin + 'px';
            document.body.style.height = window.innerHeight - margin + 'px';
            clearInterval(checkInterval);
        }
    }, 100);
}
window.onresize = function () {
    var margin = 15;
    document.body.style.width = window.innerWidth - margin + 'px';
    document.body.style.height = window.innerHeight - margin + 'px';
}