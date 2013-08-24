'use strict';

/* Controllers */

angular.module('core.controllers', [])
  .controller('clockCtrl', ['$scope', 'socket',function ($scope, socket) {
    socket.on('clock', function (time) {
      $scope.time = time;
    });
  }])
  .controller('queryCtrl', function ($scope, socket) {
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
      var extractDate = function (str) {
          var re = /(\d+):(\d+)\ (\d+)\.(\d+)\.(\d+)/,//H:mm D.M.YYYYY
            array = re.exec(str);
          return (new Date(array[5], array[4] - 1, array[3], array[1], array[2]));
        },
        start_date = extractDate($scope.start),
        end_date = extractDate($scope.end),
        module_id = $scope.module.module_id;
      
      console.log('[queryCtrl] query %s: from %s to %s', module_id, start_date, end_date);
        socket.emit('query-period', {module_id: module_id, start: start_date.valueOf(), end: end_date.valueOf()});
    }
  })
  .controller('mapCtrl', ['$scope', 'socket', function ($scope, socket) {
    var now = (new Date()).valueOf();
    angular.extend($scope, {
        riga: {
          lat: 56.9496,
          lng: 24.1040,
          zoom: 12
        },
        markers: {},
        defaults: {
            doubleClickZoom: false,
            maxZoom: 18
        }
    });
    /* Query waypoints */
    $scope.waypoints = [];
    $scope.waypoints.min = now
    $scope.waypoints.max = now;
    $scope.notReceiving = true;
    socket.on('query-waypoint', function (waypoint) {
        if($scope.notReceiving) {
            now = (new Date()).valueOf();
            $scope.waypoints = [];
            $scope.waypoints.min = now;
            $scope.waypoints.max = now;
            $scope.notReceiving = false;
        }
        $scope.waypoints.min = Math.min(waypoint.timestamp, $scope.waypoints.min);
        $scope.waypoints.max = Math.max(waypoint.timestamp, $scope.waypoints.max);
        waypoint.timestamp = new Date(waypoint.timestamp); /* convert to date */
        waypoint.show_address = false;
        waypoint.address = null;
        $scope.waypoints.push(waypoint);
    });
    socket.on('query-end', function (count) {
      console.log('Found', count, 'waypoints');
      $scope.start = $scope.waypoints.min;
      $scope.end = $scope.waypoints.max;
      $scope.notReceiving = true;
      $scope.slyWaypoints.reload();
    });
    /* Get address for coordinates */
    $scope.requestAddress = function (coords) {
        socket.emit('get-address', coords);
    };
    socket.on('result-address', function (response) {
        angular.forEach($scope.waypoints, function (index, waypoint) {
            if (waypoint.lat === response.lat
              || waypoint.long === response.long) {
                waypoint.address = response.address;
              }
            });
        });
    }])