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
            '<li id="{{$index}}" ng-repeat="item in waypoints | period:start:end" ng-click="showAddress()">' +
              '<div>' +
                '<span ng-show="active()" style="padding-right: 1em">{{item.address}}</span><span>{{item.timestamp|date:"HH:mm:ss"}}</span>'+
              '</div>' +
            '</li>' +
          '</ul>' +
        '</div>' +
      '</div>',
      controller: ['$scope', function ($scope) {
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
          $scope.$digest();
        });
        $scope.showAddress = function () {
          var waypoint = $scope.waypoints[this.$index];
          waypoint.show_address = true
          if (!waypoint.address) {
            $scope.requestAddress({lat: waypoint.lat, long: waypoint.long});
          }
        }
        $scope.active = function () {
            return ($index === $scope.activeItem);
        }
      }],
      link: function ($scope, element, attrs) {
        $scope.slyWaypoints = new Sly($(element).find('.frame'), {
            itemNav: 'forceCentered',
            smart: 1,
            activateMiddle: 1,
            activateOn: 'click',
            mouseDragging: 1,
            touchDragging: 1,
            releaseSwing: 1,
            startAt: 0,
            scrollBar: element.find('.scrollbar'),
            scrollBy: 1,
            speed: 300,
            elasticBounds: 1,
            easing: 'easeOutExpo',
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
        }).init();
        $scope.slyWaypoints.on('active', function () {
            $scope.$emit('blur', $scope.active);
            $scope.activeItem = $scope.slyWaypoints.rel.activeItem;
            $scope.$emit('focus', $scope.active);
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
        controller: ['$scope', function ($scope) {
            
        }],
        link: function ($scope, element, attrs) {
        $scope.slyTrips = new Sly($(element).find('.frame'), {
            itemNav: 'forceCentered',
            smart: 1,
            activateMiddle: 1,
            activateOn: 'click',
            mouseDragging: 1,
            touchDragging: 1,
            releaseSwing: 1,
            startAt: 0,
            scrollBar: element.find('.scrollbar'),
            scrollBy: 1,
            speed: 300,
            elasticBounds: 1,
            easing: 'easeOutExpo',
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
        }).init();
        $scope.slyTrips.on('active', function () {
           // $scope.$emit('focus', $scope.slyTrips.rel.activeItem);
        });
        }
    }
  })
