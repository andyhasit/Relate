
angular.module('Relate').factory('ItemChildrenRegister', function(util, $q, BaseContainer) {

  var ItemChildrenRegister = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    var childAlias = options.childAlias || childCollection.itemName;
    var parentAlias = options.parentAlias || parentCollection.itemName;
    self.dbDocumentType = 'lnk_child_' + childAlias + 's_of_' + parentAlias;
    self.__db = db;
    self.__parentCollection = parentCollection;
    self.__childCollection = childCollection;
    self.__cascadeDelete = options.cascadeDelete || false;
    self.__index = {};//format {parentId: {doc: Object, liveChildren: []}
    self.__reverseIndex = {};//format {childId: parentId}
  };
  util.inheritPrototype(ItemChildrenRegister, BaseContainer);
  var def = ItemChildrenRegister.prototype;
  
  def.loadDocumentFromDb = function(doc)     {var self = this;
    var parentId = doc.parentId;
    if (self.__index[parentId]) {
      throw "Found duplicate item children link in database."
    }
    var newEntry = {doc: doc};
    self.__index[parentId] = newEntry;
    angular.forEach(doc.childrenIds, function (childId) {
      self.__reverseIndex[childId] = parentId;
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

  def.linkChildToParent = function(parentItem, childItem)    {var self = this;
    var deferred = $q.defer(),
        parentItemId = parentItem? parentItem._id : null,
        indexEntry = self.__index[parentItemId],
        innerPromise;
    //Note: parentItemId and indexEntry could rightfully be null/undefined.
    self.__unlinkChildFromPreviousParent(childItem).then(function() {
      self.__reverseIndex[childItem._id] = parentItemId;
      if (indexEntry) {
        innerPromise = self.__addChildToIndexEntry(indexEntry, childItem);
      } else {
        innerPromise = self.__postAndLoad({
          parentId: parentItem._id,
          childrenIds: [childItem._id]
        });
      }
      innerPromise.then(function () {
        deferred.resolve();
      });
    });
    return deferred.promise;
  };

  def.respondToParentDeleted = function(parentItem)    {var self = this;
    var deferred = $q.defer();
    indexEntry = self.__index[parentItem._id];
    if (indexEntry) {
      if (self.__cascadeDelete && indexEntry.doc.childrenIds.length > 0) {
        debug(indexEntry);
        throw 'Cannot delete parent object as it still has children';
      } else {
        self.__db.remove(indexEntry.doc).then(function() {
          delete self.__index[parentItem._id];
          deferred.resolve();
        });
      }
    }
    return deferred.promise;
  };

  def.respondToChildDeleted = function(childItem)    {var self = this;
    return self.__unlinkChildFromPreviousParent(childItem);
  };

  def.__addChildToIndexEntry = function(indexEntry, childItem)    {var self = this;
    var deferred = $q.defer();
    self.__ensureIndexEntryHasLiveChildren(indexEntry);
    if (util.arrayContains(indexEntry.doc.childrenIds, childItem._id)) {
      deferred.resolve();
    } else {
      indexEntry.doc.childrenIds.push(childItem.Id);
      self.__db.put(indexEntry.doc).then(function() {
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
      var indexEntry = self.__index[oldParentId];
      util.removeFromArray(indexEntry.doc.childrenIds, childItem._id);
      self.__reverseIndex[childItem._id] = null;
      self.__db.put(indexEntry.doc).then(function() {
        self.__ensureIndexEntryHasLiveChildren(indexEntry);
        util.removeFromArray(indexEntry.liveChildren, childItem);
        deferred.resolve();
      });
    } else {
      deferred.resolve();
    }
    return deferred.promise;
  };

  def.__ensureIndexEntryHasLiveChildren = function(indexEntry)    {var self = this;
    var liveChildren = indexEntry.liveChildren;
    if (!liveChildren) {
      var liveChildren = [];
      angular.forEach(indexEntry.doc.childrenIds, function (childId) {
        liveChildren.push(self.__childCollection.getItem(childId));
      });
      indexEntry.liveChildren = liveChildren;
    }
  };

  return ItemChildrenRegister;
});
