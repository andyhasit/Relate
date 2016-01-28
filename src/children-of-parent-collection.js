
angular.module('Relate').factory('Test', function($window) {
    
    
   return function () {
     this.ok = false;
     if ($window.confirm('OK?')) {
       this.ok = true;
     }
   }   
});
    
angular.module('Relate').factory('ChildrenOfParentCollection', function($q) {
  
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
  
  ChildrenOfParentCollection.prototype._registerDocument = function(document) {
    var self = this;
    self._index[document.parentId] = {document: document};
    angular.forEach(document.childIds, function (childId) {
      self._reverseIndex[childId] = document.parentId;
    });
  };
  
  ChildrenOfParentCollection.prototype._fetch = function(result) {
    //Fetches a document -- internal use.
    if (!result.ok) {
      console.log(result);
      throw "Error fetching data";
    }
    return this._db.get(result.id);
  };
  
  function removeFromArray(array, item) {
    //will be unique in list.
    var index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
  }
  
  ChildrenOfParentCollection.prototype._unlink = function(parentId, childItem) {
    var self = this;
    var indexEntry = this._index[parentId];
    removeFromArray(indexEntry.document.childIds, childItem._id);
    self._db.put(indexEntry.document).then(function() {
      removeFromArray(indexEntry.liveChildren, childItem);
    });
    delete self._reverseIndex[childItem._id];
  };
  
  ChildrenOfParentCollection.prototype.link = function(parentItem, childItem) {
    // this creates a link.
    //TODO: deal with parent being null, which is allowed
    var self = this;
    var oldParent = self._reverseIndex[childItem._id];
    if (oldParent) {
      this._unlink(oldParent, childItem);
    }
    var parentItemId;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    if (parentItem) {
      //addChildToParent... //TODO: refactor out, and also make into promise chained off of unlink?
      var indexEntry = this._index[parentItem._id];
      if (indexEntry) {
        self._ensureIndexEntryHasLiveChildren(indexEntry);
        indexEntry.document.childIds.push(childItem.Id);
        self._db.put(indexEntry.document).then(function() {
          indexEntry.liveChildren.push(childItem)
        });
      } else {
        //TODO: resolve code duplication with other collection
        var document = {
          parentId: parentItem._id, 
          childIds: [childItem._id],
          type: self.typeIdentifier
        };
        self._db.post(document).then(function (result) {
          self._fetch(result).then(function (document) {
            self._registerDocument(document);
          });
        });
      }
    }
    this._reverseIndex[childItem._id] = parentItemId;
  };
  
  ChildrenOfParentCollection.prototype.removeParent = function(parentItem) {
    //In response to a parent object being deleted.
    var self = this;
    var indexEntry = this._index[parentItem._id];
    if (indexEntry) {
      if (indexEntry.document.childIds.length > 0) {
        throw 'Cannot delete parent object as it still has children';
      } else {
        this._db.remove(indexEntry.document).then(function() {
          delete self._index[parentItem._id];
        });
      }
    }
  };
  
  ChildrenOfParentCollection.prototype.removeChild = function(childItem) {
    var oldParent = this._reverseIndex[childItem._id];
    if (oldParent) {
      this._unlink(oldParent, childItem);
    }
  };
  
  ChildrenOfParentCollection.prototype._ensureIndexEntryHasLiveChildren = function(indexEntry) {
    var self = this;
    var liveChildren = indexEntry.liveChildren;
    if (angular.isUndefined(liveChildren)) {
      liveChildren = [];
      angular.forEach(indexEntry.document.childIds, function (childId) {
        liveChildren.push(self.childCollection.getItem(childId));
      });
      indexEntry.liveChildren = liveChildren;
    }
  };
  
  ChildrenOfParentCollection.prototype.getChildren = function(parentItem) {
    var self = this;
    var indexEntry = this._index[parentItem._id];
    if (indexEntry) {
      self._ensureIndexEntryHasLiveChildren(indexEntry);
      return indexEntry.liveChildren;
    } else {
      return [];
    }
  };
  
  return ChildrenOfParentCollection;
});
