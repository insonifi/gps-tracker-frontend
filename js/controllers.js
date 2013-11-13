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
            $scope.resetVars();
            if (!$scope.module) {
                $root.message('no module selected');
                return;
            }
            $root.message('Find', module_id, 'between', start_date.toLocaleString(), '...', end_date.toLocaleString());
            cnxn.queryPeriod(module_id, start_date, end_date, chunk_size);
        }
    }])
    .controller('mapCtrl', ['$scope', '$rootScope' ,'cnxn' , function ($scope, $root, cnxn) {
        $scope.resetVars = function () {
            $root.waypoints = [];
            $root.waypoints_range = [];
            $root.trips = [];
            if ($scope.markers) {
                $scope.markers.selected = {};
                $scope.markers.start = {};
                $scope.markers.end = {};
            }
            if ($scope.paths) {
                $scope.paths.selected = {};
            }
        };
        $scope.resetVars();
        $scope.hasWaypoints = function () {
            if($root.trips.length === 0) {
                return false;
            } else {
                return true;
            }
        };
        $scope.hashColorCode = function(str) {
            var hash = 0xa2d4e7,
                len = str.length,
                i = 0,
                char = 0;
            if (str.length === 0) return '#' + hash.toString(16);
            for (i = 0; i < len; i += 1) {
                char = str.charCodeAt(i);
                hash += (char * ((i + 1) * hash));
            }
            return '#' + (hash % 0xffffff).toString(16);
        }
        angular.extend($scope, {
            riga: {
              lat: 56.9496,
              lng: 24.1040,
              zoom: 12
            },
            paths: {},
            markers: {},
            defaults: {
                doubleClickZoom: false,
                maxZoom: 18
            },
            zoomControl: false
        });
        /* Got realtime waypoint */
        $scope.$on('update-waypoint', function (event, waypoint) {
            var tail = 10;
            $scope.markers[waypoint.module_id] = waypoint;
            if (!$scope.paths[waypoint.module_id]) {
                $scope.paths[waypoint.module_id] = {
                    weight: 2,
                    opacity: 0.8,
                    color: $scope.hashColorCode(waypoint.module_id),
                    latlngs: []
                };
            }
            $scope.paths[waypoint.module_id].latlngs.unshift(waypoint);
            $scope.paths[waypoint.module_id].latlngs = $scope.paths[waypoint.module_id].latlngs.slice(0, tail);
            /* $scope.$digest(); */
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
            if (waypoint === null) {
                $scope.markers['selected'] = {};
            } else {
                $scope.markers['selected'] = waypoint;
                if (waypoint.address === null) {
                    $scope.request = cnxn.requestAddress(waypoint).then(setAddress);
                } else {
                    setAddress(waypoint.address);
                }
            }
        });
        /* show path from grid */
        $scope.$on('select-path', function (event, path) {
            //if(path) {
                $scope.paths['selected'].latlngs = path;    
                /* $scope.$digest(); */
            //}
        });
        $root.$watch('waypoints_range', function (newValue, oldValue) {
            if (newValue !== undefined && newValue.length > 0) {
                $scope.markers['start']= newValue[0];
                $scope.markers['end']= newValue[newValue.length - 1];                
            } else {
                $scope.markers = {};
            }
        })
    }])