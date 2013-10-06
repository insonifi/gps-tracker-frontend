'use strict';

/* Controllers */
angular.module('core.controllers', [])
    .controller('queryCtrl', ['$scope', '$rootScope', 'cnxn', function ($scope, $root, cnxn) {
        $scope.end_date = new Date();
        $scope.start_date = new Date($scope.end_date - 1000 * 3600 * 24);
        $scope.list = [];
        $scope.$on('modulelist', function (e, list) {
            $scope.list = list;    
        });
        $scope.sendQueryRequest = function () {
            var start_date = $scope.start_date,
                end_date = $scope.end_date,
                module_id = $scope.module.module_id,
                chunk_size = 10000;
            /* init vars */
            $root.waypoints = [];
            $root.trips = [];
            if (!$scope.module) {
                $root.message('no module selected');
                return;
            }
            $root.$broadcast('msg', 'Searching between', start_date.toLocaleString(), '...', end_date.toLocaleString(), 'for module', module_id, true);
            cnxn.queryPeriod(module_id, start_date, end_date, chunk_size);
        }
        $scope.resetVars = function () {
            $root.waypoints = [];
            $root.trips = [];
            $root.$digest();
            $root.$broadcast('refresh-trips');
            $root.$broadcast('refresh-waypoints');
        }
    }])
    .controller('mapCtrl', ['$scope', '$rootScope' ,'cnxn' , function ($scope, $root, cnxn) {
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
        /* Got realtime waypoint */
        $scope.$on('update-waypoint', function (waypoint) {
            $scope.markers[waypoint.module_id] = waypoint;
            $scope.$digest();
        });
        /* waypoint is selected in grid */
        $scope.$on('select-waypoint', function(event, waypoint) {
            $scope.markers['selected'] = waypoint;
            $scope.request = cnxn.requestAddress(waypoint).then(function(address) {
                var m = $scope.markers['selected'];
                m.message = 
                    + new Date(m.timestamp).toTimeString().slice(0,8) + ': '
                    + address + '  (' + m.kph + ' km/h)';
                $scope.markers['selected'].focus = true;
                console.log('got', address);
            });
        });
        /* show path from grid */
        $scope.$on('select-path', function (event, path) {
            $scope.paths['selected'].latlngs = path;
            $scope.$digest();
        });
    }])