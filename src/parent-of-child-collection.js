
angular.module('Relate').factory('ParentOfChildCollection', function($q) {
  /*
  This is for internal use by ParentChildRelationship.
  */
  var ParentOfChildCollection = function(db, parentCollection, childCollection, options) {
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this._index = {};
    this.typeIdentifier = ''; //this is set in ParentChildRelationship
  };
  
  ParentOfChildCollection.prototype._registerDocument = function(document, typeIdentifier) {
    this._index[document.childId] = {document: document}; //TODO: check for duplicates here?
  };
  
  ParentOfChildCollection.prototype.link = function(parentItem, childItem) {
    // Creates a link.
    var indexEntry = this._index[childItem._id];
    if (indexEntry) {
      //update & put indexEntry.document
      //save actual object.
    } else {
      //link this on the back of a post() promise
      var document = {
        parentId: parentItem._id, 
        childId: childItem._id
      };
      //this._db.post(document).get/fetch etc...
      this._index[childItem._id] = {
        document: {parentId:parentItem._id, childId:childItem._id},
        liveObject: parentItem
      };
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
      var liveObject = indexEntry.liveObject;
      //TODO: decide how I want to model parentless objects.
      if (angular.isUndefined(liveObject)) {
        //TODO: can this fail?
        liveObject = self.parentCollection.getById(indexEntry.document.parentId);
        indexEntry['liveObject'] = liveObject;
        return liveObject;
      }
    } else {
      return null;
    }
  };
  
  return ParentOfChildCollection;
});

    