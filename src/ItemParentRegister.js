
angular.module('Relate').factory('ItemParentRegister', function(util, $q, BaseCollection) {

  var ItemParentRegister = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self.dbDocumentType = options.parentOfChildDocumentType ||  // e.g. lnk_child_tasks_of_project
        'lnk_parent_' + parentCollection.itemName + '_of_' + childCollection.itemName;
    self.__db = db;    
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    self.__index = {};
  };
  util.inheritPrototype(ItemParentRegister, BaseCollection);
  var def = ItemParentRegister.prototype;

  def.loadDocumentFromDb = function(document)    {var self = this;
    //TODO: check for duplicates here?
    var newIndexEntry = {document: document};
    self.__index[document.childId] = newIndexEntry;
    return newIndexEntry;
  };
  
  def.getParent = function(childItem)    {var self = this;
    //Returns actual object, or null.
    //TODO: is it OK for this to return null if not initialised?
    var indexEntry = self.__index[childItem._id];
    if (indexEntry && !indexEntry.pending) {
      if (angular.isUndefined(indexEntry.liveObject)) {
        var parent = self.parentCollection.__get__(indexEntry.document.parentId);
        if (angular.isUndefined(parent)) {
          parent = null;
        }
        indexEntry.liveObject = parent;
      } 
      return indexEntry.liveObject;
    } else {
      return null;
    }
  };
  
  def.link = function(parentItem, childItem)    {var self = this;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    var indexEntry = self.__index[childItem._id];
    if (indexEntry) {
      if (indexEntry.pending) { // Db creation is pending
        indexEntry.pendingPromise.then( function(newEntry) {
          self.__setChildParent(newEntry, parentItem);
        });
      } else { // Db creation is not pending
        self.__setChildParent(indexEntry, parentItem);
      }
    } else {
      var document = {
        parentId: parentItemId, 
        childId: childItem._id
      };
      self.__createPending(childItem._id, document);
    }
  };
  
  def.onChildDeleted = function(childItem)    {var self = this;
    var deferred = $q.defer();
    var id = childItem._id;
    var indexEntry = self.__index[id];
    if (indexEntry) {
      self.__db.remove(indexEntry.document).then(function (result) {
        delete self.__index[id];
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  def.__setChildParent = function(indexEntry, parentItem)    {var self = this;
    indexEntry.document.parentId = parentItemId;
    self.__db.put(indexEntry.document).then(function (result) {
      indexEntry.document._rev = result.rev;
      indexEntry.liveObject = parentItem;
    });
  };
  
  return ItemParentRegister;
});

    