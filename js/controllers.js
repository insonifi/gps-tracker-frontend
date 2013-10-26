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
            $root.message('Searching between', start_date.toLocaleString(), '...', end_date.toLocaleString(), 'for module', module_id, true);
            cnxn.queryPeriod(module_id, start_date, end_date, chunk_size);
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
            },
        });
        /* Got realtime waypoint */
        $scope.$on('update-waypoint', function (waypoint) {
            var tail = 10;
            $scope.$apply(function () {
                $scope.markers[waypoint.module_id] = waypoint;
                $scope.paths[waypoint.module_id].latlngs.push = waypoint;
                $scope.paths[waypoint.module_id].slice(0, tail);
            })
        });
        /* waypoint is selected in grid */
        $scope.$on('select-waypoint', function(event, waypoint) {
            var setAddress = function(address) {
                    var m = $scope.markers['selected'];
                    m.message = new Date(m.timestamp).toTimeString().slice(0,8) + ': '
                        + address + ', ' + m.kph + ' km/h';
                    $scope.markers['selected'].focus = true;
                    console.log('got', address);
                };
            $scope.markers['selected'] = waypoint;
            if (waypoint.address === null) {
                $scope.request = cnxn.requestAddress(waypoint).then(setAddress);
            } else {
                setAddress(waypoint.address);
            }
        });
        /* show path from grid */
        $scope.$on('select-path', function (event, path) {
            $scope.$apply(function () {
                $scope.paths['selected'].latlngs = path;    
            })
        });
        $scope.$watch('waypoints_range', function (oldValue, newValue) {
            if (newValue !== undefined && newValue.length > 0) {
                $scope.markers['start']= $scope.waypoints_range[0];
                $scope.markers['end']= $scope.waypoints_range[$scope.waypoints_range.length - 1];                
            } else {
                $scope.markers = {};
            }
        })
    }])