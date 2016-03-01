
angular.module('Relate').factory('ParentChildRelationship', function($q, BaseContainer, ValueRegister, util) {

  var ParentChildRelationship = function(db, parentCollection, childCollection, options)    {var self = this;
    var options = options || {};
    self.__db = db;
    self.__parentCollection = parentCollection;
    self.__childCollection = childCollection;
    self.__childAlias = options.childAlias || childCollection.plural;
    self.__parentAlias = options.parentAlias || parentCollection.itemName;
    self.__parentDeleteInProgress = new ValueRegister();
    self.__cascadeDelete = (options.cascadeDelete === undefined)? true : options.cascadeDelete;
    self.__itemParent = {};
    self.__itemChildren = {};
    self.name = 'relationship_' + childCollection.itemName + '_as_' + self.__childAlias + '_' +
          parentCollection.itemName + '_as_' + self.__parentAlias;
    self.foreignKey = '__' + self.__parentAlias;
    parentCollection.registerRelationship(self);
    childCollection.registerRelationship(self, self.foreignKey);
  };
  util.inheritPrototype(ParentChildRelationship, BaseContainer);
  var def = ParentChildRelationship.prototype;

  def.getAccessFunctionDefinitions = function()  {var self = this;
    var capitalize = util.capitalizeFirstLetter,
        buildFunc = util.createAccessFunctionDefinition,
        childName = capitalize(self.__childCollection.itemName),
        childAlias = capitalize(self.__childAlias),
        parentName = capitalize(self.__parentCollection.itemName),
        parentAlias = capitalize(self.__parentAlias);
    return [
      buildFunc('get' + childName + parentAlias, self.getParent, false),
      buildFunc('get' + parentName + childAlias, self.getChildren, false),
      buildFunc('set' + childName + parentAlias, self.setChildParent, true),
    ];
  };

  def.postInitialLoading = function()  {var self = this;
    var key = self.foreignKey;
    angular.forEach(self.__parentCollection.__items, function(parentItem) {
      self.__itemChildren[parentItem._id] = [];
    });
    angular.forEach(self.__childCollection.__items, function(childItem) {
      var parentId = childItem[key];
      if (parentId) {
        var parent = self.__parentCollection.getItem(parentId);
        self.__itemParent[childItem._id] = parent;
        self.__itemChildren[parentId].push(childItem);
      }
    });
  }

  def.getParent = function (childItem)    {var self = this;
    return self.__itemParent[childItem._id] || null;
  };

  def.getChildren = function (parentItem)    {var self = this;
    return self.__itemChildren[parentItem._id] || [];
  };

  def.setChildParent = function (childItem, parentItem)    {var self = this;
    //TODO: assert they are of correct type?
    var oldParent = self.__itemParent[childItem._id];
    var parentItemId = parentItem? parentItem._id : null;
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
    childItem[self.foreignKey] = parentItemId;
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

  def.__respondToParentDeleted = function (parentItem)     {var self = this;
    var action = (self.__cascadeDelete)?
        function(childItem) {return self.__childCollection.deleteItem(childItem)} :
        function(childItem) {return self.setChildParent(childItem, null)};
    // works with
    //action = function(childItem){return $q.when($q.when($q.when(childItem._id)))};
    action = function(childItem) {
      return self.__childCollection.deleteItem(childItem);
    }
    var children = self.getChildren(parentItem);
    return $q.all(children.map(action)).then(function() {
      delete self.__itemChildren[parentItem._id];
      return $q.when(true);
    }, util.promiseFailed);
  };

  def.__respondToParentDeletedTemp = function (parentItem)     {var self = this;
    var deferred = $q.defer();
    var action = (self.__cascadeDelete)?
        function(childItem) {return self.__childCollection.deleteItem(childItem)} :
        function(childItem) {return self.setChildParent(childItem, null)};
    // works with
    //action = function(childItem){return $q.when($q.when($q.when(childItem._id)))};
    var children = self.getChildren(parentItem);
    c.log(children.map(function(childItem){return childItem._id}));

    var cascadedActionPromises = children.map(function(childItem) {
      c.log('loop on ' + childItem._id);
      return action(childItem);
    });
    c.log(cascadedActionPromises);
    /*
    var cascadedActionPromises = children.map(action);
    var cascadedActionPromises = children.map(function(childItem) {
      var p = action(childItem);
      p.then(function(result) {
        c.log("promise success");
      });
      return p;
    });
      function (childItem) {
        c.log('processing ' + childItem._id);
        return action(childItem);
      });


    angular.forEach(self.getChildren(parentItem), function (childItem) {
      c.log('Found child ' + childItem._id);
      d = myAction(childItem);
      d.then(function(r) {c.log('22' + r)}, function(r) {c.log('55' + r)});
      c.log(d);
      //cascadedmyActionPromises.push(myAction(childItem));
    });
    */
    //Note that __parentDeleteInProgress will be set to false before promises are all resolved (non critical)
    //self.__parentDeleteInProgress.set(item, false);
    $q.all(cascadedActionPromises).then(function() {
      delete self.__itemChildren[parentItem._id];
      deferred.resolve();
    }, util.promiseFailed);
    return deferred.promise;
  };


  //self.__parentDeleteInProgress.set(item, true);

  def.__respondToChildDeleted = function (childItem)     {var self = this;
    //return $q.when(true);
    //var deferred = $q.defer();
    var parentItem = self.getParent(childItem);
                                                          c.log(childItem._id)
    if (parentItem) {
      c.log(parentItem);
      util.removeFromArray(self.__itemChildren[parentItem._id], childItem);
    }
    delete self.__itemParent[childItem._id];
    return $q.when(true);
    /*
    var childDeletions = [];
    childDeletions.push(self.itemParentRegister.respondToChildDeleted(item));
    This is to prevent many calls to unlinking children of a parent when the parent will
    be deleted anyway. Just to save on db writes.

    if (parentItem && !self.__parentDeleteInProgress.getItem(parentItem)) {
      childDeletions.push(self.itemChildrenRegister.respondToChildDeleted(item));
    }
    $q.all(childDeletions).then(function() {
      deferred.resolve();
    });
    */
    deferred.resolve();
    return deferred.promise;
  };

  return ParentChildRelationship;
});
