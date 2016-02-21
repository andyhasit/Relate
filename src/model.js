
angular.module('Relate').service('model', function($q, Collection, ParentChildRelationship, ManyToManyRelationship) {
  
  var self= this,
      __db,
      __loadQuery,
      __collections = {},
      __relationships = {},
      __dbDocumentTypeLoaders = {},
      __lastPromiseInQueue = $q.when(),
      __relationshipDefinitionFunctions = {};
  
  self.initialize = function(db, query) {
    __db = db;
    __loadQuery = query || function() {
      return __db.allDocs({
        include_docs: true,
        attachments: false
      });
    }
  };
  
  var __dataReady;
  self.dataReady = function (){
    if (__dataReady === undefined) {
      __dataReady = $q.defer();
      __initializeModel().then( function () {
        m = new ManyToManyRelationship(__db, __collections['project'], __collections['task']);//, {qualifier: 'admin'}
        c.log(m.getAccessFunctionDefinitions());
        __dataReady.resolve();
      });
    }
    return __dataReady.promise;
  };
  
  self.printInfo = function (){
    angular.forEach(__collections, function(collection) {
      angular.forEach(collection.getAccessFunctionDefinitions(), function(accessFunc) {
        console.log('model.' + accessFunc.ModelFunctionName);
      });
    });
  };
  
  /************* MODEL DEFINITION FUNCTIONS *************/
  
  self.collection = function(singleItemName, fieldNames, options){
    var collection = new Collection(__db, singleItemName, fieldNames, options);
    __collections[collection.collectionName] = collection;
    __registerDocumentTypeLoader(collection);
    __createAccessFunctions(collection);
    return collection;
  };
  
  self.join = function(options){
    var relationshipType = options.type;
    var fn = __relationshipDefinitionFunctions[relationshipType];
    if (typeof fn === 'function') {
      relationship = fn.apply(self, [options]);
      __createAccessFunctions(relationship);
      __relationships[relationship.collectionName] = relationship;
    } else {
      throw '' + options.type +' is not a valid relationship type';
    }
  };
  
  function __createParentChildRelationship(options){
    var parentCollectionName = options.parent;
    var childCollectionName = options.child;
    var parentCollection = __collections[parentCollectionName];
    var childCollection = __collections[childCollectionName];
    return new ParentChildRelationship(__db, parentCollection, childCollection, options);
  };
  __relationshipDefinitionFunctions.parentChild = __createParentChildRelationship;
  
  /************* COLLECTION ACCESS FUNCTIONALITY ************
  
    __createAccessFunctions() creates methods like:
  
      model.newTask({})
      model.getProjectTasks(project)
  
    Query functions (getX, findX) return directly. Data changing functions (all other prefixed) return promises.
    
    Query data may be dirty while a promise is waiting to complete, so you need to do this:
    
    model.newTask({}).then(function(){
      angular.copy($scope.tasks, model.getProjectTasks($scope.project));
    });
    
    Data changing functions are queued internally, so you can do this.
    model.newTask({});
    model.newTask({});
    model.newTask({}).then(function(){
      angular.copy($scope.tasks, model.getProjectTasks($scope.project));
    });
    
  */
  self.save = function(item) {
    self.__collections[item.type].save(item);
  };
  
  self.delete = function(item) {
    self.__collections[item.type].delete(item);
  };
  
  function __createAccessFunctions(collection){
    angular.forEach(collection.getAccessFunctionDefinitions(), function(accessFunc) {
      var func;
      if (accessFunc.queuedPromise) {
        func = __getQueuedFunction(collection, accessFunc.collectionFunction);
      } else {
        func = __getNonQueuedFunction(collection, accessFunc.collectionFunction);
      }
      self[accessFunc.ModelFunctionName] = func;
    });
  };
  
  function __createAccessFunctionsOld(){
    angular.forEach(__collections, function(collection) {
      angular.forEach(collection.getAccessFunctionDefinitions(), function(accessFunc) {
        var func;
        if (accessFunc.queuedPromise) {
          func = __getQueuedFunction(collection, accessFunc.collectionFunction);
        } else {
          func = __getNonQueuedFunction(collection, accessFunc.collectionFunction);
        }
        self[accessFunc.ModelFunctionName] = func;
      });
    });
  };
  
  function __getNonQueuedFunction(collection, collectionFunction){
    return function() {
      return collectionFunction.apply(collection, arguments);
    }
  };
  
  function __getQueuedFunction(collection, collectionFunction){
    return function() {
      var originalArgs = arguments;
      var deferred = $q.defer();
      __lastPromiseInQueue.then( function() {
        __lastPromiseInQueue = collectionFunction.apply(collection, originalArgs);
        __lastPromiseInQueue.then(function(result) {
          deferred.resolve(result);
        });
      });
      return deferred.promise;
    }
  };

  /************* INITAL LOADING FUNCTIONALITY *************/
  
  function __registerDocumentTypeLoader(collection){
    var dbDocumentType = collection.dbDocumentType;
    if (dbDocumentType in __dbDocumentTypeLoaders) {
      var claimedBy = __dbDocumentTypeLoaders[dbDocumentType];
      throw 'More than one collection/relationship attempting to register dbDocumentType: "' + dbDocumentType + '".';
    } else {
      __dbDocumentTypeLoaders[dbDocumentType] = collection;
    }
  };
  
  function __initializeModel(){
    var defer = $q.defer();
    var loadQuery = __loadQuery();
    loadQuery.then(function (result) {
      angular.forEach(result.rows, function(row){
        __addDocumentToCollection(row.doc);
      });
      __createLinks();
      defer.resolve();
    }).catch(function (err) {
      console.log(err);
    });
    return defer.promise;
  };
  
  function __addDocumentToCollection(document){
    var dbDocumentType = document.type;
    if (dbDocumentType) {
      var collection = __dbDocumentTypeLoaders[dbDocumentType];
      if (collection) {
        collection.loadDocumentFromDb(document, dbDocumentType);
      } else {
        console.log(document);
        console.log('Could not load document \"' + document._id + '\" as type was not recognised (' + dbDocumentType + ')');
      }
    } else {
      console.log('Could not load document \"' + document._id + '\" as it has no \"type\" field.');
    }
  };
  
  function __createLinks() {
    angular.forEach(__relationships, function(relationship) {
      relationship.createLinks();
    });
  }
  
});

