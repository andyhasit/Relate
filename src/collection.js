
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
    var singleItemActions = ['new', 'get', 'save', 'delete'];
    var multipleItemActions = ['find'];
    var accessFunctions = [];
    var itemName = util.capitalizeFirstLetter(self.itemName);
    function getOwnFunction(action) {
      return self['__' + action + '__'];
    }
    angular.forEach(singleItemActions, function(action) {
      accessFunctions.push(util.createAccessFunctionDefinition(action + itemName, getOwnFunction(action)));
    });
    angular.forEach(multipleItemActions, function(action) {
      accessFunctions.push(util.createAccessFunctionDefinition(action + itemName + 's', getOwnFunction(action)));
    });
    return accessFunctions;
  };
  
  def.__get__ = function(id)    {var self = this;
    return self.__items[id];
  };

  def.__find__ = function(query)    {var self = this;
    //query can be an object like {name: 'do it'} or empty, or function
    var test;
    if (typeof query === 'undefined') {
      test = function(x) {return true};
    }
    else if (typeof query === 'function') {
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
    return self.__createDocumentInDb(data);
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
    /* Note that calls to relationship._removeItem must not depend on a promise themselves
    */
    angular.forEach(self.__relationships, function(relationship) {
      childDeletions.push(relationship._removeItem(item));
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
