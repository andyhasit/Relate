
angular.module('Relate').factory('ChildrenOfParentCollection', function(util, $q, BaseCollection) {

  var ChildrenOfParentCollection = function(db, parentCollection, childCollection, $window, options)    {var self = this;
    var options = options || {};
    self.dbDocumentType = options.childrenOfParentDocumentType || // e.g. lnk_child_tasks_of_project
        'lnk_child_' + childCollection.itemName + 's_of_' + parentCollection.itemName; 
        
    self.__db = db;
    self.__parentCollection = parentCollection;
    self.__childCollection = childCollection;
    self.__index = {};//format {parentId: {document: Object, liveChildren: []}
    self.__reverseIndex = {};//format {childId: parentId}
    
  };
  util.inheritPrototype(ChildrenOfParentCollection, BaseCollection);
  var def = ChildrenOfParentCollection.prototype;
  
  def.loadDocumentFromDb = function(document)     {var self = this;
    var newEntry = {document: document};
    self.__index[document.parentId] = newEntry;
    angular.forEach(document.childrenIds, function (childId) {
      self.__reverseIndex[childId] = document.parentId;
    });
    return newEntry;
  };

  def.getChildren = function(parentItem)    {var self = this;
    var indexEntry = self.__index[parentItem._id];
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
        var indexEntry = self.__index[parentItem._id];
        if (indexEntry) {
          innerDeferred = self.__addChildToParent(indexEntry, childItem);
        } else {
          var doc = {
              parentId: parentItem._id,
              childrenIds: [childItem._id]
            };
          innerDeferred = self.__createDocumentInDb(doc);
        }
        innerDeferred.then( function () {
          self.__reverseIndex[childItem._id] = parentItem.id;
          deferred.resolve();
        });
      } else {
        //parent is null, no need to create a link
        delete self.__reverseIndex[childItem._id];
        deferred.resolve();
      }
    });
    return deferred.promise;
  };

  def.onParentDeleted = function(parentItem)    {var self = this;
    //In response to a parent object being deleted.
    var deferred = $q.defer();
    indexEntry = self.__index[parentItem._id];
    if (indexEntry) {
      if (indexEntry.document.childrenIds.length > 0) {
        debug(indexEntry);
        throw 'Cannot delete parent object as it still has children';
      } else {
        self.__db.remove(indexEntry.document).then(function() {
          delete self.__index[parentItem._id];
          deferred.resolve();
        });
      }
    }
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
      self.__db.put(indexEntry.document).then(function() {
        indexEntry.liveChildren.push(childItem),
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  def.__unlinkChildFromPreviousParent = function(childItem)    {var self = this;
    var deferred = $q.defer();
    var oldParentId = self.__reverseIndex[childItem._id];
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
    var indexEntry = self.__index[parentId];
      util.removeFromArray(indexEntry.document.childrenIds, childItem._id);
      delete self.__reverseIndex[childItem._id];
      self.__db.put(indexEntry.document).then(function() {
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
        liveChildren.push(self.__childCollection.__get__(childId));
      });
      indexEntry.liveChildren = liveChildren;
    }
  };

  return ChildrenOfParentCollection;
});
