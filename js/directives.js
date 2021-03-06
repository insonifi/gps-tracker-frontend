'use strict';

/* Directives */
angular.module('core.directives', [])
  .directive('tripsList', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template: 
        '<div class="sly-container">\
        <div class="t-scrollbar">\
          <div class="handle">\
            <div class="mousearea"></div>\
          </div>\
        </div>\
        <div class="trips">\
          <ul class="slidee">\
            <li id="{{$index}}" ng-repeat="trip in trips">\
              <div>\
                <div class="day-trip" ng-hide="{{$first}}">{{trip.start|day}}</div>\
                <div class="d-trip">{{trip.distance|km}}</div>\
                <div class="s-trip">{{trip.start|timestring}}&#8594;</div>\
                <div class="e-trip">&#8594;{{trip.end|timestring}}</div>\
              </div>\
            </li>\
          </ul>\
        </div>\
        </div>',
        scope: true,
        controller: ['$scope', '$rootScope', '$timeout', function ($scope, $root, $timeout) {
            $scope.$watch('trip_index', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $root.trip_index = $scope.trips[newValue];
                }
            });
            $root.$watch('trips', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.sly.frame.style.visibility = 'hidden';
                    $timeout(function () {
                        $scope.sly.reload();
                        $scope.sly.frame.style.visibility = 'visible';
                    }, 800); //delay for ng-repeat to prepare DOM for Sly
                }
            })
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
            $scope.sly.frame.style.overflow = 'visible';
            $scope.sly.on('active', function () {
                var index = $scope.sly.rel.activeItem;
                if (index === 0) {
                  $scope.sly.activate(1, true);
                  return; 
                }
                $scope.$apply(function () {
                    $scope.trip_index = index;
                })
            });
            $scope.sly.on('load', function () {
                $scope.sly.activate(1);
            });
        }
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
        controller: ['$scope', '$rootScope', function ($scope, $root) {
            $scope.paths['selected'] = {
                weight: 3,
                opacity: 0.618,
                color: '#1A529C'
            };
            $scope.$on('leafletDirectiveMap.click', function(event, args){
                var event_latlng = args.leafletEvent.latlng;
                console.log('[waypointsList] find waypoint at',
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
                            $scope.grid.setActiveCell(index, 0); /* activate first cell in discovered row */
                            $scope.grid.flashCell(index, 0);
                            break;
                        }
                    }
                }) ()
            });
            $scope.selectPath = function (event, args) {
                var visible = $scope.grid.getViewport();
                $root.selected_path = $scope.waypoints_range.slice(visible.top > 0 ? visible.top : 0, visible.bottom);
                if(!$root.$$phase) {
                  $root.$digest();
                }
            };
            $scope.selectWaypoint = function (waypoint) {
                $root.selected_waypoint = waypoint;
                if(!$root.$$phase) {
                  $root.$digest();
                }
            }
            $root.$watch('trip_index', function (newValue, oldValue) {
                var trip = newValue;
                if (newValue !== oldValue) {
                    $root.waypoints_range = $root.waypoints.slice(trip.idx_start, trip.idx_end + 1);
                }
            })
            $root.$watch('waypoints_range', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if (newValue.length > 0) {
                        /* filter waypoints*/
                        $scope.message(newValue.length, 'waypoints', 3);
                    }
                    $scope.grid.resetActiveCell()
                    $scope.grid.setData(newValue, true);
                    $scope.grid.invalidate();
                    $scope.selectPath();
                }
            })
        }],
        link: function ($scope, element, attrs) {
            var parent,
                empty_array = [],
                columns = [{id: 'timestamp', field: 'timestamp', formatter: dateFormatter}],
                options = {
                    /* forceFitColumns: true */
                };
            $scope.grid = new Slick.Grid(element, empty_array, columns, options);
            $scope.grid.onScroll.subscribe($scope.selectPath);
            $scope.grid.onActiveCellChanged.subscribe(function(event, args) {
                $scope.selectWaypoint($scope.grid.getDataItem(args.row));
            });
        }
    }
  })
  .directive('messageBox', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template:
            '<div id="message-box" ng-hide="isEmpty()">\
                <span class="timestamp">{{time}}</span><span class="msg">{{messages}}</span>\
            </div>',
        controller: ['$scope', '$timeout', '$rootScope', function ($scope, $timeout, $root) {
            $scope.messages = [];
            $scope.isEmpty = function () {
                return $scope.messages.length === 0;
            }
            $root.message = function () {
                var msg_string = '',
                    len = arguments.length,
                    delay;
                if ($scope.timeout_promise) {
                    $timeout.cancel($scope.timeout_promise);
                }
                arguments.join = Array.prototype.join;
                arguments.slice = Array.prototype.slice;
                if (typeof arguments[len - 1] === "number") {
                    arguments.pop = Array.prototype.pop;
                    delay = arguments.pop() * 1000; //milliseconds to seconds
                }
                if (delay) {
                    $scope.timeout_promise = $timeout(function () {
                        $scope.messages = '';
                    }, delay);
                }
                msg_string += arguments.join(' ');
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
            '<div id="print-frame">\
                <h3>Maršruta lapa</h3>\
                <table>\
                    <caption><span style="font-size: large;">{{trips[0].start|datestring}} ― {{trips[0].end|datestring}}</span></caption>\
                    <tbody>\
                        <tr ng-repeat="trip in trips" ng-hide="$first">\
                            <td class="period">\
                                <div>{{trip.start|datestring}}</div>\
                                <div>{{trip.end|datestring}}</div>\
                            </td>\
                            <td class="address">\
                              {{trip.address_start}} ―  {{trip.address_end}}\
                            </td>\
                            <td class="distance">\
                                {{trip.distance|km}}\
                            </td>\
                        </tr>\
                    </tbody>\
                </table>\
            </div>',
        controller: ['$scope', '$rootScope', 'cnxn', function ($scope, $root, cnxn) {
            $root.tripsReport = function () {
                /*
                var print_frame = document.getElementById('print-frame');
                if (print_frame.style.display === 'block') {
                    print_frame.style.display = 'none';
                } else {
                    print_frame.style.display = 'block';
                }
                */
                $scope.print();
            };
            $scope.print = function() {
                var iframe = window.frames['print'],
                    iframe_element = document.querySelector('iframe'),
                    print_frame = document.getElementById('print-frame'),
                    temp_doc = document.createDocumentFragment();
                    
                iframe.document.write(
                    '<html>\
                        <link type="text/css" href="css/print.css" rel="stylesheet" />\
                        <body>\
                        <body>\
                    </html>'
                );
                iframe.document.body.innerHTML = print_frame.innerHTML;
                iframe.print();
            };
            $scope.close = function () {
                document.getElementById('print-frame').style.cssText = 'display: none';
            }
            $root.$watch('trips', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    var i,
                        trips = newValue,
                        waypoints = $root.waypoints,
                        len = trips.length,
                        bindPromise = function (i) {
                            trips[i].address_start = cnxn.requestAddress(waypoints[trips[i].idx_start]).then(function (value) {
                                trips[i].address_start = value;
                            })
                            trips[i].address_end = cnxn.requestAddress(waypoints[trips[i].idx_end]).then(function (value) {
                                trips[i].address_end = value;
                            })
                        };
                        
                    for (i = 1; i < len; i += 1) {
                        bindPromise(i);
                    }
                }
            })
        }],
        link: function ($scope, element, attrs) {
            
        }
    }
  })
