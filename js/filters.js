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
          var date = new Date(timestamp)
          return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      }
  })
  .filter('datestring', function () {
      return function (timestamp) {
          var date = new Date(timestamp);
          return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear() + '.'
            + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      }
  });
