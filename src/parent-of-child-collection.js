
angular.module('Relate').factory('ParentOfChildCollection', function($q, BaseCollection) {
  /*
  This is for internal use by ParentOfChildCollection.
  */
  var ParentOfChildCollection = function(db, parentCollection, childCollection, options) {
    var options = options || {};
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this._index = {};
    // e.g. lnk_child_tasks_of_project
    this.typeIdentifier = options.parentOfChildTypeIdentifier ||
        'lnk_parent_' + parentCollection.itemName + '_of_' + childCollection.itemName;
  };
  ParentOfChildCollection.prototype = new BaseCollection();
  
  ParentOfChildCollection.prototype._registerDocument = function(document) {
    //TODO: check for duplicates here?
    var newIndexEntry = {document: document};
    this._index[document.childId] = newIndexEntry;
    return newIndexEntry;
  };
  
  ParentOfChildCollection.prototype.link = function(parentItem, childItem) {
    var self = this;
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
  
  ParentOfChildCollection.prototype.__setChildParent = function(indexEntry, parentItem) {
    var self = this;
    indexEntry.document.parentId = parentItemId;
    self._db.put(indexEntry.document).then(function (result) {
      indexEntry.document._rev = result.rev;
      indexEntry.liveObject = parentItem;
    });
  };
  
  ParentOfChildCollection.prototype.removeChild = function(childItem) {
    //
    var self = this;
    var deferred = $q.defer();
    var id = childItem._id;
    var indexEntry = this._index[id];
    if (indexEntry) {
      this._db.remove(indexEntry.document).then(function (result) {
        delete self._index[id];
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  ParentOfChildCollection.prototype.getParent = function(childItem) {
    //Returns actual object, or null.
    //TODO: is it OK for this to return null if not initialised?
    var self = this;
    var indexEntry = this._index[childItem._id];
    if (indexEntry && !indexEntry.pending) {
      if (angular.isUndefined(indexEntry.liveObject)) {
        var parent = self.parentCollection.getItem(indexEntry.document.parentId);
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
  
  return ParentOfChildCollection;
});

    