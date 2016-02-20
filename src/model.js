
angular.module('Relate').factory('RelateModel', function($q, Collection, ParentChildRelationship) {
  
  var RelateModel = function(db)  {var self = this;
    self.__db = db;
    self.__collections = {};
    self.__dbDocumentTypeLoaders = {};
    self.__lastPromiseInQueue = $q.when();
    self.__relationshipDefinitionFunctions = {
      parentChild: self.__createParentChildRelationship,
    }
  };
  var def = RelateModel.prototype;
    
  var __dataReady;
  def.onDataReady = function ()  {var self = this;
    if (__dataReady === undefined) {
      __dataReady = $q.defer();
      self.__initializeModel().then( function () {
        __dataReady.resolve();
      });
    }
    return __dataReady.promise;
  };
  
  def.printInfo = function ()  {var self = this;
    angular.forEach(self.__collections, function(collection) {
      angular.forEach(collection.getAccessFunctionDefinitions(), function(accessFunc) {
        console.log('model.' + accessFunc.ModelFunctionName);
      });
    });
  };
  
  /************* MODEL DEFINITION FUNCTIONS *************/
  
  def.defineCollection = function(singleItemName, fieldNames, options)  {var self = this;
    var collection = new Collection(self.__db, singleItemName, fieldNames, options);
    self.__collections[collection.collectionName] = collection;
    self.__registerDocumentTypeLoader(collection);
    return collection;
  };
  
  def.defineRelationship = function(options)  {var self = this;
    var relationshipType = options.type
    var fn = self.__relationshipDefinitionFunctions[relationshipType];
    if (typeof fn === 'function') {
      return fn.apply(self, [options]);
    } else {
      alert('fail');
    }
  };
  
  def.__createParentChildRelationship = function(options)  {var self = this;
    var parentCollectionName = options.parent;
    var childCollectionName = options.child;
    var parentCollection = self.__collections[parentCollectionName];
    var childCollection = self.__collections[childCollectionName];
    var relationship = new ParentChildRelationship(self.__db, parentCollection, childCollection, options);
    self.__collections[relationship.collectionName] = relationship;
    self.__registerDocumentTypeLoader(relationship.itemParentRegister);
    self.__registerDocumentTypeLoader(relationship.itemChildrenRegister);
    return relationship;
  };
  
  
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
  
  def.__createAccessFunctions = function ()  {var self = this;
    angular.forEach(self.__collections, function(collection) {
      angular.forEach(collection.getAccessFunctionDefinitions(), function(accessFunc) {
        var func;
        if (accessFunc.queuedPromise) {
          func = self.__getQueuedFunction(collection, accessFunc.collectionFunction);
        } else {
          func = self.__getNonQueuedFunction(collection, accessFunc.collectionFunction);
        }
        self[accessFunc.ModelFunctionName] = func;
      });
    });
  };
  
  def.__getNonQueuedFunction = function (collection, collectionFunction)  {var self = this;
    return function() {
      return collectionFunction.apply(collection, arguments);
    }
  };
  
  def.__getQueuedFunction = function (collection, collectionFunction)  {var self = this;
    return function() {
      var originalArgs = arguments;
      var deferred = $q.defer();
      self.__lastPromiseInQueue.then( function() {
        self.__lastPromiseInQueue = collectionFunction.apply(collection, originalArgs);
        self.__lastPromiseInQueue.then(function(result) {
          deferred.resolve(result);
        });
      });
      return deferred.promise;
    }
  };
  

  /************* INITAL LOADING FUNCTIONALITY *************/
  
  def.__registerDocumentTypeLoader = function(collection)  {var self = this;
    var dbDocumentType = collection.dbDocumentType;
    if (dbDocumentType in self.__dbDocumentTypeLoaders) {
      var claimedBy = self.__dbDocumentTypeLoaders[dbDocumentType];
      throw 'More than one collection/relationship attempting to register dbDocumentType: "' + dbDocumentType + '".';
    } else {
      self.__dbDocumentTypeLoaders[dbDocumentType] = collection;
    }
  };
  
  def.__initializeModel = function ()  {var self = this;
    var defer = $q.defer();
    var allDocsDefer = self.__db.allDocs({
      include_docs: true,
      attachments: false
    });
    allDocsDefer.then(function (result) {
      angular.forEach(result.rows, function(row){
        self.__addDocumentToCollection(row.doc);
      });
      self.__createAccessFunctions();
      defer.resolve();
    }).catch(function (err) {
      console.log(err);
    });
    return defer.promise;
  };
  
  def.__addDocumentToCollection = function (document)  {var self = this;
    var dbDocumentType = document.type;
    if (dbDocumentType) {
      var collection = self.__dbDocumentTypeLoaders[dbDocumentType];
      if (collection) {
        collection.loadDocumentFromDb(document, dbDocumentType);
      } else {
        console.log('Could not load document \"' + document._id + '\" as type was not recognised (' + dbDocumentType + ')');
      }
    } else {
      //self.__db.remove(document);
      throw('Could not load document \"' + document._id + '\" as it has no \"type\" field.');
    }
  };
  
  return RelateModel;
});

