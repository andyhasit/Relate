


angular.module('Relate').service('utils', function($q) {
  var self = this;
  
  self.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  self.createAccessFunctionDefinition = function(name, fn) {
    return {
      ModelFunctionName: name,
      collectionFunction: fn
    }
  };
  
});
