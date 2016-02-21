
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
    self.__leftCollection = leftCollection;
    self.__rightCollection = rightCollection;
    self.__leftRights = {};
    self.__rightLefts = {};
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
        removeLeftRightFnName = 'remove' + leftName + rightName + end,
        isLeftLinkedToRightFnName = 'is' + leftName + 'LinkedTo' + rightName + end;
    return [
      util.createAccessFunctionDefinition(getLeftRightsFnName, self.getLeftRights),
      util.createAccessFunctionDefinition(getRightLeftsFnName, self.getRightLefts),
      util.createAccessFunctionDefinition(addLeftRightFnName, self.addLeftToRight),
      util.createAccessFunctionDefinition(removeLeftRightFnName, self.removeLeftRight),
      util.createAccessFunctionDefinition(isLeftLinkedToRightFnName, self.isLeftLinkedToRight)
    ];
  };
  
  def.loadDocumentFromDb = function(doc)  {var self = this;
    if (doc.right && doc.left && self.__updateOneRegisterWithDocument(self.__leftRights, doc.left, doc.right)) {
      self.__updateOneRegisterWithDocument(self.__rightLefts, doc.right, doc.left);
    } else {
      self.__sendDocumentToReusePile(doc);
    }
  };
  
  //TODO: should this be nested in loadDocumentFromDb?
  def.__updateOneRegisterWithDocument = function(register, key, id, doc)  {var self = this;
    var entry = register[key];
    if (entry === undefined) {
      register[key] = {ids: [id], docs: [doc]};
    } else {
      if (entry.docs[id]) {
        return false;
      }
      entry.ids.push(id);
      entry.docs[id] = doc;
    }
    return true;
  };
  
  def.createLinks = function()  {var self = this;
    //nothing, we now lazy load.
    /*
    function replaceIdsWithReferences (register, collection) {
      angular.forEach(register, function(entry, key) {
        angular.forEach(entry.ids, function(id, index) {
          //TODO: discard doc if it doesn't exist.
          entry.items[index] = collection.get(id);
        });
      });
    }
    replaceIdsWithReferences(self.__leftRights, self.__rightCollection);
    replaceIdsWithReferences(self.__rightLefts, self.__leftCollection);
    */
  };
  
  def.getLeftRights = function (leftItem)  {var self = this;
    return self.__getInitialisedEntry(self.__leftRights, leftItem._id).items;
  };
  
  def.getRightLefts = function (rightItem)  {var self = this;
    return self.__getInitialisedEntry(self.__rightLefts, rightItem._id).items;
  };
  
  //TODO: assert they are of correct type?
  def.addLeftRight = function (leftItem, rightItem)    {var self = this;
    if (self.isLeftLinkedToRight(leftItem, rightItem)) {
      return $q.when();
    } else {
      var deferred = $q.defer();
      self.__writeLinkToDatabase(leftItem, rightItem).then(function(){
        //will have gone through loadDocumentFromDb so id and doc set, 
        var leftEntry = self.__getInitialisedEntry(self.__leftRights, leftItem._id),
            rightEntry = self.__getInitialisedEntry(self.__rightLefts, rightItem._id);
        util.addUnique(leftEntry.items, rightItem);
        util.addUnique(rightEntry.items, leftItem);
        deferred.resolve()
      });
      return deferred.promise; 
    };
    
    /*
    Left and right may be absent from register.
    Both registers will always be equal and complimentary:
    {
       p1: {items: [t6]}
       p2: {items: [t4, t6]}
    }
    {
       t6: {items: [p1, p2]},
       t4: {items: [p2]},
    }
    
    */
  };
  
  def.removeLeftRight = function (leftItem, rightItem)    {var self = this;
    //TODO...
  };
   
  def.isLeftLinkedToRight = function (leftItem, rightItem)    {var self = this;
    var leftEntry = self.__leftRights[leftItem._id];
    if (leftEntry) {
      return util.arrayContains(leftEntry.ids, rightItem.id);
    }
    return false;
  };
  
  def.respondToItemDeleted = function (item, collection)     {var self = this;
  //TODO...
    if (collection === self.__rightCollection) {
      return self.__respondToParentDeleted(item);
    } else if (collection === self.__leftCollection) {
      return self.__respondToChildDeleted(item);
    } else {
      throw "Called respondToItemDeleted from wrong collection."
    }
  };
  
  def.__writeLinkToDatabase = function(leftItem, rightItem)  {var self = this;
    // TODO if self.__docsForReuse length, then pop, update, put and loadFromDb. else: createAndLoad.
  };
  
  def.__sendDocumentToReusePile = function(doc)  {var self = this;
    self.__docsForReuse.push(doc);
  };
  
  def.__getInitialisedEntry = function (register, id)  {var self = this;
    var entry = register[id];
    if (entry === undefined) {
      entry = {ids: [], docs: [doc]}
      register[id] = newEntry;
    } else {
      if (entry.items === undefined) {
        var collection = (register === self.__leftRights)? self.__leftCollection : self.__rightCollection; 
        entry.items = [];
        angular.forEach(entry.ids, function(id, index) {
          //TODO: discard doc if item doesn't exist?
          entry.items.push(collection.get(id));
        });
      }
    }
    return entry;
  };
  
  def.__loadEntryItems = function(entry, collection) {
    if (entry.items === undefined) {
      entry.items = [];
      angular.forEach(entry.ids, function(id, index) {
        //TODO: discard doc if item doesn't exist.
        entry.items[index] = collection.get(id);
      });
    }
  };
  
  return ManyToManyRelationship;
});