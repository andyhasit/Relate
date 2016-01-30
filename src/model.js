

angular.module('Relate').factory('ModelPrivateFunctions', function($q) {
  
  var ModelPrivateFunctions = function() {
  };

  ModelPrivateFunctions.prototype.__registerTypeIdentifier = function(collection) {
    var typeIdentifier = collection.typeIdentifier;
    if (typeIdentifier in self.__typeIdentifiers) {
      var claimedBy = self.__typeIdentifiers[typeIdentifier];
      throw 'Collection \"' + collection.collectionName + '\" tried to register for the typeIdentifier: \"' + typeIdentifier + 
        '\" but it is already claimed by collection \"' + collection.collectionName + '\".' +
        '\nTypeIdentifiers are strings used to determine what collection each document should be loaded in';
    } else {
      self.__typeIdentifiers[typeIdentifier] = collection;
    }
  };
  
  ModelPrivateFunctions.prototype.__createAccessFunctions = function () {
    //TODO: move this to collections themselves.
    var self = this,
        singleItemActions = ['new', 'get', 'save', 'delete'],
        multipleItemActions = ['find'];
    angular.forEach(self.__collections, function(collection) {
      var name = collection.CapitalisedName();
      angular.forEach(singleItemActions, function(action) {
        self[action + name] = self.__wrapFunction(collection, action + 'Item');
      });
      angular.forEach(multipleItemActions, function(action) {
        self[action + name + 's'] = self.__wrapFunction(collection, action + 'Items');
      });
    });
    angular.forEach(self.__relationships, function(relationship) {
        self[action + name + 's'] = self.__wrapFunction(collection, action + 'Items');
      });
    });
    
  };
  
  ModelPrivateFunctions.prototype.__wrapFunction = function (collection, baseFunctionName) {
    var self = this;
    return function(data, options) {
      //chain this call, should fail for now.
      //var deferred = self.__queueCall(collection[baseFunctionName], collection, [collection, data, options]);
      return collection[baseFunctionName].call(collection, collection, data, options);
    }
  });
  
  ModelPrivateFunctions.prototype.__queueCall = function (func, target, args) {
    var self = this;
    //reuse from other factory, but prevent it from being called yet.
      //chain this call
      var deferred = func.apply(target, args);
    }
  };

  ModelPrivateFunctions.prototype.__loadAndLinkEveryting = function () {
    // Does the actual loading of data.
    var self = this;
    var defer = $q.defer();
    self._db.allDocs({
      include_docs: true,
      attachments: false
    }).then(function (result) {
      //Register each doc to its collection
      angular.forEach(result.rows, function(row){
        //delete all:  self._db.remove(row.doc);
        self.__registerDocumentToCollection(row.doc);
      });
      //Establish all the links
      angular.forEach(self.__collections, function(collection){
        collection.createLinks();
      });
      self.__createAccessFunctions();
      defer.resolve();
    }).catch(function (err) {
      console.log(err);
    });
    return defer.promise;
  };
  
  Model.prototype.__registerDocumentToCollection = function (document) {
    //Registers a document loaded from the db to the correct collection
    var self = this;
    var typeIdentifier = document.type;
    if (typeIdentifier) {
      var collection = self.__typeIdentifiers[typeIdentifier];
      if (collection) {
        collection._registerDocument(document, typeIdentifier); //TODO: is typeIdentifier needed?
      } else {
        throw('Could not load document \"' + document._id + '\" as type was not recognised (' + typeIdentifier + ')');
      }
    } else {
      //self._db.remove(document);
      throw('Could not load document \"' + document._id + '\" as it has no \"type\" field.');
    }
  }
});


angular.module('Relate').factory('Model', function($q, ModelPrivateFunctions, Collection, ParentChildRelationship) {
  
  var Model = function(db) {
    this.__db = db;
    this.__collections = {};
    this.__typeIdentifiers = {};
  };
  Model.prototype = new ModelPrivateFunctions();
  
  Model.prototype.addCollection = function(name, factory, options) {
    /*
    name must be singular. Let's do a check that "this" doesn't have this key.
    also check typeIdentifier is unique.
    */
    var collection = new Collection(self._db, name, factory, options);
    self.__collections[name] = collection;
    self.__registerTypeIdentifier(collection);
    return collection;
  };
  
  Model.prototype.addParentChildLink = function(parentCollectionName, childCollectionName, options) {
    //TODO, change to use strings
    var parentCollection = self.__collections[parentCollectionName];
    var childCollection = self.__collections[childCollectionName];
    var relationship = new ParentChildRelationship(self._db, parentCollection, childCollection, options);
    self.__collections[name] = relationship.collectionName;
    self.__registerTypeIdentifier(relationship.parentOfChildCollection);
    self.__registerTypeIdentifier(relationship.childrenOfParentCollection);
    return relationship;
  };
  
  Model.prototype.ready = function () {
    //Returns a promise that ensures data is only fetched once.
    var defer = $q.defer();
    if (self.__isAllLoaded) {
      defer.resolve();
    } else {
      self.__loadAndLinkEveryting().then( function () {
        self.__isAllLoaded = true;
        defer.resolve();
      });
    }
    return defer.promise;
  };
  
  Model.prototype.printInfo = function () {
    //TODO: change to print from collection with param examples.
    for(prop in this) {
      if (Object.hasOwnProperty(prop) && !prop.starts('__')) {
        console.log('model.' + prop);
      }
    }
  });
  
});