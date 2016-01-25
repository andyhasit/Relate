
angular.module('Relate').factory('ParentOfChildCollection', function($q) {
  
  var ParentOfChildCollection = function(db, parentCollection, childCollection, options) {
    this.items = [];
  };
  
  ParentOfChildCollection.prototype._registerDocument = function(document, typeIdentifier) {
    this.items.push(document);
  };
  
  ParentOfChildCollection.prototype.getParent = function(childItem) {
    //
  };
  
  ParentOfChildCollection.prototype.forgetParent = function(parentItem) {
    //
  };
  
  ParentOfChildCollection.prototype.forgetChild = function(childItem) {
    //
  };
  
  return ParentOfChildCollection;
});


angular.module('Relate').factory('ChildrenOfParentCollection', function($q) {
  
  var ChildrenOfParentCollection = function(db, parentCollection, childCollection, options) {
    this.items = [];
  };
  
  ChildrenOfParentCollection.prototype._registerDocument = function(document, typeIdentifier) {
    this.items.push(document);
  };
  
  ChildrenOfParentCollection.prototype.link = function(parentItem, childItem) {
    // Creates a link.
    
  };
  
  ChildrenOfParentCollection.prototype.forgetParent = function(parentItem) {
    //
  };
  
  ChildrenOfParentCollection.prototype.forgetChild = function(childItem) {
    //
  };
  
  ChildrenOfParentCollection.prototype.getChildren = function(parentItem) {
    //
  };
  
});


    /*
    var oldParent = parentOfChildCollection.getParent(childItem);
    if (oldParent) {
      childrenOfParentCollection.removeChild(oldParent, childItem);
    }
    childrenOfParentCollection.addChild(parentItem, childItem);
    parentOfChildCollection.setParent(parentItem, childItem);
    
    
    var parentOfChildRecord = this._getParentOfChildRecord(childItem._id);
    */
    if (parentOfChildRecord) {
      /* Child does have an existing parent, so:
          update the parentOfChildRecord.
          get the childrenOfOldParentRecord for old parent and remove child.
      */
      var oldParentId = parentOfChildRecord.parentId;
      var childrenOfOldParentRecord = this._getChildrenOfParentRecord(oldParentId);
      //TODO: find remove solution... childrenOfOldParentRecord.children.remove
      parentOfChildRecord.parentId = parentItem._id;
    } else {
      /* Child did not previously have a parent, so:
          create parentOfChildRecord.
      */
    }
    var childrenOfNewParentRecord = this._getChildrenOfParentRecord(parentItem._id);
    if (childrenOfNewParentRecord) {
      
    }
    
    