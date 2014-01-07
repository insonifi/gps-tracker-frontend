'use strict';

/* Controllers */
angular.module('core.controllers', [])
    .controller('queryCtrl', ['$scope', '$rootScope', 'cnxn', function ($scope, $root, cnxn) {
        $scope.end_date = new Date();
        $scope.start_date = new Date($scope.end_date - 1000 * 3600 * 24);
        $scope.end = $scope.end_date;
        $scope.start = $scope.start_date;
        $scope.dtOptions = {
            format: 'dd.MM.yy HH:mm',
            parseFormats: ['dd.MM.yy', 'HH:mm'],
            timeFormat: 'HH:mm'
        }
        $scope.list = [{name: 'no modules', module_id: null}];
        $scope.module_id = null;
        $scope.$on('modulelist', function (e, list) {
            $scope.list = list;    
            /* add description as first item */
            $scope.list.unshift({name: 'select module', module_id: null});
        });
        $scope.$watch('start', function (newValue, oldValue) {
            if (newValue instanceof Date) {
                $scope.start_date = newValue;
            }
        });
        $scope.$watch('end', function (newValue, oldValue) {
            if (newValue instanceof Date) {
                $scope.end_date = newValue;
            }
        });
        $scope.sendQueryRequest = function () {
            var start_date = $scope.start_date,
                end_date = $scope.end_date,
                module_id = $scope.module_id,
                chunk_size = 10000;
            /* init vars */
            $scope.resetVars();
            if (!module_id) {
                $root.message('no module selected');
                return;
            }
            $root.message('Find', module_id, 'between', $scope.start_date.toLocaleString(), '...', $scope.end_date.toLocaleString());
            cnxn.queryPeriod(module_id, start_date.valueOf(), end_date.valueOf(), chunk_size);
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
            var hash = 0xa2d3e8,
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
            maxbounds: {},
            defaults: {
                doubleClickZoom: false,
                maxZoom: 18
            },
            zoomControl: false
        });
        /* Got realtime waypoint */
        $scope.$on('update-waypoint', function (event, waypoint) {
            var tail = 10,
                coords = {
                    lat: waypoint.lat,
                    lng: waypoint.lng
                };
            if (!$scope.paths[waypoint.module_id]) {
                $scope.paths[waypoint.module_id] = {
                    weight: 3,
                    opacity: 0.8,
                    color: $scope.hashColorCode(waypoint.module_id),
                    latlngs: []
                };
            }
            $scope.markers[waypoint.module_id] = coords;
            $scope.paths[waypoint.module_id].latlngs.unshift(coords);
            $scope.paths[waypoint.module_id].latlngs = $scope.paths[waypoint.module_id].latlngs.slice(0, tail);
            $scope.$digest();
        });
        /* waypoint is selected in grid */
        $root.$watch('selected_waypoint', function (newValue, oldValue) {
            var waypoint = newValue,
                setAddress = function(address) {
                    var m = $scope.markers['selected'];
                    m.label = {
                        message: new Date(m.timestamp).toTimeString().slice(0,8) + ': '
                        + address + ', ' + m.kph + ' km/h',
                    };
                    $scope.markers['selected'].focus = true;
                    console.log('got', address);
                    $scope.$digest();
                };
            if (newValue !== oldValue) {
                if (waypoint === null) {
                    $scope.markers['selected'] = {};
                } else {
                    $scope.markers['selected'] = waypoint;
                    if (waypoint.address === null) {
                        $scope.request = cnxn.requestAddress(waypoint).then(setAddress);
                        angular.extend($scope.markers['selected'], {
                            icon: L.icon({
                                iconUrl: 'markers/active32.png',
                                iconSize: [32, 48],
                                iconAnchor: [16, -48],
                                popupAnchor: [0, -48],
                                shadowSize: [32, 10],
                                shadowAnchor: [6, -10]
                            })
                        });
                    } else {
                        setAddress(waypoint.address);
                    }
                }
            }
        });
        /* show path from grid */
        $root.$watch('selected_path', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.paths['selected'].latlngs = newValue;
                $scope.maxbounds = [newValue[0], newValue[newValue.length - 1]];
            }
        });
        $root.$watch('waypoints_range', function (newValue, oldValue) {
            if (newValue !== undefined && newValue.length > 0) {
                $scope.markers['start'] = newValue[0];
                angular.extend($scope.markers['start'], {
                    icon: L.icon({
                        iconUrl: 'markers/start32.png',
                        iconSize: [32, 48],
                        iconAnchor: [16, -48],
                        popupAnchor: [0, -48],
                        shadowSize: [32, 10],
                        shadowAnchor: [6, -10]
                    })
                });
                $scope.markers['end'] = newValue[newValue.length - 1];
                angular.extend($scope.markers['end'], {
                    icon: L.icon({
                        iconUrl: 'markers/end32.png',
                        iconSize: [32, 48],
                        iconAnchor: [16, -48],
                        popupAnchor: [0, -48],
                        shadowSize: [32, 10],
                        shadowAnchor: [6, -10]
                    })
                });
            } else {
                $scope.markers = {};
            }
        })
    }])