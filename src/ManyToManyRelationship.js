    
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
    
angular.module('Relate').factory('ManyToManyRelationship', function($q, BaseContainer, util) {
  
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
    self.name = self.dbDocumentType;
    self.__db = db;
    self.__leftCollection = leftCollection;
    self.__rightCollection = rightCollection;
    self.__leftRights = {};
    self.__rightLefts = {};
    self.__docsForReuse = [];
    rightCollection.registerRelationship(self);
    leftCollection.registerRelationship(self);
  };
  util.inheritPrototype(ManyToManyRelationship, BaseContainer);
  var def = ManyToManyRelationship.prototype;
  
  def.getAccessFunctionDefinitions = function()  {var self = this;
    var capitalize = util.capitalizeFirstLetter,
        buildFunc = util.createAccessFunctionDefinition,
        leftName = capitalize(self.__leftCollection.itemName),
        leftPlural = capitalize(self.__leftCollection.plural),
        rightName = capitalize(self.__rightCollection.itemName),
        rightPlural = capitalize(self.__rightCollection.plural),
        end = self.__functionNameEnd,
        getLeftRightsFnName = 'get' + leftName + rightPlural + end,
        getRightLeftsFnName = 'get' + rightName + leftPlural + end,
        addLeftRightFnName = 'add' + leftName + rightName + end,
        removeLeftRightFnName = 'remove' + leftName + rightName + end,
        isLeftLinkedToRightFnName = 'is' + leftName + 'LinkedTo' + rightName + end;
    return [
      buildFunc(getLeftRightsFnName, self.getLeftRights, false),
      buildFunc(getRightLeftsFnName, self.getRightLefts, false),
      buildFunc(addLeftRightFnName, self.addLink, true),
      buildFunc(removeLeftRightFnName, self.removeLink, true),
      buildFunc(isLeftLinkedToRightFnName, self.isLinked, false)
    ];
  };
  
  def.loadDocumentFromDb = function(doc)  {var self = this;
    if (doc.right && 
        doc.left && 
        self.__updateOneRegisterWithDocument(self.__leftRights, doc.left, doc.right, doc)
        ){
      self.__updateOneRegisterWithDocument(self.__rightLefts, doc.right, doc.left, doc);
      return true;
    } else {
      self.__sendDocumentToReusePile(doc);
      return false;
    }
  };
  
  def.__updateOneRegisterWithDocument = function(register, key, id, doc)  {var self = this;
    var entry = register[key];
    if (entry === undefined) {
      var docs = {};
      docs[id] = doc;
      register[key] = {docs: docs, items: []};
    } else {
      if (entry.docs[id]) {
        return false;
      }
      entry.docs[id] = doc;
    }
    return true;
  };
  
  def.getLeftRights = function (leftItem)  {var self = this;
    return self.__getInitialisedEntry(self.__leftRights, leftItem._id).items;
  };
  
  def.getRightLefts = function (rightItem)  {var self = this;
    return self.__getInitialisedEntry(self.__rightLefts, rightItem._id).items;
  };
  
  //TODO: assert they are of correct type?
  def.addLink = function (leftItem, rightItem)    {var self = this;
    if (self.isLinked(leftItem, rightItem)) {
      return $q.when();
    } else {
      var deferred = $q.defer();
      self.__writeLinkToDatabase(leftItem, rightItem).then(function(){
        //will have gone through loadDocumentFromDb succesfully.
        var leftEntry = self.__getInitialisedEntry(self.__leftRights, leftItem._id),
            rightEntry = self.__getInitialisedEntry(self.__rightLefts, rightItem._id);
        util.addUnique(leftEntry.items, rightItem);
        util.addUnique(rightEntry.items, leftItem);
        deferred.resolve()
      });
      return deferred.promise; 
    };
  };
  
  def.removeLink = function (leftItem, rightItem)    {var self = this;
    var deferred = $q.defer();
    
    return deferred.promise;
  };
   
  def.isLinked = function (leftItem, rightItem)    {var self = this;
    var leftEntry = self.__getInitialisedEntry(self.__leftRights, leftItem._id);
    return util.arrayContains(leftEntry.items, rightItem);
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
  
  /*
  Should only be called if sure that items are not linked. Will reuse a document if one is available.
  */
  def.__writeLinkToDatabase = function(leftItem, rightItem)  {var self = this;
    var deferred = $q.defer(),
        doc = self.__docsForReuse.pop();
    function finish(succesfullyLoaded) {
      if (succesfullyLoaded) {
        c.log(888)
        deferred.resolve();
      } else {
        throw 'ManyToManyRelationship.__writeLinkToDatabase failed to load document. This should not have happened.'
      }
    }
    if (doc) {
      doc.left = leftItem._id;
      doc.right = rightItem._id;
      self.__db.put(doc).then(function (result) {
        doc._rev = result.rev;
        finish(self.loadDocumentFromDb(doc));        
      });
    } else {
      doc = {left: leftItem._id, right:rightItem._id};
      self.__postAndLoad(doc).then(function (result) {
        finish(result);
      });
    }
    return deferred.promise;
  };
  
  def.__sendDocumentToReusePile = function(doc)  {var self = this;
    self.__docsForReuse.push(doc);
  };
  
  def.__getInitialisedEntry = function (register, id)  {var self = this;
    var entry = register[id];
    if (entry === undefined) {
      entry = {docs: {}, items: []};
      register[id] = entry;
    } else {
      if (entry.items.length !== Object.keys(entry.docs).length) {
        var collection = (register === self.__leftRights)? self.__rightCollection : self.__leftCollection; 
        entry.items.length = 0;
        angular.forEach(entry.docs, function(doc, id) {
          //TODO: what if item doesn't exist?
          var item = collection.getItem(id);
          if (item) {
            entry.items.push(item);
          }
        });
      }
    }
    return entry;
  };
  
  return ManyToManyRelationship;
});