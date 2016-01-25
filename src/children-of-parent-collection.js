

angular.module('Relate').factory('ChildrenOfParentCollection', function($q) {
  
  var ChildrenOfParentCollection = function(db, parentCollection, childCollection, parentOfChildCollection, options) {
    this._db = db;
    this.parentCollection = parentCollection;
    this.childCollection = childCollection;
    this._index = {};
    // e.g. lnk_child_tasks_of_project 
    this.typeIdentifier = 'lnk_child_' + childCollection.itemName + 's_of_' + parentCollection.itemName;
    this.parentOfChildCollection = parentOfChildCollection;
  };
  
  ChildrenOfParentCollection.prototype._registerDocument = function(document, typeIdentifier) {
    this._index[document.parentId] = {document: document};
  };
  
  ChildrenOfParentCollection.prototype._fetch = function(result) {
    //Fetches a document -- internal use.
    if (!result.ok) {
      console.log(result);
      throw "Error fetching data";
    }
    return this._db.get(result.id);
  };
  
  ChildrenOfParentCollection.prototype.unlink = function(parentItem, childItem) {
    var indexEntry = this._index[parentItem._id];
    if (indexEntry) {
      //TOOD: remove id from list, put, chain etc...
    }
  };
  
  ChildrenOfParentCollection.prototype.link = function(parentItem, childItem) {
    // this creates a link.
    //TODO: deal with parent being null, which is allowed
    var self = this;
    var oldParent = self.parentOfChildCollection.getParent(childItem); //Can be undefined or null and this is OK.
    if (oldParent) {
      this.unlink(oldParent, childItem);
    }
    var indexEntry = this._index[parentItem._id];
    if (indexEntry) {
      // TODO: save and chain
      //Also: rearrange because we're fetching childItem from childCollection but we don't need to.
      indexEntry.document.childIds.push(childItem.Id);
      var liveChildren = indexEntry.liveChildren;
      if (angular.isUndefined(liveChildren)) {
        liveChildren = [];
        angular.forEach(indexEntry.document.childIds, function (childId) {
          liveChildren.push(self.childCollection.getItem(childId));
        });
        indexEntry.liveChildren = liveChildren;
      }
    } else {
      //create with post and link.
      //type: this.typeIdentifier
      //this._index[parentItem._id] = {document
    }
  };
  
  ChildrenOfParentCollection.prototype.removeParent = function(parentItem) {
    //
  };
  
  ChildrenOfParentCollection.prototype.removeChild = function(childItem) {
    //
  };
  
  ChildrenOfParentCollection.prototype.getChildren = function(parentItem) {
    //
  };
  
});
