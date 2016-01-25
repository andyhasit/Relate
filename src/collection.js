
angular.module('Relate').factory('Collection', function($q) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  var Collection = function(db, name, factory, options) {
    this._db = db;
    this._factory = factory;
    this.items = [];
    
    //Can be changed in options. Implement later.
    this.itemName = name;
    this.collectionName = name + 's';
    this.typeIdentifier = name;
  };
  
  Collection.prototype._registerDocument = function(document) {
    //Registers a document in items -- internal use.
    this.items.push(new this._factory(document));
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
      self._register(document);
    });
  };
  
  Collection.prototype.save = function(item) {
    var self = this;
    this._db.put(item).then(function (result) {
      item._rev = result.rev;
    });
  };
  
  Collection.prototype.delete = function(obj) {
    var self = this;
    obj.type = this.typeIdentifier;
    c.log(obj);
    this._db.remove(obj).then(function (result) {
      self._fetch(result);
    }).then(function (doc) {
      self._register(doc);
    });
  };
  
  return Collection;
});