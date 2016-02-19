
angular.module('Relate').factory('Collection', function(util, $q, BaseCollection) {
  
  var Collection = function(db, singleItemName, fieldNames, factoryFunction, options)    {var self = this;
    var options = options || {};
    self.itemName = singleItemName;
    self.collectionName = options.collectionName || singleItemName; //This is how a relationship references collection
    self.dbDocumentType = options.dbDocumentType || singleItemName;
    self.__db = db;
    self.__factoryFunction = factoryFunction;
    self.__items = {};
    self.__relationships = [];
    self.__fieldNames = fieldNames.slice();
    self.__fullFieldNames = fieldNames.slice();
    self.__fullFieldNames.push('_id');
    self.__fullFieldNames.push('_rev');
  };
  util.inheritPrototype(Collection, BaseCollection);
  var def = Collection.prototype;

  def.registerRelationship = function(relationship)    {var self = this;
    self.__relationships.push(relationship);
  };

  def.loadDocumentFromDb = function(doc)    {var self = this;
    var item = new self.__factoryFunction();
    util.copyFields(doc, item, self.__fullFieldNames);
    self.__items[doc._id] = item;
    return item;
  };
  
  def.getAccessFunctionDefinitions = function()    {var self = this;
    var itemName = util.capitalizeFirstLetter(self.itemName);
    function getFuncDef(action, pularise, queuedPromise) {
      var name = pularise? action + itemName + 's' : action + itemName,
          func = self['__' + action + '__'];
      return util.createAccessFunctionDefinition(name, func, queuedPromise);
    }
    return [
      getFuncDef('new', false, true),
      getFuncDef('save', false, true),
      getFuncDef('delete', false, true),
      getFuncDef('get', false, false),
      getFuncDef('find', true, false)
    ]
  };
  
  def.__get__ = function(id)    {var self = this;
    return self.__items[id];
  };

  def.__find__ = function(query)    {var self = this;
    /*
    query can be:
      a function returning true or false
      an object like {name: 'deirdre'} -- which returns items whose properties match.
      an empty object {} -- which returns all items.
    TODO: what about parent properties?
    */
    var test;
    if (typeof query === 'function') {
      test = query;
    } else if (typeof query === 'object') {
      test = function(item) {
        for (prop in query) {
          if (item[prop] !== query[prop]) {
            return false;
          }
        }
        return true;
      }
    } else {
      throw 'Invalid argument for "find", must be an object or a function.';
    }
    return util.filterIndex(self.__items, test);
  };
  
  def.__new__ = function(data)    {var self = this;
    var deferred = $q.defer();
    var doc = {};
    util.copyFields(data, doc, self.__fieldNames);
    self.__postAndLoad(doc).then(function (newItem) {
      //TODO: link relationships...
      deferred.resolve(newItem);
    });
    return deferred.promise;
  };

  def.__save__ = function(item)    {var self = this;
    var deferred = $q.defer();
    var doc = {};
    util.copyFields(item, doc, self.__fullFieldNames);
    self.__db.put(doc).then(function (result) {
      item._rev = result.rev;
      deferred.resolve(item._rev);
    });
    return deferred.promise;
  };

  def.__delete__ = function(item)    {var self = this;
    var deferred = $q.defer();
    var childDeletions = [];
    angular.forEach(self.__relationships, function(relationship) {
      childDeletions.push(relationship.respondToItemDeleted(item, self));
    });
    $q.all(childDeletions).then(function() {
      self.__db.remove(item).then(function (result) {
        delete self.__items[item._id];
        deferred.resolve();
      });
    });
    return deferred.promise;
  };

  return Collection;
});
