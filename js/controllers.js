'use strict';

/* Controllers */

angular.module('core.controllers', [])
    .controller('queryCtrl', ['$scope', '$rootScope', 'socket', function ($scope, $root, socket) {
        $scope.end_date = new Date();
        $scope.start_date = new Date($scope.end_date - 1000 * 3600 * 24);
        socket.on('connect', function () {
          socket.emit('get-modulelist');
        });
        socket.on('modulelist', function (list) {
          $scope.list = list;
        })
        $scope.sendQueryRequest = function () {
            if (!$scope.module) {
                $root.message('no module selected');
                return;
            }
            var start_date = $scope.start_date,
                end_date = $scope.end_date,
                module_id = $scope.module.module_id;
            
            $root.message('Searching between', start_date.toLocaleString(), '...', end_date.toLocaleString(), 'for module', module_id);
            socket.emit('query-period', {module_id: module_id, start: start_date.valueOf(), end: end_date.valueOf(), type: 'complete'});
        }
    }])
    .controller('mapCtrl', ['$scope', '$rootScope', 'socket', function ($scope, $root, socket) {
        var now,
            init_vars = function () {
                now = (new Date()).valueOf();
                $scope.waypoints = [];
                $scope.trips = [];
            },
            detect_trips = new Worker('js/detect_trips.js'),
            waypointsBuffer = new ArrayBuffer(0),
            arrayBufferToJSON = function (buf) {
                return JSON.parse(String.fromCharCode.apply(null, new Uint16Array(buf)));
            },
            jsonToArrayBuffer = function (json) {
                var str = JSON.stringify(json),
                    buf = new ArrayBuffer(str.length*2), // 2 bytes for each char
                    bufView = new Uint16Array(buf);
                for (var i=0, strLen=str.length; i<strLen; i++) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            };
            
        angular.extend($scope, {
            riga: {
              lat: 56.9496,
              lng: 24.1040,
              zoom: 12
            },
            markers: {},
            paths: {},
            defaults: {
                doubleClickZoom: false,
                maxZoom: 18
            }
        });
        /* Initialise variables */
        init_vars();
        $scope.notReceiving = true;
        /* Query waypoints */
        socket.on('query-waypoint', function (waypoint) {
            if($scope.notReceiving) {
                $root.message('Receiving...');
                init_vars()
                $scope.notReceiving = false;
            }
            /* Receive waypoint */
            waypoint.timestamp = new Date(waypoint.timestamp); /* convert to date */
            waypoint.time = waypoint.timestamp.toLocaleTimeString();
            waypoint.show_address = false;
            waypoint.address = null;
            $scope.waypoints.push(waypoint);
        });
        socket.on('query-end', function (response) {
            $root.message('Found', response.count, 'waypoints');
            $scope.notReceiving = true;
            if (response.count === 0) { return; }
            /* Sort waypoints */
            response.result.sort(function (a, b) {
                if (a.timestamp > b.timestamp) {
                    return 1;
                }
                if (a.timestamp < b.timestamp) {
                    return -1;
                }
                return 0;
            });
            waypointsBuffer = jsonToArrayBuffer(response.result);
            /* Detect trip */
            $root.message('Calculating...');
            detect_trips.postMessage(waypointsBuffer, [waypointsBuffer]);
            detect_trips.onmessage = function (event) {
                $scope.trips = arrayBufferToJSON(event.data);
                $root.message('Detected', $scope.trips.length - 1, 'trips');
                $scope.$digest(); /* make sure model is updated */
                $scope.$broadcast('refresh-trips');
            }
        });
        /* Get address for coordinates */
        $scope.requestAddress = function (coords) {
            socket.emit('get-address', coords);
        };
        socket.on('update-waypoint', function (waypoint) {
            $scope.markers[waypoint.module_id] = {
                lat: waypoint.lat,
                lng: waypoint.long
            }
        });
        socket.on('result-address', function (response) {
            (function () {
                var index = 0,
                    len = $scope.waypoints.length,
                    waypoint = null;

                for (index = 0; index < len; index += 1) {
                    waypoint = $scope.waypoints[index];
                    if (waypoint.lat === response.lat
                        || waypoint.long === response.long) {
                        waypoint.address = response.address;
                    }
                }
                $scope.$broadcast('result-address', response.address);
            }) ()
        });
    }])