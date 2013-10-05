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
                module_id = $scope.module.module_id,
                chunk_size = 10000;
            
            $root.message('Searching between', start_date.toLocaleString(), '...', end_date.toLocaleString(), 'for module', module_id);
            //init vars
            $root.waypoints = [];
            $root.trips = [];
            socket.emit('query-period', {module_id: module_id, start: start_date.valueOf(), end: end_date.valueOf(), chunks: chunk_size});
        }
        $scope.reset = function () {
            $root.waypoints = [];
            $root.trips = [];
            $root.$digest();
        }
    }])
    .controller('mapCtrl', ['$scope', '$rootScope', 'socket', function ($scope, $root, socket) {
        var detect_trips = new Worker('js/detect_trips.js'),
            arrayBufferToJSON = function (buf) {
                var string = '', i, len, array = new Uint16Array(buf);
                for (i = 0, len = array.length; i< len; i += 1) {
                    string += String.fromCharCode(array[i]);
                }
                return JSON.parse(string);
            },
            jsonToArrayBuffer = function (json) {
                var str = JSON.stringify(json),
                    buf = new ArrayBuffer(str.length*2), // 2 bytes for each char
                    bufView = new Uint16Array(buf);
                for (var i=0, strLen=str.length; i<strLen; i++) {
                    bufView[i] = str.charCodeAt(i);
                }
                return buf;
            },
            receiveWaypoints = function (waypoints) {
                $root.message(waypoints.length);
                $root.waypoints = $root.waypoints.concat(waypoints);
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
        /* Receive waypoints */
        socket.on('query-chunk', function (chunk) {
            receiveWaypoints(chunk);
        });
        socket.on('query-end', function (chunk) {
            var waypointsBuffer = new ArrayBuffer(0);
            receiveWaypoints(chunk);
            $root.message('Found', $root.waypoints.length, 'waypoints');
            /* Sort waypoints */
            $root.waypoints.sort(function (a, b) {
                if (a.timestamp > b.timestamp) {
                    return 1;
                }
                if (a.timestamp < b.timestamp) {
                    return -1;
                }
                return 0;
            });
            waypointsBuffer = jsonToArrayBuffer($root.waypoints);
            /* Detect trip */
            $root.message('Analysing waypoints...');
            detect_trips.postMessage(waypointsBuffer, [waypointsBuffer]);
            detect_trips.onmessage = function (event) {
                $root.trips = arrayBufferToJSON(event.data);
                $root.message('Detected', $root.trips.length - 1, 'trips');
                $root.$digest(); /* make sure model is updated */
                $root.$broadcast('refresh-trips');
            }
        });
        /* Get address for coordinates */
        $scope.requestAddress = function (coords) {
            socket.emit('get-address', coords);
        };
        socket.on('update-waypoint', function (waypoint) {
            $scope.markers[waypoint.module_id] = {
                lat: waypoint.lat,
                lng: waypoint.lng
            }
        });
        socket.on('result-address', function (response) {
            (function () {
                var index = 0,
                    len = $root.waypoints.length,
                    waypoint = null;

                for (index = 0; index < len; index += 1) {
                    waypoint = $root.waypoints[index];
                    if (waypoint.lat === response.lat
                        || waypoint.lng === response.lng) {
                        waypoint.address = response.address;
                    }
                }
                $scope.$broadcast('result-address', response.address);
            }) ()
        });
    }])
/*
    .controller('waypointsListCtrl', ['$scope', '$rootScope', function ($scope, $root) {
        var range = new Worker('js/range.js'),
            arrayBufferToJSON = function (buf) {
                var string = '', i, len, array = new Uint16Array(buf);
                for (i = 0, len = array.length; i< len; i += 1) {
                    string += String.fromCharCode(array[i]);
                }
                return JSON.parse(string);
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
        $scope.waypoints_range = [];
        $scope.waypointsOptions = {
            data: 'waypoints_range',
            columnDefs: [{field:'timestamp', displayName:'time'}],
            tabIndex: 1
        };
            
        $scope.activeItem = -1;
        $scope.$on('refresh-waypoints', function (event, start, end, startIdx, endIdx) {
            var buffer = new ArrayBuffer(0);
            $scope.activeItem = -1;
            $scope.start = start;
            $scope.end = end;
            $scope.paths['selected'] = {
                weight: 3,
                opacity: 0.618
            };
            buffer = jsonToArrayBuffer({
                waypoints: $scope.waypoints,
                start: start,
                end: end
            });
            range.postMessage(buffer, [buffer]);
            range.onmessage = function (event) {
                $scope.waypoints_range = arrayBufferToJSON(event.data);
            }
            $scope.waypoints_range = $scope.waypoints.slice(startIdx, endIdx);
            $scope.paths['selected'].latlngs = $scope.waypoints_range.slice(0, 1200);
            $root.message($scope.paths['selected'].latlngs.length || 0, 'waypoints displayed');
            $scope.$digest();
        });   
        $scope.$on('blur', function (event, index) {
            if (index === -1) { return; }
            $scope.waypoints_range[index].show_address = false; 
        });
        $scope.$on('focus', function (event, index) {
            var waypoint = $scope.waypoints_range[index];
            $scope.markers['selected']= waypoint;
            //$scope.waypoints[index].show_address = true; 
            $scope.$root.$digest();
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
        $scope.showAddress = function () {
            if ($scope.activeItem !== this.$index) {
                return;
            }
            var waypoint = $scope.waypoints_range[this.$index],
                index = (function () {
                    var i, $this = $scope.waypoints,
                        len = $this.length,
                        test_waypoint = null;
                    for (i = 0; i < len; i += 1) {
                        test_waypoint = $this[i];
                        if (test_waypoint.lat === waypoint.lat
                            || test_waypoint.lng === waypoint.lng) {
                            return i;
                        }
                    }
                }) ();
            
            waypoint.show_address = true;
            if (!waypoint.address) {
                if ($scope.waypoints[index].address) {
                    waypoint.address = $scope.waypoints[index].address;
                } else {
                    $scope.requestAddress({lat: waypoint.lat, long: waypoint.lng});
                }
            }
        }
        $scope.$on('result-address', function (event, response) {
            var index = $scope.activeItem;
            $scope.waypoints_range[index].address = response;
        });
    }])
*/