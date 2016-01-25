
angular.module('Relate').factory('ParentOfChildCollection', function($q) {
  /*
  This is for internal use by ParentOfChildCollection.
  */
  var ParentOfChildCollection = function(db, parentCollection, childCollection, options) {
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this._index = {};
    // e.g. lnk_child_tasks_of_project
    this.typeIdentifier = 'lnk_parent_' + parentCollection.itemName + '_of_' + childCollection.itemName;
  };
  
  ParentOfChildCollection.prototype._registerDocument = function(document, typeIdentifier) {
    this._index[document.childId] = {document: document}; //TODO: check for duplicates here?
  };
  
  ParentOfChildCollection.prototype._fetch = function(result) {
    //Fetches a document -- internal use.
    if (!result.ok) {
      console.log(result);
      throw "Error fetching data";
    }
    return this._db.get(result.id);
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
      indexEntry.document.parentId = parentItemId;
      self._db.put(indexEntry.document).then(function (result) {
        indexEntry.document._rev = result.rev;
        indexEntry.liveObject = parentItem;
      });
    } else {
      var document = {
        parentId: parentItemId, 
        childId: childItem._id,
        type: self.typeIdentifier
      };
      self._db.post(document).then(function (result) {
        self._fetch(result).then(function (document) {
          self._registerDocument(document);
        });
      });
    }
  };
  
  ParentOfChildCollection.prototype.removeChild = function(childItem) {
    //
    var self = this;
    var id = childItem._id;
    var indexEntry = this._index[id];
    if (indexEntry) {
      this._db.remove(indexEntry.document).then(function (result) {
        delete self._index[id];
      });
    }
  };
  
  ParentOfChildCollection.prototype.getParent = function(childItem) {
    //Returns actual object, or null.
    var self = this;
    var indexEntry = this._index[childItem._id];
    if (indexEntry) {
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

    