
angular.module('Relate').factory('ParentChildRelationship', function($q, ParentOfChildCollection, ChildrenOfParentCollection, ValueRegister) {
  /*
  
  */

  var ParentChildRelationship = function(db, parentCollection, childCollection, options) {
    var options = options || {};
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this.parentOfChildCollection = new ParentOfChildCollection(db, parentCollection, childCollection, options);
    this.childrenOfParentCollection = new ChildrenOfParentCollection(db, parentCollection, childCollection, options);
    this.collectionName = options.collectionName || 
        'lnk_' + parentCollection.itemName + '_' + childCollection.itemName + 's';
    parentCollection._registerRelationship(this);
    childCollection._registerRelationship(this);
    this._parentDeleteInProgress = new ValueRegister();
  };
  
  ParentChildRelationship.prototype.getAccessFunctions = function() {
    //Registers a relationship -- internal use.
    var singleItemActions = ['new', 'get', 'save', 'delete'];
    var multipleItemActions = ['find'];
    var accessFunctions = [];
    var itemName = capitalizeFirstLetter(self.itemName);
    function getFnDef(name, fn) {
      return {
        ModelFunctionName: name,
        collectionFunction: fn
      }
    }
    angular.forEach(singleItemActions, function(action) {
      accessFunctions.push(getFnDef(action + itemName, self[action]));
    });
    angular.forEach(multipleItemActions, function(action) {
      accessFunctions.push(getFnDef(action + itemName + 's', self[action]));
    });
    return accessFunctions;
  };
  
  ParentChildRelationship.prototype.getParent = function (childItem) {
    return this.parentOfChildCollection.getParent(childItem);
  };
  
  ParentChildRelationship.prototype.getChildren = function (parentItem) {
    return this.childrenOfParentCollection.getChildren(parentItem);
  };
  
  ParentChildRelationship.prototype.link = function (parentItem, childItem) {
    //Sets the parent of the child, unlinking child from previous parent if applicable.
    this.parentOfChildCollection.link(parentItem, childItem);
    this.childrenOfParentCollection.link(parentItem, childItem);
    // TODO: chain promises?
  };
  
  ParentChildRelationship.prototype._removeItem = function (item) {
    /* Gets called when an item is deleted 
    item can be the parent or the child in the relationship.
    If delete is called on the parent:
      call collection.delete on all children (which will call relationship.delete) 
      remove from childrenOfParentCollection
    If called on the child:
      remove from parentOfChildCollection
      remove from childrenOfParentCollection (but skip this step if it was called as part of parent delete)
    
    */
    var self = this;
    var deferred = $q.defer();
    if (self._isParentType(item)) {
      self._parentDeleteInProgress.set(item, true);
      var childDeletions = [];
      angular.forEach(self.getChildren(item), function (childItem) {
        childDeletions.push(self.childCollection.remove(childItem));
      });
      //Note that _parentDeleteInProgress will be set to false before promises are all resolved (non critical)
      self._parentDeleteInProgress.set(item, false);
      $q.all(childDeletions).then(function() {
        self.childrenOfParentCollection.removeParent(item);
        deferred.resolve();
      });
    } else {
      var parentItem = self.getParent(item);
      var childDeletions = [];
      childDeletions.push(self.parentOfChildCollection.removeChild(item));
      if (parentItem && !self._parentDeleteInProgress.get(parentItem)) {
        childDeletions.push(self.childrenOfParentCollection.removeChild(item));
      }
      $q.all(childDeletions).then(function() {
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  ParentChildRelationship.prototype._isParentType = function (item) {
    var itemType = item.document.type;
    if (itemType === this.parentCollection.typeIdentifier) {
      return true;
    } else if (itemType === this.parentCollection.typeIdentifier) {
      return false;
    } else {
      c.log(item);
      throw 'Unrecognised db object type: ' + itemType;
    }
  };
  /*
  for(var i = array.length - 1; i >= 0; i--) {
    if(array[i] === number) {
       array.splice(i, 1);
    }
  }
  */

  return ParentChildRelationship;
});