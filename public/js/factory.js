/**
 * Created by llabatut on 4/1/17.
 */

angular.module('myApp.factory', [])
  .factory('localStorage', function ($window) {

    var factory = {};
    factory.getValue = function (key) {

      if (key in $window.localStorage) {
        return $window.localStorage.getItem(key);
      }
      else {
        return undefined;
      }
    };
    factory.delValue= function (key) {
      $window.localStorage.removeItem(key);
    };
    factory.setValue = function (key, value) {
      $window.localStorage.setItem(key, value);
    };

    checkVersion = function checkVersion(sVersion) {
      // localStorage store in string
      var cVersion = parseInt(factory.getValue('version'));

      if (isNaN(cVersion)) {
        factory.setValue('version', sVersion);
        console.log('first start')

      } else if (sVersion !== cVersion) {
        factory.setValue('version', sVersion);
        console.log('local version: %s', cVersion);
        $window.location.reload(true); // clear cache and reload
      } else {
        console.log('no update needed serverVersion=%s clietnVersion=%s ', sVersion, cVersion)
      }
    };
    factory.checkVersion = checkVersion;
    return factory;
  });