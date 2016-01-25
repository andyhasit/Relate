
angular.module('Relate').factory('Collection', function($q) {
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
  
  Collection.prototype._registerRelationship = function(relationship) {
    //Registers a relationship -- internal use.
    this.relationships.push(relationship);
  };
  
  Collection.prototype._registerDocument = function(document) {
    //Registers a document in collection -- internal use.
    var item = new this._factory(document);
    this.items.push(item);
    this._index[document._id] = item;
  };
  
  Collection.prototype._fetch = function(result) {
    //Fetches a document -- internal use.
    if (!result.ok) {
      return error(result);
    }
    return this._db.get(res.id);
  }
  
  Collection.prototype.add = function(obj) {
    var self = this;
    obj.type = this.typeIdentifier;
    this._db.post(obj).then(function (result) {
      self._fetch(result);
    }).then(function (document) {
      self._registerDocument(document);
    });
  };
  
  Collection.prototype.save = function(item) {
    var self = this;
    this._db.put(item).then(function (result) {
      item._rev = result.rev;
    });
  };
  
  Collection.prototype.remove = function(item) {
    var self = this;
    angular.forEach(self.relationships, function(relationship) {
      relationship.removeItem(item);
    });
    this._db.remove(item).then(function (result) {
      delete self._index[item._id];
      self.items.splice(self.items.indexOf(item), 1);//TODO: test this.
    });
  };
  
  Collection.prototype.getItem = function(id) {
    return this._index[id];
  };
  
  return Collection;
});