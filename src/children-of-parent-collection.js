
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
    //TODO: do I need this?
    var parentItemId;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    this._reverseIndex[childItem._id] = parentItemId;
    
    if (parentItem) {
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
        var document = {
          parentId: parentItem._id, 
          childIds: [childItem._id],
          type: self.typeIdentifier
        };
        // Create a "pending" entry in the index, so we know not to create the document in db twice.
        this._index[parentItem._id] = {
          pending: true,
          pendingPromise: self.__createLinkDocument(document)
        };
      }
    }
  };
  
  ChildrenOfParentCollection.prototype.__createDocument = function(document) {
    //Post then fetch a new document.
    var defer = $q.defer();
    var self = this;
    self._db.post(document).then( function (result) {
      if (result.ok) {
        self._db.get(result.id).then( function (document) {        
          defer.resolve(document);
        });
      } else {
        console.log(result);
        throw "Error fetching data";
      }
    });
    return defer.promise;
  };
  
  ChildrenOfParentCollection.prototype._fetch = function(result) {
    //Fetches a document -- internal use.
    if (!result.ok) {
      console.log(result);
      throw "Error fetching data";
    }
    return this._db.get(result.id);
  };
  
  ChildrenOfParentCollection.prototype.__createLinkDocument = function(document) {
    //Returns a promise which resolves to the new indexEntry.
    var defer = $q.defer();
    var self = this;
    self.__createDocument(document).then(function (docFromDb) {
      defer.resolve(self._registerDocument(docFromDb));
    });
    return defer.promise;
  };
  
  ChildrenOfParentCollection.prototype.__addChildToParent = function(indexEntry, childItem) {
    //TODO: check unique first.
    this._ensureIndexEntryHasLiveChildren(indexEntry);
    indexEntry.document.childIds.push(childItem.Id);
    this._db.put(indexEntry.document).then(function() {
      indexEntry.liveChildren.push(childItem)
    });
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
