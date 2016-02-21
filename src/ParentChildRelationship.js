
angular.module('Relate').factory('ParentChildRelationship', function($q, ItemParentRegister, ItemChildrenRegister, ValueRegister, util) {
  
  var ParentChildRelationship = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self.__parentCollection = parentCollection;
    self.__childCollection = childCollection;
    self.__childAlias = options.childAlias || childCollection.plural;
    self.__parentAlias = options.parentAlias || parentCollection.itemName;
    self.__keyName = '__' + self.__parentAlias;
    //-self.collectionName = 'lnk_' + self.__parentAlias + '_' + self.__childAlias;
    self.__parentDeleteInProgress = new ValueRegister();
    self.__parentCollection = parentCollection;
    self.__childCollection = childCollection;
    self.__cascadeDelete = options.cascadeDelete || true;
    //self.itemParentRegister = new ItemParentRegister(db, parentCollection, childCollection, options);
    //self.itemChildrenRegister = new ItemChildrenRegister(db, parentCollection, childCollection, options);
    self.__itemParent = {};
    self.__itemChildren = {};
    parentCollection.registerRelationship(self);
    childCollection.registerRelationship(self, self.__keyName);
  };
  var def = ParentChildRelationship.prototype;
  
  def.getAccessFunctionDefinitions = function()  {var self = this;
    var cap = util.capitalizeFirstLetter,
        getParentFnName = 'get' + cap(self.__childCollection.itemName) + cap(self.__parentAlias),
        getChildrenFnName = 'get' + cap(self.__parentCollection.itemName) + cap(self.__childAlias),
        setChildParentFnName = 'set' + cap(self.__childCollection.itemName) + cap(self.__parentAlias);
    return [
      util.createAccessFunctionDefinition(getParentFnName, self.__getParent__),
      util.createAccessFunctionDefinition(getChildrenFnName, self.__getChildren__),
      util.createAccessFunctionDefinition(setChildParentFnName, self.__setChildParent__),
    ];
  };
  
  def.createLinks = function()  {var self = this;
    var key = self.__keyName;
    angular.forEach(self.__parentCollection.__items, function(parentItem) {
      self.__itemChildren[parentItem._id] = [];
    });
    angular.forEach(self.__childCollection.__items, function(childItem) {
      var parentId = childItem[key];
      if (parentId) {
        var parent = self.__parentCollection.__get__(parentId);
        self.__itemParent[childItem._id] = parent;
        self.__itemChildren[parentId].push(childItem);
      }
    });
  }
  
  def.__getParent__ = function (childItem)    {var self = this;
    return self.__itemParent[childItem._id] || null;
    //return self.itemParentRegister.getParent(childItem);
  };
  
  def.__getChildren__ = function (parentItem)    {var self = this;
    return self.__itemChildren[parentItem._id];
    //return self.itemChildrenRegister.getChildren(parentItem);
  };
  
  def.__setChildParent__ = function (childItem, parentItem)    {var self = this;
    //TODO: assert they are of correct type?
    var oldParent = self.__itemParent[childItem._id],
        parentItemId = parentItem? parentItem._id : null;
    if (oldParent) {
      util.removeFromArray(self.__itemChildren[oldParent._id], childItem);
    }
    if (parentItem) {
      if (self.__itemChildren[parentItem._id] === undefined) {
        self.__itemChildren[parentItem._id] = [childItem];
      } else {
        self.__itemChildren[parentItem._id].push(childItem);
      }
    }
    self.__itemParent[childItem._id] = parentItem;
    childItem[self.__keyName] = parentItemId; 
    return self.__childCollection.saveItem(childItem);
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
    if (self.__cascadeDelete) {
      angular.forEach(self.__getChildren__(item), function (childItem) {
        childDeletions.push(self.__childCollection.__delete__(childItem));
      });
    }
    //Note that __parentDeleteInProgress will be set to false before promises are all resolved (non critical)
    self.__parentDeleteInProgress.set(item, false);
    $q.all(childDeletions).then(function() {
      self.itemChildrenRegister.respondToParentDeleted(item);
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  def.__respondToChildDeleted = function (item)     {var self = this;
    var deferred = $q.defer(),
        childDeletions = [],
        parentItem = self.__getParent__(item);
    childDeletions.push(self.itemParentRegister.respondToChildDeleted(item));
    /* This is to prevent many calls to unlinking children of a parent when the parent will 
    be deleted anyway. Just to save on db writes.
    */
    if (parentItem && !self.__parentDeleteInProgress.get(parentItem)) {
      childDeletions.push(self.itemChildrenRegister.respondToChildDeleted(item));
    }
    $q.all(childDeletions).then(function() {
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  return ParentChildRelationship;
});