
angular.module('Relate').factory('Collection', function($q, BaseCollection, utils) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  var Collection = function(db, name, factory, options) {
    this._db = db;
    this._factory = factory;
    this.items = [];
    this._index = {};
    
    //Can be changed in options. Implement later.
    this.itemName = name;
    this.collectionName = name + 's';
    this.typeIdentifier = name;
    this.relationships = [];
  };
  Collection.prototype = new BaseCollection();
  
  //TODO: move to utils.


  Collection.prototype.getAccessFunctions = function() {var self = this;
    var singleItemActions = ['new', 'get', 'save', 'delete'];
    var multipleItemActions = ['find'];
    var accessFunctions = [];
    var itemName = utils.capitalizeFirstLetter(self.itemName);
    
    angular.forEach(singleItemActions, function(action) {
      accessFunctions.push(utils.createAccessFunctionDefinition(action + itemName, self[action]));
    });
    angular.forEach(multipleItemActions, function(action) {
      accessFunctions.push(utils.createAccessFunctionDefinition(action + itemName + 's', self[action]));
    });
    return accessFunctions;
  };
    
  Collection.prototype._registerRelationship = function(relationship) {var self = this;
    //Registers a relationship -- internal use.
    self.relationships.push(relationship);
  };
  
  Collection.prototype._registerDocument = function(document) {var self = this;
    //Registers a document in collection -- internal use.
    var item = new self._factory(document);
    self.items.push(item);
    self._index[document._id] = item;
    return item;
  };
  
  Collection.prototype.new = function(data) {var self = this;
    return self.__createDocument(data);
  };
  
  Collection.prototype.save = function(item) {var self = this;
    self._db.put(item.document).then(function (result) {
      item.document._rev = result.rev;
    });
  };
  
  Collection.prototype.delete = function(item) {var self = this;
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
  
  Collection.prototype.get = function(id) {
    return this._index[id];
  };
  
  Collection.prototype.find = function(query) {
    return this.items;
  };
  
  return Collection;
});