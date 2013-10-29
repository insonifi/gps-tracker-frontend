'use strict';

/* Filters */

angular.module('core.filters', [])
  .filter('km', function () {
      return function (meters) {
          return (meters / 1000).toFixed(1) + 'km';
      }
  })
  .filter('timestring', function () {
      return function (timestamp) {
          return (new Date(timestamp)).toTimeString().slice(0,8);
      }
  })
  .filter('datestring', function () {
      return function (timestamp) {
          return (new Date(timestamp).toLocaleString("de"))
      }
  });
