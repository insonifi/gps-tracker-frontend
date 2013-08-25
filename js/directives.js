'use strict';

/* Directives */


angular.module('core.directives', [])
 .directive('dtpicker', function () {
    return {
        restrict: 'A',
        replace: true,
        transclude: false,
        link: function ($scope, element, attrs) {
            var today = (new Date()).valueOf() + (-(new Date()).getTimezoneOffset() * 60 * 1000);
            if (attrs.period === 'start') {
              today = today - 24 * 3600000;
            }
            var date_string = (new Date(today)).toISOString().replace(/T/, ' ').slice(0,-8),
                newElem = $(element).appendDtpicker({
                    dateFormat: 'h:mm DD.MM.YYYY',
                    current: date_string
                });
                $scope[attrs.period] = element.val();
            element.bind('keyup', function () {
              $scope[attrs.period] = element.val();
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
            '<div class="sly-container">' + 
            '<div class="w-scrollbar">' +
              '<div class="handle">' +
                '<div class="mousearea"></div>' +
              '</div>' +
            '</div>' +
            '<div class="waypoints">' +
              '<ul class="slidee">' +
                '<li id="{{$index}}" ng-repeat="item in waypoints | period:start:end">' +
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
            $scope.activeItem = 0;
            $scope.$on('refresh-lists', function () {
                $scope.activeItem = 0;
                $scope.sly.reload();
            });   
            $scope.$on('blur', function (event, index) {
                $scope.waypoints[index].show_address = false; 
            });
            $scope.$on('focus', function (event, index) {
              var waypoint = $scope.waypoints[index];
              $scope.markers['selected']= {
                lat: waypoint.lat,
                lng: waypoint.long,
                message: waypoint.address
              }
              //$scope.waypoints[index].show_address = true; 
              $scope.$root.$digest();
            });
            $scope.showAddress = function () {
                if ($scope.activeItem !== this.$index) {
                    return;
                }
                var waypoint = $scope.waypoints[this.$index];
                waypoint.show_address = true;
                if (!waypoint.address) {
                    $scope.requestAddress({lat: waypoint.lat, long: waypoint.long});
                }
            }
            $scope.hideAddress = function () {
                var waypoint = $scope.waypoints[this.$index];
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
            '<li id="{{$index}}" ng-repeat="trip in trips" ng-click="changePeriod()">' +
              '<div>' +
                '<span>{{trip.addressA}}</span><span>{{trip.addressB}}</span>'+
              '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +
        '</div>',
        scope: true,
        controller: ['$scope', function ($scope) {
            $scope.$on('refresh-lists', function () {
                
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
               // $scope.$emit('focus', $scope.slyTrips.rel.activeItem);
            });
        }
    }
  })
