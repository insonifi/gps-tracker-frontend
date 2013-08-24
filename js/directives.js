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
            '<div>' + 
            '<div class="scrollbar">' +
              '<div class="handle">' +
                '<div class="mousearea"></div>' +
              '</div>' +
            '</div>' +
            '<div class="frame">' +
              '<ul class="slidee">' +
                '<li id="{{$index}}" ng-repeat="item in waypoints" ng-click="showAddress()">' +
                // '<li id="{{$index}}" ng-repeat="item in waypoints | period:start:end" ng-click="showAddress()">' +
                  '<div>' +
                    '<span ng-show="item.show_address" style="padding-right: 1em">{{item.address}}</span><span>{{item.timestamp|date:"HH:mm:ss"}}</span>'+
                  '</div>' +
                '</li>' +
              '</ul>' +
            '</div>' +
            '</div>',
        scope: true,
        controller: ['$scope', function ($scope) {
            $scope.activeItem = 0;
            $scope.$on('query-end', function () {
                $scope.activeItem = 0;
                $scope.sly.reload();
            });   
            $scope.$on('blur', function (event, index) {
                $scope.waypoints[index].show_address = false; 
            });
            $scope.$on('focus', function (event, index) {
              var waypoint = $scope.waypoints[index];
              $scope.waypoints[index].show_address = true;
              $scope.markers[waypoint.module_id] = {
                lat: waypoint.lat,
                lng: waypoint.long,
                message: waypoint.address
              }
              $scope.waypoints[index].show_address = false; 
              $scope.$digest();
            });
            $scope.showAddress = function () {
                if (!this) { return; }
                var waypoint = $rootScope.waypoints[this.$index];
                waypoint.show_address = true
                if (!waypoint.address) {
                    $scope.requestAddress({lat: waypoint.lat, long: waypoint.long});
                }
            }
        }],
        link: function ($scope, element, attrs) {
            var parent = $(element);
            $scope.sly = new Sly(parent.find('.frame'), {
                itemNav: 'forceCentered',
                smart: 1,
                activateMiddle: 1,
                activateOn: 'click',
                mouseDragging: 1,
                touchDragging: 1,
                releaseSwing: 1,
                startAt: 0,
                scrollBar: parent.find('.scrollbar'),
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
        '<div>' + 
        '<div class="scrollbar">' +
          '<div class="handle">' +
            '<div class="mousearea"></div>' +
          '</div>' +
        '</div>' +
        '<div class="frame">' +
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
        controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
            $scope.$on('query-end', function () {
                
            });    
        }],
        link: function ($scope, element, attrs) {
            var parent = $(element);
            $scope.sly = new Sly(parent.find('.frame'), {
                itemNav: 'forceCentered',
                smart: 1,
                activateMiddle: 1,
                activateOn: 'click',
                mouseDragging: 1,
                touchDragging: 1,
                releaseSwing: 1,
                startAt: 0,
                scrollBar: parent.find('.scrollbar'),
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
