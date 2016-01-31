
angular.module('Relate').factory('Collection', function(util, $q, BaseCollection) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  var Class = function(db, name, factory, options)    {var self = this;
    self._db = db;
    self._factory = factory;
    self.items = [];
    self._index = {};
    
    //Can be changed in options. Implement later.
    self.itemName = name;
    self.collectionName = name + 's';
    self.typeIdentifier = name;
    self.relationships = [];
  };
  util.inheritPrototype(Class, BaseCollection);
  var def = Class.prototype;
  
  def.getAccessFunctions = function()    {var self = this;
    var singleItemActions = ['new', 'get', 'save', 'delete'];
    var multipleItemActions = ['find'];
    var accessFunctions = [];
    var itemName = util.capitalizeFirstLetter(self.itemName);
    
    angular.forEach(singleItemActions, function(action) {
      accessFunctions.push(util.createAccessFunctionDefinition(action + itemName, self[action]));
    });
    angular.forEach(multipleItemActions, function(action) {
      accessFunctions.push(util.createAccessFunctionDefinition(action + itemName + 's', self[action]));
    });
    return accessFunctions;
  };
    
  def._registerRelationship = function(relationship)    {var self = this;
    //Registers a relationship -- internal use.
    self.relationships.push(relationship);
  };
  
  def.loadDocument = function(document)    {var self = this;
    //Registers a document in collection -- internal use.
    var item = new self._factory(document);
    self.items.push(item);
    self._index[document._id] = item;
    return item;
  };
  
  def.new = function(data)    {var self = this;
    return self.__createDocument(data);
  };
  
  def.save = function(item)    {var self = this;
    self._db.put(item.document).then(function (result) {
      item.document._rev = result.rev;
    });
  };
  
  def.delete = function(item)    {var self = this;
    var deferred = $q.defer();
    var childDeletions = [];
    /* Note that calls to relationship._removeItem must not depend on a promise themselves 
    */
    angular.forEach(self.relationships, function(relationship) {
      childDeletions.push(relationship._removeItem(item));
    });
    $q.all(childDeletions).then(function() {
      self._db.remove(item).then(function (result) {
        delete self._index[item._id];
        self.items.splice(self.items.indexOf(item), 1);//TODO: test this.
        deferred.resolve();
      });
    });
    return deferred.promise;
    /*
    Old sync way:
    angular.forEach(self.relationships, function(relationship) {
      relationship._removeItem(item);
    });
    this._db.remove(item).then(function (result) {
      delete self._index[item._id];
      self.items.splice(self.items.indexOf(item), 1);//TODO: test this.
    });
    */
  };
  
  def.get = function(id)    {var self = this;
    return self._index[id];
  };
  
  def.find = function(query)    {var self = this;
    return self.items;
  };
  
  return Class;
});