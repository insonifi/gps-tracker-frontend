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
            $root.$broadcast('msg', 'Searching between', start_date.toLocaleString(), '...', end_date.toLocaleString(), 'for module', module_id);
            cnxn.queryPeriod(module_id, start_date, end_date, chunk_size);
        }
        $scope.resetVars = function () {
            $root.waypoints = [];
            $root.trips = [];
            $root.$digest();
            $root.$broadcast('refresh-trips');
        }
    }])
    .controller('mapCtrl', ['$scope', '$rootScope', function ($scope, $root) {
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
            //waypoint.message: waypoint.address != '' ? waypoint.address : ;
            $scope.markers['selected'] = waypoint;
            $scope.markers['selected'].message = waypoint.kph;
            $scope.$digest();
        });
        /* show path from grid */
        $scope.$on('select-path', function (event, path) {
            $scope.paths['selected'].latlngs = path;
            $scope.$digest();
        });
        $scope.$on('leafletDirectiveMap.click', function(event, args){
                var event_latlng = args.leafletEvent.latlng;
                console.log('[mapCtrl] find waypoint at',
                    event_latlng.lat.toFixed(6),
                    event_latlng.lng.toFixed(6)
                );
                
                (function () {
                    var tolerance = 0.00015,
                        lat_diff = null,
                        long_diff = null,
                        index = 0,
                        len = $scope.waypoints_range.length,
                        waypoint = null;
                    for (index = 0; index < len; index += 1) {
                        waypoint = $scope.waypoints_range[index];
                        lat_diff = Math.abs(waypoint.lat - event_latlng.lat);
                        long_diff = Math.abs(waypoint.lng - event_latlng.lng);
                        if (lat_diff < tolerance && long_diff < tolerance) {
                            $scope.sly.activate(index);
                            break;
                        }
                    }
                }) ()
            });
    }])