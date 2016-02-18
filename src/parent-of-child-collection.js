
angular.module('Relate').factory('ParentOfChildCollection', function(util, $q, BaseCollection) {

  var Class = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self._db = db;
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    self._index = {};
    // e.g. lnk_child_tasks_of_project
    self.typeIdentifier = options.parentOfChildTypeIdentifier ||
        'lnk_parent_' + parentCollection.itemName + '_of_' + childCollection.itemName;
  };
  util.inheritPrototype(Class, BaseCollection);
  var def = Class.prototype;

  def.loadDocument = function(document)    {var self = this;
    //TODO: check for duplicates here?
    var newIndexEntry = {document: document};
    self._index[document.childId] = newIndexEntry;
    return newIndexEntry;
  };
  
  def.link = function(parentItem, childItem)    {var self = this;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    var indexEntry = self._index[childItem._id];
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
  
  def.__setChildParent = function(indexEntry, parentItem)    {var self = this;
    indexEntry.document.parentId = parentItemId;
    self._db.put(indexEntry.document).then(function (result) {
      indexEntry.document._rev = result.rev;
      indexEntry.liveObject = parentItem;
    });
  };
  
  def.onChildDeleted = function(childItem)    {var self = this;
    var deferred = $q.defer();
    var id = childItem._id;
    var indexEntry = self._index[id];
    if (indexEntry) {
      self._db.remove(indexEntry.document).then(function (result) {
        delete self._index[id];
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  def.getParent = function(childItem)    {var self = this;
    //Returns actual object, or null.
    //TODO: is it OK for this to return null if not initialised?
    var indexEntry = self._index[childItem._id];
    if (indexEntry && !indexEntry.pending) {
      if (angular.isUndefined(indexEntry.liveObject)) {
        var parent = self.parentCollection.get(indexEntry.document.parentId);
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
  
  return Class;
});

    