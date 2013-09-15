'use strict';

/* Filters */

angular.module('core.filters', [])
  .filter('period', function() {
    return function(list, start, end) {
      return list.filter(function (item) {
          return (item.timestamp >= start && item.timestamp <= end);
      })
    }
  })
  .filter('km', function () {
      return function (meters) {
          return (meters / 1000).toFixed(1) + ' km';
      }
  });
