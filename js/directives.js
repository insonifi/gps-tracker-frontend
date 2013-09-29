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
                    $scope.trips[index].end,
                    $scope.trips[index].startIdx,
                    $scope.trips[index].endIdx
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
  .directive('waypointsList', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template: 
            '<div class="grid"></div>',
        scope: true,
        controller: ['$scope', '$rootScope', function ($scope, $root) {
            $scope.waypoints_range = [];
                
            $scope.$on('refresh-waypoints', function (event, start, end, startIdx, endIdx) {
                $scope.start = start;
                $scope.end = end;
                $scope.startIdx = startIdx;
                $scope.endIdx = endIdx;
                $scope.paths['selected'] = {
                    weight: 3,
                    opacity: 0.618
                };
                /* filter waypoints*/
                $scope.waypoints_range = $scope.waypoints.slice(startIdx, endIdx);
                $root.message($scope.waypoints_range.length || 0, 'waypoints displayed');
                /* update model */
                //$scope.$digest();
                $scope.grid.setData($scope.waypoints_range, true);
                $scope.grid.invalidate();
                /* show path */
                // $scope.paths['selected'].latlngs = $scope.waypoints_range.slice(0, 100);
                $scope.markers['start']= $scope.waypoints_range[0];
                $scope.markers['end']= $scope.waypoints_range[$scope.waypoints_range.length - 1];
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
        }],
        link: function ($scope, element, attrs) {
            var parent,
                columns = [{id: 'timestamp', name: 'time', field: 'timestamp'}],
                options = {
                    showHeaderRow: false,
                    fullWidthRows: true,
                    forceFitColumns: true,
                    defaultFormatter: function (row, cell, value, columnDef, dataContext) {
                        return (new Date(value)).toLocaleTimeString();
                };
            $scope.grid = new Slick.Grid(element, $scope.waypoints_range, columns, options);
            $scope.grid.onScroll.subscribe(function (event, args) {
                var grid = args.grid,
                    visible = grid.getViewport();
                $scope.paths['selected'].latlngs = $scope.waypoints_range.slice(visible.top, visible.bottom);
                $scope.$root.$digest();
            });
            /*
            $scope.grid.onViewportChanged(function (event,args) {
                console.log(event, args);
            });
            */
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
                }, 10000);
            }
        }],
    }
  })
