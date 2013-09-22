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
                }, 10000);
            }
        }],
    }
  })
