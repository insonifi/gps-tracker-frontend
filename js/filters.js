'use strict';

/* Filters */

angular.module('core.filters', []).
  filter('datetonum', function() {
    return function(date) {
      return date.valueOf();
    }
  });
