
angular.module('Relate').factory('ParentChildRelationship', function($q, ParentOfChildCollection, ChildrenOfParentCollection) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  var ParentChildRelationship = function(db, parentCollection, childCollection, options) {
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this.parentOfChildCollection = new ParentOfChildCollection(db, parentCollection, childCollection, options);
    this.childrenOfParentCollection = new ChildrenOfParentCollection(db, parentCollection, childCollection, parentOfChildCollection, options);
    this._setNames(options);
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
    parentOfChildCollection.link(parentItem, childItem);
    childrenOfParentCollection.link(parentItem, childItem, oldParent);
  };
  
  ParentChildRelationship.prototype.onRemove = function (item) {
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
  ParentChildRelationship.prototype._setNames = function (options) {
    //These can be changed in options. Implement later.
    
    // e.g. project
    var parentName = this.parentCollection.itemName;
    // e.g. task
    var childName = this.childCollection.itemName;
    // e.g. lnk_project_tasks
    this.collectionName = 'lnk_' + parentName + '_' + childName + 's';
    // e.g. lnk_child_tasks_of_project 
    this.childrenOfParentCollection.typeIdentifier = 'lnk_child_' + childName + 's_of_' + parentName;
    // e.g. lnk_parent_project_of_task
    this.parentOfChildCollection.typeIdentifier = 'lnk_parent_' + parentName + '_of_' + childName; 
  };
    
  /*
  No need
  ParentChildRelationship.prototype._registerDocument = function(document, typeIdentifier) {
    if (typeIdentifier === this.childrenOfParentTypeIdentifier) {
      this.children_of_parent_records.push(document);
    } else if (typeIdentifier === this.parentOfChildTypeIdentifier) {
      this.parent_of_child_records.push(document);
    } else {
      throw {name: 'DataLoadingError', message: 'Cannot load document with type ' + typeIdentifier + '\" into collection \"' + this.collectionName + '\".'};
    }
  };
  */
  return ParentChildRelationship;
});