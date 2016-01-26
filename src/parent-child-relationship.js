
angular.module('Relate').factory('ParentChildRelationship', function($q, ParentOfChildCollection, ChildrenOfParentCollection) {
  /*
  
  */

  var ParentChildRelationship = function(db, parentCollection, childCollection, options) {
    var options = options || {};
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this.parentOfChildCollection = new ParentOfChildCollection(db, parentCollection, childCollection, options);
    this.childrenOfParentCollection = new ChildrenOfParentCollection(db, parentCollection, childCollection, parentOfChildCollection, options);
    this.collectionName = options.collectionName || 
        'lnk_' + parentCollection.itemName + '_' + childCollection.itemName + 's';
    parentCollection._registerRelationship(this);
    childCollection._registerRelationship(this);
    this._cascadeDeleteInProgress = false;
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
    /*
    TODO: think about this in terms of timing, can it fuck up?
    Currently the childrenOfParentCollection uses the parentOfChildCollection to determine
    if the child has an old parent.
    
    SO question:
      I have collections with parent child relationships. I use an object to manage each of the relationships (e.g. TaskInProjectRelationshipManager).
      A RelationshipManager coordinates two regitsers: parentOfChild and childrenOfParent
    
    */
  };
  
  ParentChildRelationship.prototype.remove = function (item) {
    /* Gets called when an item is deleted */
    var self = this;
    if (self.isParentType(item)) {
      self._cascadeDeleteInProgress = true;
      angular.forEach(self.getChildren(item), function (childItem) {
        self.childCollection.remove(childItem);
      });
      self.childrenOfParentCollection.removeParent(item);
      self._cascadeDeleteInProgress = false;
    } else {
      self.parentOfChildCollection.removeChild(item);
      if (!self._cascadeDeleteInProgress) {
        self.childrenOfParentCollection.removeChild(item);
      }
    } 
  };
  
  ParentChildRelationship.prototype.isParentType = function (item) {
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