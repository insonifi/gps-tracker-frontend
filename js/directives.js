'use strict';

/* Directives */
angular.module('core.directives', [])
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
                '<div class="s-trip">{{trip.start|timestring}}&#8594;</div>' +
                '<div class="e-trip">&#8594;{{trip.end|timestring}}</div>' +
              '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +
        '</div>',
        /*scope: true,
        controller: ['$scope', '$rootScope', function ($scope, $root) {
            $scope.$on('focus', function (event, index) {
                $root.$broadcast('refresh-waypoints', 
                    
                );
            });
        }],*/
        link: ['$scope', 'element', 'attrs', '$rootScope', function ($scope, element, attrs, $root) {
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
                var index = $scope.sly.rel.activeItem;
                if ($scope.sly.rel.activeItem === 0) { return; }
                $scope.$apply(function (newValue, oldValue) {
                    $scope.waypoints_range = $scope.waypoints.slice(
                        $scope.trips[index].idx_start,
                        $scope.trips[index].idx_end
                    );
                });
            });
            $scope.sly.on('load', function () {
                $scope.sly.activate(1);
            });
            $root.$watch('trips', function (newValue, oldValue) {
                $scope.sly.reload();
            });
        }]
    }
  })
  .directive('waypointsList', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template: 
            '<div class="grid"></div>',
        scope: true,
        controller: ['$scope', function ($scope) {
            $scope.waypoints_range = [];
        }],
        link: ['$scope', 'element', 'attrs', '$rootScope', function ($scope, element, attrs, $root) {
            var parent,
                columns = [{id: 'timestamp', field: 'timestamp', formatter: dateFormatter}],
                options = {
                    /* forceFitColumns: true */
                };
            $scope.grid = new Slick.Grid(element, $scope.waypoints_range, columns, options);
            $scope.grid.onScroll.subscribe(function (event, args) {
                var visible = args.grid.getViewport();
                $scope.$root.$broadcast('select-path', $scope.waypoints_range.slice(visible.top, visible.bottom));
            });
            $scope.grid.onActiveCellChanged.subscribe(function(event, args) {
                var waypoint = $scope.waypoints_range[args.row];
                $scope.$root.$broadcast('select-waypoint', waypoint);
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
                            $scope.$root.$broadcast('select-waypoint', waypoint);
                            break;
                        }
                    }
                }) ()
            });
            $scope.$watch('waypoints_range', function (oldValue, newValue) {
                if (newValue.length > 0) {
                    $scope.paths['selected'] = {
                        weight: 3,
                        opacity: 0.618
                    };
                    /* filter waypoints*/
                    $scope.message($scope.waypoints_range.length, 'waypoints');
                }
                $scope.grid.setData($scope.waypoints_range, true);
                $scope.grid.invalidate();
            })
        }]
    }
  })
  .directive('messageBox', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template:
            '<div id="message-box" ng-hide="isEmpty()">' +
                /* '<ul ng-repeat="msg in messages">' +
                    '<li><{{msg}}</li> ' +
                '</ul>' +*/
                '<span class="timestamp">{{time}}</span><span class="msg">{{messages}}</span>' +
            '</div>',
        controller: ['$scope', '$timeout', '$rootScope', function ($scope, $timeout, $root) {
            $scope.messages = [];
            $scope.isEmpty = function () {
                return $scope.messages.length === 0;
            }
            $root.message = function () {
                var msg_string = '',
                    len = arguments.length;
                if ($scope.timeout_promise) {
                    $timeout.cancel($scope.timeout_promise);
                }
                arguments.join = Array.prototype.join;
                arguments.slice = Array.prototype.slice;
                if (arguments[len - 1] !== true) {
                    $scope.timeout_promise = $timeout(function () {
                        $scope.messages = '';
                    }, 10000);
                } else {
                    len -= 1; /* cut out last item */
                }
                msg_string += arguments.slice(0, len).join(' ');
                $scope.time = (new Date()).toTimeString().slice(0,8);
                $scope.messages = msg_string;
                console.info(msg_string);
            };
        }],
    }
  })
  .directive('printFrame', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template:
            '<iframe>' +
                '<ul ng-repeat="trip in trips">' +
                    '<li><{{trip.start_time}}{{trip.addressA}}</li>' +
                '</ul>' +
            '</iframe>',
        controller: ['$scope', function ($scope) {
        }],
        link: ['$scope', 'element', 'attrs', function ($scope, element, attrs) {
            
        }]
    }
  })