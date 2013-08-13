/*
 * angular-socket-io v0.0.2
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */

'use strict';

angular.module('btford.socket-io', []).
  factory('socket', function ($rootScope, $timeout) {
    var path = window.location.origin + ':8000',
      socket = io.connect(path);
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $timeout(function () {
            callback.apply(socket, args);
          }, 0);
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  });
