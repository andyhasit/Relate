
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
  
  ParentChildRelationship.prototype.getParent = function (childItem) {
    return this.parentOfChildCollection.getParent(childItem);
  };
  
  ParentChildRelationship.prototype.getChildren = function (parentItem) {
    return this.childrenOfParentCollection.getChildren(parentItem);
  };
  
  ParentChildRelationship.prototype.link = function (parentItem, childItem) {
    //Sets the parent of the child, unlinking child from previous parent if applicable.
    this.parentOfChildCollection.link(parentItem, childItem);
    this.childrenOfParentCollection.link(parentItem, childItem, oldParent);
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
    if (self._isParentType(item)) {
      self._parentDeleteInProgress.set(item, true);
      angular.forEach(self.getChildren(item), function (childItem) {
        self.childCollection.remove(childItem);
      });
      self._parentDeleteInProgress.set(item, false);
      self.childrenOfParentCollection.removeParent(item);
    } else {
      var parentItem = self.getParent(item);
      self.parentOfChildCollection.removeChild(item);
      if (parentItem && !self._parentDeleteInProgress.get(parentItem)) {
        self.childrenOfParentCollection.removeChild(item);
      }
    }
  };
  
  
  ParentChildRelationship.prototype._isParentType = function (item) {
    if (item.type === this.parentCollection.typeIdentifier) {
      return true;
    } else if (item.type === this.parentCollection.typeIdentifier) {
      return false;
    } else {
      throw {message: "wtf?"}; //TODO - change.
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