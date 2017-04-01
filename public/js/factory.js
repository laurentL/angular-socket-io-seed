/**
 * Created by llabatut on 4/1/17.
 */

angular.module('myApp.factory', [])
  .factory('localStrorage', function ($window) {

    var factory = {};
    factory.getValue = function (key) {

      if (key in $window.localStorage) {
        return $window.localStorage.getItem(key);
      }
      else {
        return undefined;
      }
    };
    factory.setValue = function (key, value) {
      $window.localStorage.setItem(key, value);
    };

    checkVersion = function checkVersion(sVersion) {
      // localStorage store in string
      var cVersion = parseInt(factory.getValue('version'));

      if (sVersion === undefined) {
        factory.setValue('version', sVersion);

      } else if (sVersion !== cVersion) {
        factory.setValue('version', sVersion);

        $window.location.reload(true); // clear cache and reload
      } else {
        console.log('no update needed serverVersion=%s clietnVersion=%s ', sVersion, cVersion)
      }
    };
    factory.checkVersion = checkVersion;
    return factory;
  });