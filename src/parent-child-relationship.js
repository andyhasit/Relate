
angular.module('Relate').factory('ParentChildRelationship', function($q, ItemParentRegister, ItemChildrenRegister, ValueRegister, util) {
  
  var ParentChildRelationship = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self.collectionName = options.collectionName || 
        'lnk_' + parentCollection.itemName + '_' + childCollection.itemName + 's';
    self.__parentDeleteInProgress = new ValueRegister();
    self.__parentCollection = parentCollection;
    self.__childCollection = childCollection;
    self.__itemParentRegister = new ItemParentRegister(db, parentCollection, childCollection, options);
    self.__itemChildrenRegister = new ItemChildrenRegister(db, parentCollection, childCollection, options);
    parentCollection.registerRelationship(self);
    childCollection.registerRelationship(self);
  };
  var def = ParentChildRelationship.prototype;
  
  def.getAccessFunctionDefinitions = function()    {var self = this;
    var singleItemActions = ['new', 'get', 'save', 'delete'],
        multipleItemActions = ['find'],
        __childCollectionName = util.capitalizeFirstLetter(self.__childCollection.itemName),
        __parentCollectionName = util.capitalizeFirstLetter(self.__parentCollection.itemName),
        getParentFnName = 'get' + __childCollectionName + __parentCollectionName,
        getChildrenFnName = 'get' + __parentCollectionName + __childCollectionName + 's',
        setChildParentFnName = 'set' + __childCollectionName + __parentCollectionName;
    return [
      util.createAccessFunctionDefinition(getParentFnName, self.__getParent__),
      util.createAccessFunctionDefinition(getChildrenFnName, self.__getChildren__),
      util.createAccessFunctionDefinition(setChildParentFnName, self.__setChildParent__),
    ];
  };
  
  def.__getParent__ = function (childItem)    {var self = this;
    return self.__itemParentRegister.getParent(childItem);
  };
  
  def.__getChildren__ = function (parentItem)    {var self = this;
    return self.__itemChildrenRegister.getChildren(parentItem);
  };
  
  def.__setChildParent__ = function (childItem, parentItem)    {var self = this;
    self.__itemParentRegister.link(parentItem, childItem);
    self.__itemChildrenRegister.link(parentItem, childItem);
    // TODO: chain promises?
  };
  
  def.respondToItemDeleted = function (item, collection)     {var self = this;
    if (collection === self.__parentCollection) {
      return self.__respondToParentDeleted(item);
    } else if (collection === self.__childCollection) {
      return self.__respondToChildDeleted(item);
    } else {
      throw "Called respondToItemDeleted from wrong collection."
    }
  };
  
  def.__respondToParentDeleted = function (item)     {var self = this;
    var deferred = $q.defer();
    self.__parentDeleteInProgress.set(item, true);
    var childDeletions = [];
    angular.forEach(self.__getChildren__(item), function (childItem) {
      childDeletions.push(self.__childCollection.remove(childItem));
    });
    //Note that __parentDeleteInProgress will be set to false before promises are all resolved (non critical)
    self.__parentDeleteInProgress.set(item, false);
    $q.all(childDeletions).then(function() {
      self.__itemChildrenRegister.onParentDeleted(item);
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  def.__respondToChildDeleted = function (item)     {var self = this;
    var deferred = $q.defer(),
        childDeletions = [],
        parentItem = self.__getParent__(item);
    childDeletions.push(self.__itemParentRegister.onChildDeleted(item));
    /* This is to prevent many calls to unlinking children of a parent when the parent will 
    be deleted anyway. Just to save on db writes.
    */
    if (parentItem && !self.__parentDeleteInProgress.get(parentItem)) {
      childDeletions.push(self.__itemChildrenRegister.onChildDeleted(item));
    }
    $q.all(childDeletions).then(function() {
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  return ParentChildRelationship;
});