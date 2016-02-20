
angular.module('Relate').service('model', function($q, Collection, ParentChildRelationship) {
  
  var self= this,
      __db,
      __collections = {},
      __dbDocumentTypeLoaders = {},
      __lastPromiseInQueue = $q.when(),
      __relationshipDefinitionFunctions = {};
  
  self.initialize = function(db, query) {
    __db = db;
  };
  
  var __dataReady;
  self.dataReady = function (){
    if (__dataReady === undefined) {
      __dataReady = $q.defer();
      __initializeModel().then( function () {
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
  
  self.defineCollection = function(singleItemName, fieldNames, options){
    var collection = new Collection(__db, singleItemName, fieldNames, options);
    __collections[collection.collectionName] = collection;
    __registerDocumentTypeLoader(collection);
    return collection;
  };
  
  self.defineRelationship = function(options){
    var relationshipType = options.type;
    var fn = __relationshipDefinitionFunctions[relationshipType];
    if (typeof fn === 'function') {
      return fn.apply(self, [options]);
    } else {
      throw '' + options.type +' is not a valid relationship type';
    }
  };
  
  function __createParentChildRelationship(options){
    var parentCollectionName = options.parent;
    var childCollectionName = options.child;
    var parentCollection = __collections[parentCollectionName];
    var childCollection = __collections[childCollectionName];
    var relationship = new ParentChildRelationship(__db, parentCollection, childCollection, options);
    __collections[relationship.collectionName] = relationship;
    __registerDocumentTypeLoader(relationship.itemParentRegister);
    __registerDocumentTypeLoader(relationship.itemChildrenRegister);
    return relationship;
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
  
  function __createAccessFunctions(){
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
    var allDocsDefer = __db.allDocs({
      include_docs: true,
      attachments: false
    });
    allDocsDefer.then(function (result) {
      angular.forEach(result.rows, function(row){
        __addDocumentToCollection(row.doc);
      });
      __createAccessFunctions();
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
      //__db.remove(document);
      throw('Could not load document \"' + document._id + '\" as it has no \"type\" field.');
    }
  };
  
});

