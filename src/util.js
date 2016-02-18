


angular.module('Relate').service('util', function($q) {
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
    
  self.arrayContains = function(array, item) {
    var l = array.length
    for(var i=0; i <= l; i++) {
      if (item == array[i]) {
        return true;
      }
    }
    return false;
  }
  
  self.removeFromArray = function(array, item) {
    //will be unique in list.
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
  }
  
  self.inheritPrototype = function(Child, Parent) {
    var childProto = Child.prototype;
    var parentProto = Parent.prototype;
    for (var prop in parentProto) {
      if (typeof parentProto[prop] == 'function') {
        childProto[prop] = parentProto[prop];
      }
    }
  };
  
  /*
  for(var i = array.length - 1; i >= 0; i--) {
    if(array[i] === number) {
       array.splice(i, 1);
    }
  }
  */
  
});
