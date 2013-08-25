window.onload = function () {
    var checkInterval = setInterval(function () {
        if (document.readyState === "complete") {
            document.body.style.width = window.innerWidth;
            document.body.style.height = window.innerHeight;
            clearInterval(checkInterval);
        }
    }, 100)
}
window.onresize = function () {
    document.body.style.width = window.innerWidth;
    document.body.style.height = window.innerHeight;
}