

angular.module('Relate').factory('ModelPrivateFunctions', function($q) {
  
  var ModelPrivateFunctions = function() {
  };

  ModelPrivateFunctions.prototype.__registerTypeIdentifier = function(collection) {var self = this;
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
  
  ModelPrivateFunctions.prototype.__createAccessFunctions = function () {var self = this;
    angular.forEach(self.__collections, function(collection) {
      angular.forEach(collection.getAccessFunctions(), function(accessFunc) {
        self[accessFunc.ModelFunctionName] = self.__wrapFunction(collection, accessFunc.collectionFunction);
      });
    });
  };
  
  ModelPrivateFunctions.prototype.__wrapFunction = function (collection, collectionFunction) {var self = this;
    return function() {
      //chain this call, should fail for now.
      //var deferred = self.__queueCall(collection[baseFunctionName], collection, [collection, data, options]);
      return collectionFunction.apply(collection, arguments);
    }
  };
  
  ModelPrivateFunctions.prototype.__queueCall = function (func, target, args) {var self = this;
    //reuse from other factory, but prevent it from being called yet.
      //chain this call
      var deferred = func.apply(target, args);
    
  };

  ModelPrivateFunctions.prototype.__loadAndLinkEveryting = function () {var self = this;
    // Does the actual loading of data.
    var defer = $q.defer();
    self.__db.allDocs({
      include_docs: true,
      attachments: false
    }).then(function (result) {
      //Register each doc to its collection
      angular.forEach(result.rows, function(row){
        //delete all:  self.__db.remove(row.doc);
        self.__registerDocumentToCollection(row.doc);
      });
      self.__createAccessFunctions();
      defer.resolve();
    }).catch(function (err) {
      console.log(err);
    });
    return defer.promise;
  };
  
  ModelPrivateFunctions.prototype.__registerDocumentToCollection = function (document) {var self = this;
    //Registers a document loaded from the db to the correct collection
    var typeIdentifier = document.type;
    if (typeIdentifier) {
      var collection = self.__typeIdentifiers[typeIdentifier];
      if (collection) {
        collection._registerDocument(document, typeIdentifier); //TODO: is typeIdentifier needed?
      } else {
        console.log('Could not load document \"' + document._id + '\" as type was not recognised (' + typeIdentifier + ')');
      }
    } else {
      //self.__db.remove(document);
      throw('Could not load document \"' + document._id + '\" as it has no \"type\" field.');
    }
  };
  
  return ModelPrivateFunctions;
});


angular.module('Relate').factory('Model', function($q, ModelPrivateFunctions, Collection, ParentChildRelationship) {
  
  var Model = function(db) {
    this.__db = db;
    this.__collections = {};
    this.__typeIdentifiers = {};
  };
  Model.prototype = new ModelPrivateFunctions();
  
  Model.prototype.addCollection = function(name, factory, options) {var self = this;
    /*
    name must be singular. Let's do a check that "this" doesn't have this key.
    also check typeIdentifier is unique.
    */
    var collection = new Collection(self.__db, name, factory, options);
    self.__collections[name] = collection;
    self.__registerTypeIdentifier(collection);
    return collection;
  };
  
  Model.prototype.addParentChildLink = function(parentCollectionName, childCollectionName, options) {var self = this;
    var parentCollection = self.__collections[parentCollectionName];
    var childCollection = self.__collections[childCollectionName];
    var relationship = new ParentChildRelationship(self.__db, parentCollection, childCollection, options);
    self.__collections[name] = relationship;
    self.__registerTypeIdentifier(relationship.parentOfChildCollection);
    self.__registerTypeIdentifier(relationship.childrenOfParentCollection);
    return relationship;
  };
  
  Model.prototype.ready = function () { var self = this;
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
  
  Model.prototype.printInfo = function () {var self = this;
    angular.forEach(self.__collections, function(collection) {
      angular.forEach(collection.getAccessFunctions(), function(accessFunc) {
        console.log('model.' + accessFunc.ModelFunctionName);
      });
    });
  };
   return Model;
});
  
