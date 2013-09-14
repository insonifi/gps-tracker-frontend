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
                $root.message('[queryCtrl] no module selected');
                return;
            }
            var start_date = $scope.start_date,
                end_date = $scope.end_date,
                module_id = $scope.module.module_id;
            
            $root.message('Searching between', start_date.toLocaleString(), '...', end_date.toLocaleString(), 'for module', module_id);
            socket.emit('query-period', {module_id: module_id, start: start_date.valueOf(), end: end_date.valueOf()});
        }
    }])
    .controller('mapCtrl', ['$scope', '$rootScope', 'socket', function ($scope, $root, socket) {
        var now,
            trip_idx,
            first,
            last,
            parking_time = 300 * 1000, /* 5mins */
            init_vars = function () {
                now = (new Date()).valueOf();
                trip_idx = 0;
                $scope.waypoints = [];
                $scope.trips = [];
            },
            detect_trips = new Worker('js/detect_trips.js');
        Date.prototype.toMyString = function () {
            return this.getDate() + '.' 
                + this.getMonth() + '. '
                + this.toTimeString().slice(0, 5);
        }
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
            var overall;
            if($scope.notReceiving) {
                init_vars()
                $scope.notReceiving = false;
                $scope.trips[0] = {};
                $scope.trips[0].addressA = '';
                $scope.trips[0].addressB = '';
                $scope.trips[0].start = now;
                $scope.trips[0].end = now;
            }
            /* Receive waypoint */
            overall = $scope.trips[0];
            overall.start = Math.min(waypoint.timestamp, overall.start);
            overall.end = Math.max(waypoint.timestamp, overall.end);
            waypoint.timestamp = new Date(waypoint.timestamp); /* convert to date */
            waypoint.show_address = false;
            waypoint.address = null;
            $scope.waypoints.push(waypoint);
        });
        socket.on('query-end', function (count) {
            $root.message('Found', count, 'waypoints');
            $scope.notReceiving = true;
            /* Sort waypoints */
            $scope.waypoints.sort(function (a, b) {
                if (a.timestamp > b.timestamp) {
                    return 1;
                }
                if (a.timestamp < b.timestamp) {
                    return -1;
                }
                return 0;
            });
            /* Detect trip */
            detect_trips.postMessage($scope.waypoints);
            detect_trips.onmessage = function (event) {
                $scope.trips = event.data;
                $root.message('Detected', $scope.trips.length - 1, 'trips');
                $scope.$broadcast('refresh-trips');
            }
        });
        /* Get address for coordinates */
        $scope.requestAddress = function (coords) {
            socket.emit('get-address', coords);
        };
        socket.on('result-address', function (response) {
            angular.forEach($scope.waypoints, function (waypoint, index) {
                if (waypoint.lat === response.lat
                    || waypoint.long === response.long) {
                    waypoint.address = response.address;
                }
            });
        });
        socket.on('update-waypoint', function (waypoint) {
            $scope.markers[waypoint.module_id] = {
                lat: waypoint.lat,
                lng: waypoint.long
            }
        })
    }])