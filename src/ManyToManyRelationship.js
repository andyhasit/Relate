
angular.module('Relate').factory('ManyToManyRelationship', function($q, ItemParentRegister, ItemChildrenRegister, ValueRegister, util) {
  
  var ManyToManyRelationship = function(db, leftCollection, rightCollection, options)    {var self = this;
    var options = options || {};
    self.__rightCollection = rightCollection;
    self.__leftCollection = leftCollection;
    var defaultDbDocumentTypeName = ('lnk_' + leftCollection.itemName + '_' + rightCollection.itemName).toLowerCase();
    self.__functionNameEnd = '';
    if (options.qualifier) {
      self.__functionNameEnd = 'As' + util.capitalizeFirstLetter(options.qualifier);
      defaultDbDocumentTypeName += '_as_' + options.qualifier.toLowerCase();
    }
    self.dbDocumentType = options.dbDocumentType || defaultDbDocumentTypeName;
    self.__db = db;
    self.__rightCollection = rightCollection;
    self.__leftCollection = leftCollection;
    self.__rightLefts = {};
    self.__leftRights = {};
    rightCollection.registerRelationship(self);
    leftCollection.registerRelationship(self);
  };
  var def = ManyToManyRelationship.prototype;
  
  def.getAccessFunctionDefinitions = function()  {var self = this;
    var cap = util.capitalizeFirstLetter,
        leftName = cap(self.__leftCollection.itemName),
        leftPlural = cap(self.__leftCollection.plural),
        rightName = cap(self.__rightCollection.itemName),
        rightPlural = cap(self.__rightCollection.plural),
        end = self.__functionNameEnd,
        getLeftRightsFnName = 'get' + leftName + rightPlural + end,
        getRightLeftsFnName = 'get' + rightName + leftPlural + end,
        addLeftRightFnName = 'add' + leftName + rightName + end,
        removeLeftRightFnName = 'remove' + leftName + rightName + end;
    return [
      util.createAccessFunctionDefinition(getLeftRightsFnName, self.getLeftRights),
      util.createAccessFunctionDefinition(getRightLeftsFnName, self.getRightLefts),
      util.createAccessFunctionDefinition(addLeftRightFnName, self.addLeftToRight),
      util.createAccessFunctionDefinition(removeLeftRightFnName, self.removeLeftRight),
    ];
  };
  
  def.loadDocumentFromDb = function(doc)  {var self = this;
    doc.left
    __rightLefts[
    if (self.__index[document.childId]) {
      throw "Found duplicate item parent link in database."
    }
    var newIndexEntry = {document: document};
    self.__index[document.childId] = newIndexEntry;
    return newIndexEntry;
  };
  
  def.createLinks = function()  {var self = this;
    var key = self.__keyName;
    angular.forEach(self.__rightCollection.__items, function(rightItem) {
      self.__itemChildren[rightItem._id] = [];
    });
    angular.forEach(self.__leftCollection.__items, function(leftItem) {
      var rightId = leftItem[key];
      if (rightId) {
        var right = self.__rightCollection.__get__(rightId);
        self.__itemParent[leftItem._id] = right;
        self.__itemChildren[rightId].push(leftItem);
      }
    });
  }
  
  def.__getParent__ = function (leftItem)    {var self = this;
    return self.__itemParent[leftItem._id] || null;
    //return self.itemParentRegister.getParent(leftItem);
  };
  
  def.__getChildren__ = function (rightItem)    {var self = this;
    return self.__itemChildren[rightItem._id];
    //return self.itemChildrenRegister.getChildren(rightItem);
  };
  
  def.__setChildParent__ = function (leftItem, rightItem)    {var self = this;
    //TODO: assert they are of correct type?
    var oldParent = self.__itemParent[leftItem._id],
        rightItemId = rightItem? rightItem._id : null;
    if (oldParent) {
      util.removeFromArray(self.__itemChildren[oldParent._id], leftItem);
    }
    if (rightItem) {
      if (self.__itemChildren[rightItem._id] === undefined) {
        self.__itemChildren[rightItem._id] = [leftItem];
      } else {
        self.__itemChildren[rightItem._id].push(leftItem);
      }
    }
    self.__itemParent[leftItem._id] = rightItem;
    leftItem[self.__keyName] = rightItemId; 
    return self.__leftCollection.saveItem(leftItem);
  };
  
  def.respondToItemDeleted = function (item, collection)     {var self = this;
    if (collection === self.__rightCollection) {
      return self.__respondToParentDeleted(item);
    } else if (collection === self.__leftCollection) {
      return self.__respondToChildDeleted(item);
    } else {
      throw "Called respondToItemDeleted from wrong collection."
    }
  };
  
  def.__respondToParentDeleted = function (item)     {var self = this;
    var deferred = $q.defer();
    self.__rightDeleteInProgress.set(item, true);
    var leftDeletions = [];
    if (self.__cascadeDelete) {
      angular.forEach(self.__getChildren__(item), function (leftItem) {
        leftDeletions.push(self.__leftCollection.__delete__(leftItem));
      });
    }
    //Note that __rightDeleteInProgress will be set to false before promises are all resolved (non critical)
    self.__rightDeleteInProgress.set(item, false);
    $q.all(leftDeletions).then(function() {
      self.itemChildrenRegister.respondToParentDeleted(item);
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  def.__respondToChildDeleted = function (item)     {var self = this;
    var deferred = $q.defer(),
        leftDeletions = [],
        rightItem = self.__getParent__(item);
    leftDeletions.push(self.itemParentRegister.respondToChildDeleted(item));
    /* This is to prevent many calls to unlinking leftren of a right when the right will 
    be deleted anyway. Just to save on db writes.
    */
    if (rightItem && !self.__rightDeleteInProgress.get(rightItem)) {
      leftDeletions.push(self.itemChildrenRegister.respondToChildDeleted(item));
    }
    $q.all(leftDeletions).then(function() {
      deferred.resolve();
    });
    return deferred.promise;
  };
  
  return ManyToManyRelationship;
});