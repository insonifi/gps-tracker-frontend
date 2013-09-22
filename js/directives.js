'use strict';

/* Directives */
angular.module('core.directives', [])
  .directive('waypointsList', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template: 
            /* '<div class="sly-container">' + 
            '<div class="w-scrollbar">' +
              '<div class="handle">' +
                '<div class="mousearea"></div>' +
              '</div>' +
            '</div>' +
            '<div class="waypoints">' +
              '<ul class="slidee">' +
                 '<li id="{{$index}}" ng-repeat="item in waypoints_range">' +
                  '<div>' +
                    '<div ng-show="item.show_address" class="address" ng-click="item.show_address=false;">{{item.address}}</div>' +
                    '<div class="time" ng-click="showAddress()">{{item.time}}</div>' +
                  '</div>' +
                '</li>' +
              '</ul>' +
            '</div>' +
            '</div>'*/
            '<div ng-grid="waypointsOptions"></div>',
        scope: true,
        controller: ['$scope', '$rootScope', function ($scope, $root) {
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
                
            $scope.activeItem = -1;
            $scope.$on('refresh-waypoints', function (event, start, end) {
                var buffer = new ArrayBuffer(0);
                $scope.activeItem = -1;
                $scope.start = start;
                $scope.end = end;
                $scope.paths['selected'] = {
                    weight: 3,
                    opacity: 0.618
                };
                /* filter waypoints*/
                buffer = jsonToArrayBuffer({
                    waypoints: $scope.waypoints,
                    start: start,
                    end: end
                });
                range.postMessage(buffer, [buffer]);
                range.onmessage = function (event) {
                    $scope.waypoints_range = arrayBufferToJSON(event.data);
                }
                /* show path */
                $scope.paths['selected'].latlngs = $scope.waypoints_range;
                /* update model */
                $scope.$digest();
            });   
            $scope.$on('blur', function (event, index) {
                if (index === -1) { return; }
                $scope.waypoints_range[index].show_address = false; 
            });
            $scope.$on('focus', function (event, index) {
                var waypoint = $scope.waypoints_range[index];
                $scope.markers['selected']= {
                    lat: waypoint.lat,
                    lng: waypoint.lng,
                    message: waypoint
                }
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
        }],
        link: function ($scope, element, attrs) {
            var parent = $(element);
            $scope.sly = new Sly(parent.find('.waypoints'), {
                itemNav: 'forceCentered',
                smart: 1,
                activateMiddle: 1,
                activateOn: 'click',
                mouseDragging: 1,
                touchDragging: 1,
                releaseSwing: 1,
                startAt: 0,
                scrollBar: parent.find('.w-scrollbar'),
                scrollBy: 1,
                speed: 300,
                elasticBounds: 1,
                easing: 'easeOutExpo',
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1,
            }).init();
            $scope.sly.on('active', function () {
                $scope.$emit('blur', $scope.activeItem);
                $scope.activeItem = $scope.sly.rel.activeItem;
                $scope.$emit('focus', $scope.activeItem);
            });
            $scope.sly.on('load', function () {
                $scope.sly.activate(0);
            })
        }
    }
  })
  .directive('tripsList', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template: 
        '<div class="sly-container">' + 
        '<div class="t-scrollbar">' +
          '<div class="handle">' +
            '<div class="mousearea"></div>' +
          '</div>' +
        '</div>' +
        '<div class="trips">' +
          '<ul class="slidee">' +
            '<li id="{{$index}}" ng-repeat="trip in trips">' +
              '<div>' +
                '<div class="d-trip">{{trip.distance | km}}</div>' +
                '<div class="s-trip">{{trip.addressA}}&#8594;</div>' +
                '<div class="e-trip">&#8594;{{trip.addressB}}</div>' +
              '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +
        '</div>',
        scope: true,
        controller: ['$scope', function ($scope) {
            $scope.$on('refresh-trips', function () {
                $scope.sly.reload();
            });
            $scope.$on('focus', function (event, index) {
                $scope.$root.$broadcast('refresh-waypoints', 
                    $scope.trips[index].start,
                    $scope.trips[index].end
                );
            });
        }],
        link: function ($scope, element, attrs) {
            var parent = $(element);
            $scope.sly = new Sly(parent.find('.trips'), {
                itemNav: 'forceCentered',
                smart: 1,
                activateMiddle: 1,
                activateOn: 'click',
                mouseDragging: 1,
                touchDragging: 1,
                releaseSwing: 1,
                startAt: 0,
                scrollBar: parent.find('.t-scrollbar'),
                scrollBy: 1,
                speed: 300,
                elasticBounds: 1,
                easing: 'easeOutExpo',
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1,
            }).init();
            $scope.sly.on('active', function () {
                if ($scope.sly.rel.activeItem === 0) { return; }
                $scope.$emit('focus', $scope.sly.rel.activeItem);
            });
            $scope.sly.on('load', function () {
                $scope.sly.activate(1);
            })
        }
    }
  })
  .directive('messageBox', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template:
            '<div id="message-box" ng-hide="isEmpty()">' +
                '<ul ng-repeat="msg in messages">' +
                    '<li>{{msg}}</li> ' +
                '</ul>' +
            '</div>',
        controller: ['$scope', '$rootScope', '$timeout', function ($scope, $root, $timeout) {
            $scope.messages = [];
            $scope.isEmpty = function () {
                return $scope.messages.length === 0;
            }
            $root.message = function () {
                arguments.join = Array.prototype.join;
                $scope.messages.push(arguments.join(' '));
                $timeout(function () {
                    $scope.messages.shift();
                }, 3000);
            }
        }],
    }
  })
