
angular.module('Relate').factory('ParentOfChildCollection', function($q) {
  /*
  This is for internal use by ParentOfChildCollection.
  */
  var ParentOfChildCollection = function(db, parentCollection, childCollection, options) {
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this._index = {};
    this.typeIdentifier = ''; //this is set in ParentOfChildCollection
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
    // Creates a link.
    var self = this;
    if (parentItem) {
      parentItemId = parentItem._id;
    } else {
      parentItemId = null;
    }
    var indexEntry = this._index[childItem._id];
    if (indexEntry) {
      indexEntry.document.parentId = parentItemId;
      this._db.put(indexEntry.document).then(function (result) {
        indexEntry.document._rev = result.rev;
        indexEntry.liveObject = parentItem;
      });
    } else {
      var document = {
        parentId: parentItemId, 
        childId: childItem._id,
        type: this.typeIdentifier
      };
      this._db.post(document).then(function (result) {
        self._fetch(result).then(function (document) {
          self._registerDocument(document);
        });
      });
    }
  };
  
  ParentOfChildCollection.prototype.removeChild = function(childItem) {
    //
    var indexEntry = this._index[childItem._id];
    if (indexEntry) {
      //chain a delete, then remove key.
    }
  };
  
  ParentOfChildCollection.prototype.getParent = function(childItem) {
    //Returns actual object.
    var self = this;
    var indexEntry = this._index[childItem._id];
    if (indexEntry) {
      //TODO: decide how I want to model parentless objects.
      if (angular.isUndefined(indexEntry.liveObject)) {
        //TODO: can this fail?
        indexEntry.liveObject = self.parentCollection.getItem(indexEntry.document.parentId);
      } 
      return indexEntry.liveObject;
    } else {
      return null;
    }
  };
  
  return ParentOfChildCollection;
});

    