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
                $root.$broadcast('msg', 'received', waypoints.length);
                $root.waypoints = $root.waypoints.concat(waypoints);
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
            $root.$broadcast('msg', 'Found', $root.waypoints.length, 'waypoints');
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
            $root.$broadcast('msg', 'Analysing waypoints...', true);
            detect_trips.postMessage(waypointsBuffer, [waypointsBuffer]);
            detect_trips.onmessage = function (event) {
                $root.trips = arrayBufferToJSON(event.data);
                $root.$broadcast('msg', 'Detected', $root.trips.length - 1, 'trips');
                $root.$digest(); /* make sure model is updated */
                $root.$broadcast('refresh-trips');
            }
        });
        socket.on('update-waypoint', function (waypoint) {
            $root.$broadcast('update-waypoint', waypoint);
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
                $root.$broadcast('result-address', response.address);
            }) ()
        });
        
        return {
            queryPeriod: function () {
                socket.emit('query-period', {module_id: arguments[0], start: arguments[1].valueOf(), end: arguments[2].valueOf(), chunks: arguments[3]});
            },
            requestAddress: function (coords) {
                socket.emit('get-address', coords);
            }
        }
    }])