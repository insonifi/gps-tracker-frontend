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
          return date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
      }
  })
  .filter('datestring', function () {
      return function (timestamp) {
          var date = new Date(timestamp);
          return date.getDate() + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear() + '.'
            + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2);
      }
  })
  .filter('day', function () {
      return function (timestamp) {
          var date = new Date(timestamp);
          return date.getDate()
      }
  });
