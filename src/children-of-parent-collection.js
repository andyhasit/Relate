
angular.module('Relate').factory('ChildrenOfParentCollection', function(util, $q, BaseCollection) {

  var ChildrenOfParentCollection = function(db, parentCollection, childCollection, $window, options)    {var self = this;
    var options = options || {};
    self._db = db;
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    self._index = {};//format {parentId: {document: Object, liveChildren: []}
    self._reverseIndex = {};//format {childId: parentId}
    self.typeIdentifier = options.childrenOfParentTypeIdentifier ||
        'lnk_child_' + childCollection.itemName + 's_of_' + parentCollection.itemName; // e.g. lnk_child_tasks_of_project
  };
  util.inheritPrototype(ChildrenOfParentCollection, BaseCollection);
  var def = ChildrenOfParentCollection.prototype;

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
  };

  def.link = function(parentItem, childItem)    {var self = this;
    /*
    If old parent: unlink (update db and indexEntry accoridingly)
      If new parent:


    */
    var deferred = $q.defer();
    self.__unlinkChildFromPreviousParent(childItem).then(function() {
      var innerDeferred;
      if (parentItem) {
        var indexEntry = self._index[parentItem._id];
        if (indexEntry) {
          innerDeferred = self.__addChildToParent(indexEntry, childItem);
        } else {
          var doc = {
              parentId: parentItem._id,
              childrenIds: [childItem._id]
            };
          innerDeferred = self.__createDocument(doc);
        }
        innerDeferred.then( function () {
          self._reverseIndex[childItem._id] = parentItem.id;
          deferred.resolve();
        });
      } else {
        //parent is null, no need to create a link
        delete self._reverseIndex[childItem._id];
        deferred.resolve();
      }
    });
    return deferred.promise;
  };

  def.onParentDeleted = function(parentItem)    {var self = this;
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

  def.onChildDelete = function(childItem)    {var self = this;
    return self.__unlinkChildFromPreviousParent(childItem);
  };

  def.__addChildToParent = function(indexEntry, childItem)    {var self = this;
    var deferred = $q.defer();
    self.__ensureIndexEntryHasLiveChildren(indexEntry);
    if (util.arrayContains(indexEntry.document.childrenIds, childItem._id)) {
      deferred.resolve();
    } else {
      indexEntry.document.childrenIds.push(childItem.Id);
      self._db.put(indexEntry.document).then(function() {
        indexEntry.liveChildren.push(childItem),
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  def.__unlinkChildFromPreviousParent = function(childItem)    {var self = this;
    var deferred = $q.defer();
    var oldParentId = self._reverseIndex[childItem._id];
    if (oldParentId) {
      self.__removeChildFromParent(oldParentId, childItem).then( function() {
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  };
  
  def.__removeChildFromParent = function(parentId, childItem)    {var self = this;
    var deferred = $q.defer();
    var indexEntry = self._index[parentId];
      util.removeFromArray(indexEntry.document.childrenIds, childItem._id);
      delete self._reverseIndex[childItem._id];
      self._db.put(indexEntry.document).then(function() {
        self.__ensureIndexEntryHasLiveChildren(indexEntry);
        util.removeFromArray(indexEntry.liveChildren, childItem);
        deferred.resolve();
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
      indexEntry.liveChildren = liveChildren;
    }
  };

  return ChildrenOfParentCollection;
});
