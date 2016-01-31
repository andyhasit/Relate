
angular.module('Relate').factory('ChildrenOfParentCollection', function(util, $q, ChildrenOfParentCollectionFunctions) {
  
  var Class = function(db, parentCollection, childCollection, $window, options)    {var self = this;
    var options = options || {};
    self._db = db;
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    self._index = {};//format {parentId: {document: Object, liveChildren: []}
    self._reverseIndex = {};//format {childId: parentId}
    // e.g. lnk_child_tasks_of_project 
    self.typeIdentifier = options.childrenOfParentTypeIdentifier || 
        'lnk_child_' + childCollection.itemName + 's_of_' + parentCollection.itemName;
  };
  util.inheritPrototype(Class, ChildrenOfParentCollectionFunctions);
  var def = Class.prototype;
  
  def.loadDocument = function(document)     {var self = this;
    var newEntry = {document: document};
    self._index[document.parentId] = newEntry;
    angular.forEach(document.childrenIds, function (childId) {
      self._reverseIndex[childId] = document.parentId;
    });
    return newEntry;
  };
  
  def.getChildren = function(parentItem)    {var self = this;
    var indexEntry = self._index[parentItem._id];
    if (indexEntry) {
      self.__ensureIndexEntryHasLiveChildren(indexEntry);
      return indexEntry.liveChildren;
    } else {
      return [];
    }
    /*
    if (indexEntry && !indexEntry.pending) {
      self.__ensureIndexEntryHasLiveChildren(indexEntry);
      return indexEntry.liveChildren;
    } else {
      return [];
    }
    */
  };
  
  def.link = function(parentItem, childItem)    {var self = this;
    // self creates a link.
    //TODO: deal with parent being null, which is allowed
    var oldParentId = self._reverseIndex[childItem._id];
    if (oldParentId) {
      debug(oldParentId);
      self.__removeChildFromParent(oldParentId, childItem);
    }
    //TODO: do I need self?
    var parentItemId;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    self._reverseIndex[childItem._id] = parentItemId;
    
    if (parentItem) {
      //Cannote use __getIndexEntry here because action needs to be immediate.
      var indexEntry = self._index[parentItem._id];
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
            childrenIds: [childItem._id]
          };
        self.__createPending(parentItem._id, doc);
      }
    } else {
      
    }
  };
  
  def.removeParent = function(parentItem)    {var self = this;
    //In response to a parent object being deleted.
    var deferred = $q.defer();
    self.__getIndexEntry(parentItem._id).then( function(indexEntry) {
      if (indexEntry) {
        if (indexEntry.document.childrenIds.length > 0) {
          debug(indexEntry);
          throw 'Cannot delete parent object as it still has children';
        } else {
          self._db.remove(indexEntry.document).then(function() {
            delete self._index[parentItem._id];
            deferred.resolve();
          });
        }
      }
    });
    return deferred.promise;
  };
  
  def.removeChild = function(childItem)    {var self = this;
    var oldParentId = self._reverseIndex[childItem._id];
    if (oldParentId) {
      return self.__removeChildFromParent(oldParentId, childItem);
    } else {
      return $q.when(null);
    }
  };
  
  return Class;
});

   
angular.module('Relate').factory('ChildrenOfParentCollectionFunctions', function(util, $q, BaseCollection) {
  
  var Class = function(db, parentCollection, childCollection, $window, options)    {var self = this;
    var options = options || {};
    self._db = db;
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    //format {parentId: {document: Object, liveChildren: []}
    self._index = {};
    //format {childId: parentId}
    self._reverseIndex = {};
    // e.g. lnk_child_tasks_of_project 
    self.typeIdentifier = options.childrenOfParentTypeIdentifier || 
        'lnk_child_' + childCollection.itemName + 's_of_' + parentCollection.itemName;
  };
  util.inheritPrototype(Class, BaseCollection);
  var def = Class.prototype;
  
  def.__addChildToParent = function(indexEntry, childItem)    {var self = this;
    //TODO: check unique first.
    self.__ensureIndexEntryHasLiveChildren(indexEntry);
    indexEntry.document.childrenIds.push(childItem.Id);
    self._db.put(indexEntry.document).then(function() {
      indexEntry.liveChildren.push(childItem)
    });
  };
  
  def.__removeChildFromParent = function(parentId, childItem)    {var self = this;
    //TODO: bug if try to unlink while still creation still pending?
    var deferred = $q.defer();
    self.__getIndexEntry(parentId).then( function(indexEntry) {
      util.removeFromArray(indexEntry.document.children, childItem._id);
      delete self._reverseIndex[childItem._id];
      self._db.put(indexEntry.document).then(function() {
        self.__ensureIndexEntryHasLiveChildren(indexEntry);
        util.removeFromArray(indexEntry.liveChildren, childItem);
        
        debug(indexEntry.document.childrenIds);
        deferred.resolve();
      });
    });
    return deferred.promise;
  };
  
  def.__ensureIndexEntryHasLiveChildren = function(indexEntry)    {var self = this;
    var liveChildren = indexEntry.liveChildren;
    if (!liveChildren) {
      var liveChildren = [];
      angular.forEach(indexEntry.document.childrenIds, function (childId) {
        liveChildren.push(self.childCollection.get(childId));
      });
      /*
      if (indexEntry.document) {
        angular.forEach(indexEntry.document.childrenIds, function (childId) {
          liveChildren.push(self.childCollection.get(childId));
        });
      }*/
      indexEntry.liveChildren = liveChildren;
    }
  };
  
  return Class;
});

