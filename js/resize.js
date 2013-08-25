window.onload = function () {
    var checkInterval = setInterval(function () {
        if (document.readyState === "complete") {
            document.body.style.width = window.innerWidth - 25 + 'px';
            document.body.style.height = window.innerHeight - 25 + 'px';
            clearInterval(checkInterval);
        }
    }, 100)
}
window.onresize = function () {
    document.body.style.width = window.innerWidth - 25 + 'px';
    document.body.style.height = window.innerHeight - 25 + 'px';
}