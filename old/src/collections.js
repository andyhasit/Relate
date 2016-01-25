
angular.module('relate').factory('BaseCollection', function(BackEnd, $firebaseArray) {
  var BaseCollection = function (collectionName) {
    this.collectionName = collectionName;
    this.ref = BackEnd.getReference(collectionName);
    this.items = $firebaseArray(this.ref);
  };
  
  BaseCollection.prototype.getKey = function (item) {
    if (typeof item === 'object') {
      item.$id;
    } else {
      return item;
    }
  };
  
  /*
  BaseCollection.prototype.inherit = function (Child) {
    myConstructor = this.prototype.constructor;
    Child.prototype = new myConstructor();
    Child.prototype.constructor = Child;
  }
  */
  return BaseCollection;
});

angular.module('relate').factory('Collection', function($q, BackEnd, BaseCollection, relationships, collections) {
  
  var Collection = function (collectionName, itemName) {
    BaseCollection.call(this, collectionName);
    this.itemName = itemName;
    this.__parentRelationships = [];
    this.__childrenRelationships = [];
  };
  inheritPrototype(Collection, BaseCollection);
  
  Collection.prototype.__addParentRelationship = function (parentRelationship) {
    this.__parentRelationships.push(parentRelationship);
  };
  
  Collection.prototype.__addChildrenRelationship = function (childrenRelationship) {
    this.__childrenRelationships.push(childrenRelationship);
  };
  
  Collection.prototype.add = function (item, links) {
    /*
    e.g. Task
    links = {
      'bucket': <bucketObj>
    }
    */
    var self = this,
      promises = [],
      defer = $q.defer(),
      key = self.ref.push(item).key();
    angular.forEach(self.__parentRelationships, function (parentRelationship) {
      var itemName = parentRelationship.__parentCollection.itemName;
      var specifiedParent = links[itemName];
      if (specifiedParent) {
        promises.push(parentRelationship.set(specifiedParent.$id, key));
      } //else check if mandatory.
    });
    $q.all(promises).then( function () {
      defer.resolve(self.items.$getRecord(key));
    });
    return defer.promise;
  };
  
  Collection.prototype.remove = function (item) {
    var self = this;
    self.items.$remove(item);
    angular.forEach(self.__childrenRelationships, function (relationship) {
      var childCollection = collections[name];
      angular.forEach(relationship.getChildren(self), function (child) {
        childCollection.remove[child];
      });
      relationship.remove(self);
    });
    angular.forEach(this.__parentRelationships, function (relationship) {
      relationship.remove(self);
    });
  };
  
  return Collection;
});
 
angular.module('relate').service('collections', function(relationships) {
  //Pretty much just a namespace
  var self = this;
  
  self.add = function (collection) {
    //Pass name as plural.
    self[collection.name] = collection; 
  };
});
