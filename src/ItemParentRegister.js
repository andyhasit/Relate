
angular.module('Relate').factory('ItemParentRegister', function(util, $q, BaseCollection) {

  var ItemParentRegister = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    var childAlias = options.childAlias || childCollection.itemName;
    var parentAlias = options.parentAlias || parentCollection.itemName;
    self.dbDocumentType = 'lnk_parent_' + parentAlias + '_of_' + childAlias;
    self.__db = db;
    self.__index = {};
    self.__parentCollection = parentCollection;
  };
  util.inheritPrototype(ItemParentRegister, BaseCollection);
  var def = ItemParentRegister.prototype;

  def.loadDocumentFromDb = function(document)    {var self = this;
    if (self.__index[document.childId]) {
      throw "Found duplicate item parent link in database."
    }
    var newIndexEntry = {document: document};
    self.__index[document.childId] = newIndexEntry;
    return newIndexEntry;
  };
  
  def.getParent = function(childItem)    {var self = this;
    var indexEntry = self.__index[childItem._id];
    if (indexEntry) {
      if (angular.isUndefined(indexEntry.liveObject)) {
        indexEntry.liveObject = self.__parentCollection.__get__(indexEntry.document.parentId) || null;
      }
      return indexEntry.liveObject;
    }
    return null;
  };
  
  def.linkChildToParent = function(parentItem, childItem)    {var self = this;
    var deferred = $q.defer(),
        parentItemId = parentItem? parentItem._id : null,
        indexEntry = self.__index[childItem._id];
    if (indexEntry) {
      indexEntry.document.parentId = parentItemId;
      self.__db.put(indexEntry.document).then(function (result) {
        indexEntry.document._rev = result.rev;
        indexEntry.liveObject = parentItem;
        deferred.resolve();
      });
    } else {
      self.__postAndLoad({
        parentId: parentItemId, 
        childId: childItem._id
      }).then(function (result) {
        deferred.resolve();
      });      
    }
    return deferred.promise;
  };
  
  def.respondToChildDeleted = function(childItem)    {var self = this;
    var deferred = $q.defer(),
        id = childItem._id,
        indexEntry = self.__index[id];
    if (indexEntry) {
      self.__db.remove(indexEntry.document).then(function (result) {
        delete self.__index[id];
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  return ItemParentRegister;
});

    