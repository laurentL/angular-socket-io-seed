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
    templateUrl: 'partials/presence'

  })
    .when('/game',{
    templateUrl: 'partials/game'
  })
    .when('/game/:gameId',{
    templateUrl: 'partials/game'
 })
    .otherwise({
    redirectTo: '/presence'
  });

  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('');
});

