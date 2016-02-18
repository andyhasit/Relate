
angular.module('Relate').factory('ParentChildRelationship', function($q, ParentOfChildCollection, ChildrenOfParentCollection, ValueRegister, util) {
  
  var ParentChildRelationship = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self.parentCollection = parentCollection;
    self.childCollection = childCollection;
    self.parentOfChildCollection = new ParentOfChildCollection(db, parentCollection, childCollection, options);
    self.childrenOfParentCollection = new ChildrenOfParentCollection(db, parentCollection, childCollection, options);
    self.collectionName = options.collectionName || 
        'lnk_' + parentCollection.itemName + '_' + childCollection.itemName + 's';
    parentCollection.registerRelationship(self);
    childCollection.registerRelationship(self);
    self._parentDeleteInProgress = new ValueRegister();
  };
  var def = ParentChildRelationship.prototype;
  
  def.getAccessFunctionDefinitions = function()    {var self = this;
    var singleItemActions = ['new', 'get', 'save', 'delete'],
        multipleItemActions = ['find'],
        childCollectionName = util.capitalizeFirstLetter(self.childCollection.itemName),
        parentCollectionName = util.capitalizeFirstLetter(self.parentCollection.itemName),
        getParentFnName = 'get' + childCollectionName + parentCollectionName,
        getChildrenFnName = 'get' + parentCollectionName + childCollectionName + 's',
        setChildParentFnName = 'set' + childCollectionName + parentCollectionName;
    return [
      util.createAccessFunctionDefinition(getParentFnName, self.__getParent__),
      util.createAccessFunctionDefinition(getChildrenFnName, self.__getChildren__),
      util.createAccessFunctionDefinition(setChildParentFnName, self.__setChildParent__),
    ];
  };
  
  def.__getParent__ = function (childItem)    {var self = this;
    return self.parentOfChildCollection.getParent(childItem);
  };
  
  def.__getChildren__ = function (parentItem)    {var self = this;
    return self.childrenOfParentCollection.getChildren(parentItem);
  };
  
  def.__setChildParent__ = function (childItem, parentItem)    {var self = this;
    self.parentOfChildCollection.link(parentItem, childItem);
    self.childrenOfParentCollection.link(parentItem, childItem);
    // TODO: chain promises?
  };
  
  def.onParentDeleted = function (item)     {var self = this;
    var deferred = $q.defer();
    self._parentDeleteInProgress.set(item, true);
    var childDeletions = [];
    angular.forEach(self.__getChildren__(item), function (childItem) {
      childDeletions.push(self.childCollection.remove(childItem));
    });
    //Note that _parentDeleteInProgress will be set to false before promises are all resolved (non critical)
    self._parentDeleteInProgress.set(item, false);
    $q.all(childDeletions).then(function() {
      self.childrenOfParentCollection.onParentDeleted(item);
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  def.onChildDeleted = function (item)     {var self = this;
    var deferred = $q.defer(),
        childDeletions = [],
        parentItem = self.__getParent__(item);
    childDeletions.push(self.parentOfChildCollection.onChildDeleted(item));
    /* This is to prevent many calls to unlinking children of a parent when the parent will 
    be deleted anyway. Just to save on db writes.
    */
    if (parentItem && !self._parentDeleteInProgress.get(parentItem)) {
      childDeletions.push(self.childrenOfParentCollection.onChildDeleted(item));
    }
    $q.all(childDeletions).then(function() {
      deferred.resolve();
    });
    return deferred.promise;
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
      angular.forEach(self.__getChildren__(item), function (childItem) {
        childDeletions.push(self.childCollection.remove(childItem));
      });
      //Note that _parentDeleteInProgress will be set to false before promises are all resolved (non critical)
      self._parentDeleteInProgress.set(item, false);
      $q.all(childDeletions).then(function() {
        self.childrenOfParentCollection.onParentDeleted(item);
        deferred.resolve();
      });
    } else {
      var parentItem = self.__getParent__(item);
      var childDeletions = [];
      childDeletions.push(self.parentOfChildCollection.onChildDeleted(item));
      if (parentItem && !self._parentDeleteInProgress.get(parentItem)) {
        childDeletions.push(self.childrenOfParentCollection.onChildDeleted(item));
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
      console.log(item);
      throw 'Unrecognised db object type: ' + itemType;
    }
  };

  return ParentChildRelationship;
});