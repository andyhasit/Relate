    
angular.module('Relate').factory('ChildrenOfParentCollection', function($q, BaseCollection) {
  
  var ChildrenOfParentCollection = function(db, parentCollection, childCollection, $window, options) {
    var options = options || {};
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    //format {parentId: {document: Object, liveChildren: []}
    this._index = {};
    //format {childId: parentId}
    this._reverseIndex = {};
    // e.g. lnk_child_tasks_of_project 
    this.typeIdentifier = options.childrenOfParentTypeIdentifier || 
        'lnk_child_' + childCollection.itemName + 's_of_' + parentCollection.itemName;
  };
  ChildrenOfParentCollection.prototype = new BaseCollection();
  
  ChildrenOfParentCollection.prototype.getChildren = function(parentItem) {
    var self = this;
    var indexEntry = this._index[parentItem._id];
    if (indexEntry && !indexEntry.pending) {
      self.__ensureIndexEntryHasLiveChildren(indexEntry);
      return indexEntry.liveChildren;
    } else {
      return [];
    }
  };
  
  ChildrenOfParentCollection.prototype.link = function(parentItem, childItem) {
    // this creates a link.
    //TODO: deal with parent being null, which is allowed
    var self = this;
    var oldParentId = self._reverseIndex[childItem._id];
    if (oldParentId) {
      this.__removeChildFromParent(oldParentId, childItem);
    }
    //TODO: do I need this?
    var parentItemId;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    this._reverseIndex[childItem._id] = parentItemId;
    
    if (parentItem) {
      //Cannote use __getIndexEntry here because action needs to be immediate.
      var indexEntry = this._index[parentItem._id];
      if (indexEntry) { // Parent is already in index
        if (indexEntry.pending) { // Db creation is pending
          indexEntry.pendingPromise.then( function(newEntry) {
            self.__addChildToParent(newEntry, childItem);
          });
        } else { // Db creation is not pending
          self.__addChildToParent(indexEntry, childItem);
        }
      } else { // Parent is not in index
        // Create a "pending" entry in the index, so we know not to create the document in db twice.
        var doc = {
            parentId: parentItem._id, 
            childIds: [childItem._id],
            type: self.typeIdentifier
          };
        self.__createPending(parentItem._id, doc);
      }
    }
  };
  
  ChildrenOfParentCollection.prototype.removeParent = function(parentItem) {
    //In response to a parent object being deleted.
    var self = this;
    self.__getIndexEntry(parentItem._id).then( function(indexEntry) {
      if (indexEntry) {
        if (indexEntry.document.childIds.length > 0) {
          throw 'Cannot delete parent object as it still has children';
        } else {
          self._db.remove(indexEntry.document).then(function() {
            delete self._index[parentItem._id];
          });
        }
      }
    });
  };
  
  ChildrenOfParentCollection.prototype.removeChild = function(childItem) {
    var oldParentId = this._reverseIndex[childItem._id];
    if (oldParentId) {
      this.__removeChildFromParent(oldParentId, childItem);
    }
  };
  
  ChildrenOfParentCollection.prototype._registerDocument = function(document) {
    var self = this;
    var newEntry = {document: document};
    self._index[document.parentId] = newEntry;
    angular.forEach(document.childIds, function (childId) {
      self._reverseIndex[childId] = document.parentId;
    });
    return newEntry;
  };
  
  function removeFromArray(array, item) {
    //will be unique in list.
    var index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
  }
  
  ChildrenOfParentCollection.prototype.__addChildToParent = function(indexEntry, childItem) {
    //TODO: check unique first.
    this.__ensureIndexEntryHasLiveChildren(indexEntry);
    indexEntry.document.childIds.push(childItem.Id);
    this._db.put(indexEntry.document).then(function() {
      indexEntry.liveChildren.push(childItem)
    });
  };
  
  ChildrenOfParentCollection.prototype.__removeChildFromParent = function(parentId, childItem) {
    //TODO: bug if try to unlink while still creation still pending?
    var self = this;
    self.__getIndexEntry(parentId).then( function(indexEntry) {
      removeFromArray(indexEntry.document.childIds, childItem._id);
      self._db.put(indexEntry.document).then(function() {
        removeFromArray(indexEntry.liveChildren, childItem);
      });
      delete self._reverseIndex[childItem._id];
    });
  };
  
  ChildrenOfParentCollection.prototype.__ensureIndexEntryHasLiveChildren = function(indexEntry) {
    var self = this;
    var liveChildren = indexEntry.liveChildren;
    if (!liveChildren) {
      liveChildren = [];
      if (indexEntry.document) {
        angular.forEach(indexEntry.document.childIds, function (childId) {
          liveChildren.push(self.childCollection.getItem(childId));
        });
      }
      indexEntry.liveChildren = liveChildren;
    }
  };
  
  return ChildrenOfParentCollection;
});
