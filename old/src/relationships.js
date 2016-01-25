

angular.module('relate').factory('BaseRelationship', function(BaseCollection) {
  var BaseRelationship = function (collectionName, parentCollection, childCollection) {
    BaseCollection.call(this, collectionName);
    this.__childCollection = childCollection;
    this.__parentCollection = parentCollection;
  };
  
  inheritPrototype(BaseRelationship, BaseCollection);
  
  /*
  ParentRelationship.prototype.getParent = function (parent) {
    var parentKey = this.getKey(parent);
    return this.items.$remove(parent);
  };
  */
  
  return BaseRelationship;
});

angular.module('relate').factory('ParentRelationship', function($firebaseObject, BaseRelationship) {
  /*
  Stores the parent of a child:
  child__parent = {
    childKey1: parentKey1,
    childKey2: parentKey1,
  }
  
  */
  var ParentRelationship = function (parentCollection, childCollection) {
    var collectionName = childCollection.itemName + '__' + parentCollection.itemName;
    
    BaseRelationship.call(this, collectionName, parentCollection, childCollection);
    this.items = $firebaseObject(this.ref);
  };
  
  inheritPrototype(ParentRelationship, BaseRelationship);
  
  ParentRelationship.prototype.set = function (parentKey, childKey) {
    var pair = {};
    pair[childKey] = parentKey;
    
    //$value
    //return this.items.$set(pair);
    var entry = this.ref.child(childKey);
    c.log(childKey);
    obj = $firebaseObject(entry);
    obj.$value = parentKey;
    return obj.$save();
    /*
    
    
    c.log(this.ref.child('-K7CoaaiE7hVqIb0GO6oCT'));
    this.items = $firebaseObject(this.ref);
    c.log(this.items);
    c.log(!!BackEnd.getReference(this.collectionName));
    */
    
  };
  
  ParentRelationship.prototype.remove = function (parent) {
    return this.items.$remove(parent);
  };
  
  return ParentRelationship;
});

angular.module('relate').factory('ChildrenRelationship', function(BaseRelationship) {
  /*
  name : {
    parentId : [
      childId2: true,
      childId1: true,
    ]
  }
  */
  var ChildrenRelationship = function (parentCollection, childCollection) {
    var collectionName = parentCollection.itemName + '__' + childCollection.collectionName;
    BaseRelationship.call(this, collectionName, parentCollection, childCollection);
  };
  
  inheritPrototype(ChildrenRelationship, BaseRelationship);
  
  ChildrenRelationship.prototype.getChildren = function (parent) {
    var childCollection = this.__childCollection;
    var childrenObject = this.items.$getRecord(parent.$id);
    var children = [];
    angular.forEach(Object.keys(obj), function (id) {
      children.push(__childCollection.$getRecord(id));
    });
    return children;
  };
  
  ChildrenRelationship.prototype.link = function (parent, child) {
    var obj = this.items.$getRecord(parent.$id);
    /*if (obj) {
      obj[child.$id] = true;
      this.items.$save(obj);
    } else {
      this.items.$add( {child.$id : true} );
    }*/
  };
  
  ChildrenRelationship.prototype.unlink = function () {
    var obj = this.items.$getRecord(parent.$id);
  };
  return ChildrenRelationship;
});

angular.module('relate').service('relationships', function() {
  var self = this;
  
});

