
angular.module('Relate').factory('Collection', function(util, $q, BaseCollection) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  var Collection = function(db, singleItemName, fieldNames, factory, options)    {var self = this;
    var options = options || {};
    self._db = db;
    self._factory = factory;
    self._index = {};
    self.__fieldNames = fieldNames; //TODO: maybe copy for safety?
    //Can be changed in options. Implement later.
    self.itemName = singleItemName;
    self.collectionName = options.collectionName || singleItemName; //This is how a relationship references collection
    self.typeIdentifier = options.typeIdentifier || singleItemName;
    self.relationships = [];
  };
  util.inheritPrototype(Collection, BaseCollection);
  var def = Collection.prototype;

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

  def.loadDocument = function(doc)    {var self = this;
    //Registers a doc in collection -- internal use.
    var item = new self._factory();
    self.__copyFieldValues(doc, item);
    item._id = doc._id;
    item._rev = doc._rev;
    self._index[doc._id] = item;
    return item;
  };

  def.__copyFieldValues = function(source, target)    {var self = this;
    angular.forEach(self.__fieldNames, function(field) {
      target[field] = source[field];
    });
  };

  def.new = function(data)    {var self = this;
    //returns a promise, which goes via loadDocument()
    return self.__createDocument(data);
  };

  def.save = function(item)    {var self = this;
    var deferred = $q.defer();
    var doc = {};
    self.__copyFieldValues(item, doc);
    self._db.put(doc).then(function (result) {
      item._rev = result.rev;
      deferred.resolve(item._rev);
    });
    return deferred.promise;
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
        deferred.resolve();
      });
    });
    return deferred.promise;
  };

  def.get = function(id)    {var self = this;
    return self._index[id];
  };

  def.find = function(query)    {var self = this;
    //query can be an object like {name: 'do it'} or empty, or function
    var test;
    if (typeof query == 'function') {
      test = query;
    } else if (typeof query == 'object') {
      test = function(item) {
        for (prop in query) {
          if (item[prop] !== query[prop]) {
            return false;
          }
        }
        return true;
      }
    } else {
      throw 'Collection.find expects a function or object';
    }
    return util.filterIndex(self._index, test);
  };

  return Collection;
});
