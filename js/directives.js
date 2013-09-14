'use strict';

/* Directives */


angular.module('core.directives', [])
  .directive('waypointsList', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        template: 
            '<div class="sly-container">' + 
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
                    '<div class="time" ng-click="showAddress()">{{item.timestamp|date:"HH:mm:ss"}}</div>' +
                  '</div>' +
                '</li>' +
              '</ul>' +
            '</div>' +
            '</div>',
        scope: true,
        controller: ['$scope', function ($scope) {
            $scope.activeItem = -1;
            $scope.$on('refresh-waypoints', function (event, start, end) {
                $scope.activeItem = -1;
                $scope.start = start;
                $scope.end = end;
                $scope.waypoints_range = $scope.waypoints.filter(function (item) {
                    return (item.timestamp >= start && item.timestamp <= end);
                })
                $scope.paths['selected'] = {
                    weight: 3,
                    opacity: 0.618
                };
                $scope.paths['selected'].latlngs = $scope.waypoints_range.map(function (item) {
                    return {
                        lat: item.lat,
                        lng: item.long,
                    }
                });
                $scope.$digest();
                $scope.sly.reload();
            });   
            $scope.$on('blur', function (event, index) {
                if (index === -1) { return; }
                $scope.waypoints_range[index].show_address = false; 
            });
            $scope.$on('focus', function (event, index) {
                var waypoint = $scope.waypoints_range[index];
                $scope.markers['selected']= {
                    lat: waypoint.lat,
                    lng: waypoint.long,
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
                angular.forEach($scope.waypoints_range, function (waypoint, index) {
                    var tolerance = 0.00015,
                        lat_diff = null,
                        long_diff = null;
                    lat_diff = Math.abs(waypoint.lat - event_latlng.lat);
                    long_diff = Math.abs(waypoint.long - event_latlng.lng);
                    if (lat_diff < tolerance && long_diff < tolerance) {
                        $scope.sly.activate(index);
                    }
                });
            });
            $scope.showAddress = function () {
                if ($scope.activeItem !== this.$index) {
                    return;
                }
                var waypoint = $scope.waypoints_range[this.$index];
                waypoint.show_address = true;
                if (!waypoint.address) {
                    $scope.requestAddress({lat: waypoint.lat, long: waypoint.long});
                }
            }
            $scope.hideAddress = function () {
                var waypoint = $scope.waypoints_range[this.$index];
                waypoint.show_address = false;
            }
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
            '<li id="{{$index}}" ng-repeat="trip in trips>' +
              '<div>' +
                '<div class="s-trip">{{trip.addressA}}</div><div class="e-trip">{{trip.addressB}}</div>'+
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
            '<ul id="message-box">' +
                '<li>{{msg}}</li>'+
            '</ul>',
        scope: true,
        controller: ['$scope', '$rootScope', '$timeout', function ($scope, $root, $timeout) {
            $scope.messages = [];
            $root.message = function () {
                arguments.join = Array.prototype.join;
                $scope.messages.push(arguments.join(' '));
                $timeout(function () {
                    $scope.messages.shift();
                }, 30000);
            }
        }]
    }
  })
