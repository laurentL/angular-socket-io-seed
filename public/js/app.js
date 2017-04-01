'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'ngRoute',

  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.factory',

  // 3rd party dependencies
  'btford.socket-io'
]).config(function ($routeProvider, $locationProvider) {
  $routeProvider.when('/presence', {
    templateUrl: 'partials/presence',
    controller: 'MyCtrl1'
  })
    .when('/game',{
    templateUrl: 'partials/game',
    controller: 'GameCtrl'
  })
    .when('/invite/:user', {
    templateUrl: 'partials/game',
    controller: 'GameCtrl'
  }).otherwise({
    redirectTo: '/presence'
  });

  $locationProvider.html5Mode(true);
})
  .config(['$provide', function ($provide) {
    $provide.decorator('$rootScope', function ($delegate) {
      var _emit = $delegate.$emit;

      $delegate.$emit = function () {
        console.log.apply(console, arguments);
        _emit.apply(this, arguments);
      };

      return $delegate;
    });
  }]);