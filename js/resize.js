window.onload = function () {
    var checkInterval = setInterval(function () {
        if (document.readyState === "complete") {
            L.container = document.querySelector('.leaflet-container');
            L.containerScope = angular.element(L.container).scope();
            var scope = L.containerScope;
            scope.$apply(function () {
                scope.map_width = window.innerWidth;
                scope.map_height = window.innerHeight;
            });
            clearInterval(checkInterval);
        }
    }, 100)
}
window.onresize = function () {
    var scope = L.containerScope;
    scope.$apply(function () {
        scope.map_width = window.innerWidth;
        scope.map_height = window.innerHeight;
    });
}