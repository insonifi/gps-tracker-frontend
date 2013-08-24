'use strict';

/* Filters */

angular.module('core.filters', []).
  filter('period', function() {
    return function(list, start, end) {
      return list.filer(function (item) {
          return (item.timestamp >= start && item.timestamp <= end);
      })
    }
  });
