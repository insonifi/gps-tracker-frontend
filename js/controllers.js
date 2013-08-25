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
    var now,
        tripIdx,
        length,
        parking_time = 300 * 1000,
        init_vars = function () {
            now = (new Date()).valueOf();
            tripIdx = 0;
            length = 0;
            $scope.trips = [];
            $scope.trips[tripIdx] = [];
            $scope.trips[tripIdx].start = 0;
            $scope.trips[tripIdx].end = 0;
            $scope.waypoints = [];
            $scope.start = now;
            $scope.end = now;
        };
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
    /* Initialise variables */
    init_vars();
    $scope.notReceiving = true;
    /* Query waypoints */
    socket.on('query-waypoint', function (waypoint) {
        if($scope.notReceiving) {
            init()
            $scope.notReceiving = false;
        }
        /* Receive waypoint */
        $scope.start = Math.min(waypoint.timestamp, $scope.start);
        $scope.end = Math.max(waypoint.timestamp, $scope.end);
        waypoint.timestamp = new Date(waypoint.timestamp); /* convert to date */
        waypoint.show_address = false;
        waypoint.address = null;
        $scope.waypoints.push(waypoint);
        
        /* Detect trip */
        if (waypoint.timestamp - $scope.trips[tripIdx].end > parking_time) {
            tripIdx += 1;
            $scope.trips[tripIdx].start = waypoint.timestamp;
            length = $scope.trips[tripIdx].length - 1;
        }
        if ($scope.trips[tripIdx][length].lat !== waypoint.lat &&
            $scope.trips[tripIdx][length].lng !== waypoint.lng) {
            
            $scope.trips[tripIdx].push({
                lat: waypoint.lat,
                lng: waypoint.long,
            });
            $scope.trips[tripIdx].end = waypoint.timestamp;
            length = $scope.trips[tripIdx].length - 1;
        }
    });
    socket.on('query-end', function (count) {
      console.log('Found', count, 'waypoints');
      $scope.notReceiving = true;
      $scope.$broadcast('refresh-lists');
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