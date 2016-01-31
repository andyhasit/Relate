
angular.module('Relate').factory('Collection', function(util, $q, BaseCollection) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  var Class = function(db, name, fields, factory, options)    {var self = this;
    self._db = db;
    self._factory = factory;
    self._index = {};
    self.__fields = fields; //TODO: maybe copy for safety?
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
    var item = new self._factory();
    self.__copyFieldValues(document, item);
    item._id = document._id;
    item._rev = document._rev;
    self._index[document._id] = item;
    return item;
  };
  
  def.__copyFieldValues = function(source, target)    {var self = this;
    angular.forEach(self.__fields, function(field) {
      target[field] = source[field];
    });
  }
  
  def.new = function(data)    {var self = this;
    //returns a promise, which goes via loadDocument()
    return self.__createDocument(data);
  };
  
  def.save = function(item)    {var self = this;
    var deferred = $q.defer();
    var document = {};
    self.__copyFieldValues(item, document);
    self._db.put(document).then(function (result) {
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
  
  return Class;
});