'use strict';

/* Controllers */

angular.module('core.controllers', [])
  .controller('clockCtrl', ['$scope', 'socket',function ($scope, socket) {
    socket.on('clock', function (time) {
      $scope.time = time;
    });
  }])
  .controller('queryCtrl', function ($scope, socket) {
    $scope.start_date = new Date() - 1000 * 3600 * 24;
    $scope.end_date = new Date();
    socket.on('connect', function () {
      socket.emit('get-modulelist');
    });
    socket.on('modulelist', function (list) {
      $scope.list = list;
    })
    $scope.sendQueryRequest = function () {
      if (!$scope.module) {
        console.log('[queryCtrl] no module selected');
        return;
      }
    var start_date = $scope.start_date.
    end_date = $scope.end_date
    module_id = $scope.module.module_id;
      
      console.log('[queryCtrl] query %s: from %s to %s', module_id, start_date, end_date);
        socket.emit('query-period', {module_id: module_id, start: start_date.valueOf(), end: end_date.valueOf()});
    }
  })
  .controller('mapCtrl', ['$scope', 'socket', function ($scope, socket) {
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
        var overall;
        if($scope.notReceiving) {
            init_vars()
            $scope.notReceiving = false;
            $scope.trips[0] = {};
            $scope.trips[0].addressA = 'All';
            $scope.trips[0].addressB = 'waypoints';
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
        console.log('Found', count, 'waypoints');
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
        (function () {
            var i,
                trip_idx = 1,
                previous,
                current,
                now = (new Date()).valueOf(),
                length = $scope.waypoints.length;
            for (i = 0; i < length; i += 1) {
                previous = ($scope.waypoints[i - 1] || $scope.waypoints[i]).timestamp;
                current = $scope.waypoints[i].timestamp;
                if (current - previous > parking_time) {
                    if ($scope.trips[trip_idx].end === $scope.trips[trip_idx].start) {
                        continue;
                    }
                    $scope.trips[trip_idx].end = previous;
                    $scope.trips[trip_idx].addressB = '';
                    trip_idx += 1;
                }
                if (!$scope.trips[trip_idx]) {
                    $scope.trips[trip_idx] = {
                        start: current,
                        end: 0,
                        addressA: 'Trip ' + trip_idx
                    };
                }
            }
            /* Append last waypoint */
            $scope.trips[trip_idx].end = current;
            $scope.trips[trip_idx].addressB = '';
            console.log('Detected', $scope.trips.length - 1, 'trips');
            $scope.$digest();
        }) ();
        $scope.$broadcast('refresh-trips');
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
    }])