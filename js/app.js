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
                $root.message('received', $root.waypoints.length, '...');
            },
            addressCache = {},
            addressPromises = {};
        socket.on('connect', function () {
            $root.message('connected to server', 3);
            socket.emit('get-modulelist');
        });
        socket.on('disconnect', function () {
            $root.message('disconnected from server', 10);
        })
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
            $root.message('Analysing waypoints...');
            detect_trips.postMessage(waypointsBuffer, [waypointsBuffer]);
            detect_trips.onmessage = function (event) {
                $root.$apply(function () {
                    $root.trips = arrayBufferToJSON(event.data);
                })
                $root.message('Detected', ($root.trips.length === 0 ? '0' : $root.trips.length - 1), 'trips', 3);
            }
        });
        socket.on('update-waypoint', function (waypoint) {
            $root.$broadcast('update-waypoint', waypoint);
        });
        socket.on('result-address', function (response) {
            var coords_str = [response.lat, response.lng].join();
            addressCache[coords_str] = response.address;
            addressPromises[coords_str].resolve(response.address);
        });        
        return {
            queryPeriod: function () {
                socket.emit('query-period', {module_id: arguments[0], start: arguments[1].valueOf(), end: arguments[2].valueOf(), chunks: arguments[3]});
            },
            requestAddress: function (coords) {
                var coords_str = [coords.lat, coords.lng].join(),
                    address = $q.defer();
                if (coords.address) {
                    address.resolve(coords.address);
                } else if (addressCache.hasOwnProperty(coords_str)) {
                    address.resolve(addressCache(coords_str));
                } else {
                    addressPromises[coords_str] = address;
                    socket.emit('get-address', coords);
                }
                
                return address.promise;
            }
        }
    }])