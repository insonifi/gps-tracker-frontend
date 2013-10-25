'use strict';


// Declare app level module which depends on filters, and services
angular.module('core', ['core.filters', 'core.services', 'core.directives', 'core.controllers', 'btford.socket-io', 'leaflet-directive', 'kendo.directives'])
    .factory('cnxn', ['socket', '$q', '$rootScope', function (socket, $q, $root) {
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
                $root.waypoints = $root.waypoints.concat(waypoints);
                $root.message('+', waypoints.length, 'total', $root.waypoints.length);
            };
        socket.on('connect', function () {
          socket.emit('get-modulelist');
        });
        socket.on('modulelist', function (modules) {
          $root.$broadcast('modulelist', modules);
        })
        /* Receive waypoints */
        socket.on('query-chunk', function (chunk) {
            receiveWaypoints(chunk);
        });
        socket.on('query-end', function (chunk) {
            var waypointsBuffer = new ArrayBuffer(0);
            receiveWaypoints(chunk);
            $root.message('Found', $root.waypoints.length, 'waypoints');
            if ($root.waypoints.length === 0) {
                /* there is nothing to do */
                return;
            }
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
            $root.message('Analysing waypoints...', true);
            detect_trips.postMessage(waypointsBuffer, [waypointsBuffer]);
            detect_trips.onmessage = function (event) {
                $root.$apply(function () {
                    $root.trips = arrayBufferToJSON(event.data);
                    $root.message('Detected', ($root.trips.length === 0 ? '0' : $root.trips.length), 'trips');
                })
            }
        });
        socket.on('update-waypoint', function (waypoint) {
            $root.$broadcast('update-waypoint', waypoint);
        });
        
        return {
            queryPeriod: function () {
                socket.emit('query-period', {module_id: arguments[0], start: arguments[1].valueOf(), end: arguments[2].valueOf(), chunks: arguments[3]});
            },
            requestAddress: function (coords) {
                var address = $q.defer();
                socket.emit('get-address', coords);
                socket.on('result-address', function (response) {
                    /* it's not clear whether we should use local cache for addresses
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
                    }) ()
                    */
                    address.resolve(response.address);    
                });
                return address.promise;
            }
        }
    }])