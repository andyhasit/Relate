
angular.module('Relate').factory('ParentChildRelationship', function($q, ParentOfChildCollection, ChildrenOfParentCollection, ValueRegister, util) {
  /*
  
  */

  var Class = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self._db = db;
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    self.parentOfChildCollection = new ParentOfChildCollection(db, parentCollection, childCollection, options);
    self.childrenOfParentCollection = new ChildrenOfParentCollection(db, parentCollection, childCollection, options);
    self.collectionName = options.collectionName || 
        'lnk_' + parentCollection.itemName + '_' + childCollection.itemName + 's';
    parentCollection._registerRelationship(self);
    childCollection._registerRelationship(self);
    self._parentDeleteInProgress = new ValueRegister();
  };
  var def = Class.prototype;
  
  def.getAccessFunctions = function()    {var self = this;
    //Registers a relationship -- internal use.
    var singleItemActions = ['new', 'get', 'save', 'delete'];
    var multipleItemActions = ['find'];
    function getCollectionName(collection) {
      return util.capitalizeFirstLetter(self[collection].itemName)
    }
    var getParentFnName = 'get' + getCollectionName('childCollection') + getCollectionName('parentCollection');
    var getChildrenFnName = 'get' + getCollectionName('parentCollection') + getCollectionName('childCollection') + 's';
    var setChildParentFnName = 'set' + getCollectionName('childCollection') + getCollectionName('parentCollection');
    return [
      util.createAccessFunctionDefinition(getParentFnName, self.getParent),
      util.createAccessFunctionDefinition(getChildrenFnName, self.getChildren),
      util.createAccessFunctionDefinition(setChildParentFnName, self.setParent),
    ];
  };
  
  def.getParent = function (childItem)    {var self = this;
    return self.parentOfChildCollection.getParent(childItem);
  };
  
  def.getChildren = function (parentItem)    {var self = this;
    return self.childrenOfParentCollection.getChildren(parentItem);
  };
  
  def.setParent = function (childItem, parentItem)    {var self = this;
    //Sets the parent of the child, unlinking child from previous parent if applicable.
    self.parentOfChildCollection.link(parentItem, childItem);
    self.childrenOfParentCollection.link(parentItem, childItem);
    // TODO: chain promises?
  };
  
  def._removeItem = function (item)     {var self = this;
    /* Gets called when an item is deleted 
    item can be the parent or the child in the relationship.
    If delete is called on the parent:
      call collection.delete on all children (which will call relationship.delete) 
      remove from childrenOfParentCollection
    If called on the child:
      remove from parentOfChildCollection
      remove from childrenOfParentCollection (but skip this step if it was called as part of parent delete)
    
    */
    var deferred = $q.defer();
    if (self._isParentType(item)) {
      self._parentDeleteInProgress.set(item, true);
      var childDeletions = [];
      angular.forEach(self.getChildren(item), function (childItem) {
        childDeletions.push(self.childCollection.remove(childItem));
      });
      //Note that _parentDeleteInProgress will be set to false before promises are all resolved (non critical)
      self._parentDeleteInProgress.set(item, false);
      $q.all(childDeletions).then(function() {
        self.childrenOfParentCollection.removeParent(item);
        deferred.resolve();
      });
    } else {
      var parentItem = self.getParent(item);
      var childDeletions = [];
      childDeletions.push(self.parentOfChildCollection.removeChild(item));
      if (parentItem && !self._parentDeleteInProgress.get(parentItem)) {
        childDeletions.push(self.childrenOfParentCollection.removeChild(item));
      }
      $q.all(childDeletions).then(function() {
        deferred.resolve();
      });
    }
    return deferred.promise;
  };
  
  def._isParentType = function (item)    {var self = this;
    var itemType = item.document.type;
    if (itemType === self.parentCollection.typeIdentifier) {
      return true;
    } else if (itemType === self.parentCollection.typeIdentifier) {
      return false;
    } else {
      c.log(item);
      throw 'Unrecognised db object type: ' + itemType;
    }
  };

  return Class;
});