
angular.module('Relate').factory('Collection', function($q, BaseCollection) {
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
  
  Collection.prototype._registerRelationship = function(relationship) {
    //Registers a relationship -- internal use.
    this.relationships.push(relationship);
  };
  
  Collection.prototype._registerDocument = function(document) {
    //Registers a document in collection -- internal use.
    var item = new this._factory(document);
    this.items.push(item);
    this._index[document._id] = item;
    return item;
  };
  
  Collection.prototype.add = function(data) {
    return this.__createDocument(data);
  };
  
  Collection.prototype.save = function(item) {
    this._db.put(item.document).then(function (result) {
      item.document._rev = result.rev;
    });
  };
  
  Collection.prototype.remove = function(item) {
    var self = this;
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
  
  Collection.prototype.getItem = function(id) {
    return this._index[id];
  };
  
  return Collection;
});