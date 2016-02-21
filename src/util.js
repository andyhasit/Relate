


angular.module('Relate').service('util', function($q) {
  var self = this;
  
  self.capitalizeFirstLetter = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  self.createAccessFunctionDefinition = function(name, fn, queuedPromise) {
    return {
      ModelFunctionName: name,
      collectionFunction: fn,
      queuedPromise: queuedPromise
    }
  };
    
  self.arrayContains = function(array, item) {
    var l = array.length
    for(var i=0; i <= l; i++) {
      if (item === array[i]) {
        return true;
      }
    }
    return false;
  };
  
  self.addUnique = function(array, item) {
    if(!self.arrayContains(array, item)){
      array.push(item);
    }
  }
  
  self.addAsItem = function(object, key, item) {
    //Where object[key] = [items...]
    if (object[key] === undefined) {
      object[key] = [item];
    } else {
      object[key].push(item);
    }
  };
  
  self.removeFromArray = function(array, item) {
    var index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
  };
  
  self.filterIndex = function(index, test) {
    //accepts an object like array.
    var filteredItems = [];
    angular.forEach(index, function(item) {
      if (test(item)) {
        filteredItems.push(item);
      }
    });
    return filteredItems;
  };
  
  self.inheritPrototype = function(Child, Parent) {
    var childProto = Child.prototype;
    var parentProto = Parent.prototype;
    for (var prop in parentProto) {
      if (typeof parentProto[prop] == 'function') {
        childProto[prop] = parentProto[prop];
      }
    }
  };
  
  self.copyFields = function(source, target, fields)    {var self = this;
    angular.forEach(fields, function(field) {
      target[field] = source[field];
    });
  };
  
});
