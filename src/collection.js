
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
    this._loadedItems = [];
  };
  Collection.prototype = new BaseCollection();
  
  Collection.prototype._registerRelationship = function(relationship) {
    //Registers a relationship -- internal use.
    this.relationships.push(relationship);
  };
  
  Collection.prototype._load = function(doc) {
    var newItem = new this._factory(doc);
    newItem._doc = doc;
    newItem.id = doc._id;
    this.items.push(newItem);
    this._index[doc._id] = newItem;
    return newItem;
  };
  
  Collection.prototype.createLinks = function() {
    var self = this;
    angular.forEach(self.__index, function(k, v){
      self.__createItemLinks(v)
    });
  };
  
  Collection.prototype.__createItemLinks = function(newItem) {
    newItem._links = {};
    angular.forEach(this.relationships, function(relationship) {
      var name = relationship.propertyName;
      newItem._links[name] = relationship._convertFromDoc(doc);
    });
  };
  
  Collection.prototype.add = function(data) {
    var self = this;
    var d = $q.defer();
    self.__createDocument(data).then(function(newItem) {
      self.__createItemLinks(newItem);
      newItem.init();
      d.resolve(newItem);
    });
    return d.promise;
  };
  
  Collection.prototype.save = function(item) {
    var self = this;
    var d = $q.defer();
    this._db.put(item.document).then(function (result) {
      item.document._rev = result.rev;
      d.resolve(newItem);
    });
    return d.promise;
  };
  
  Collection.prototype.remove = function(item) {
    var self = this;
    var deferred = $q.defer();
    var childDeletions = [];
    /* Note that calls to relationship._removeItem must not depend on a promise themselves 
    */
    angular.forEach(self.relationships, function(relationship) {
      childDeletions.push(relationship._onItemRemove(item));
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