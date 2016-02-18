
angular.module('Relate').factory('RelateModel', function($q, Collection, ParentChildRelationship) {
  
  var RelateModel = function(db)  {var self = this;
    self.__db = db;
    self.__collections = {};
    self.__dbDocumentTypeLoaders = {};
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
        console.log('model.' + accessFunc.RelateModelFunctionName);
      });
    });
  };
  
  /************* MODEL DEFINITION FUNCTIONS *************/
  
  def.defineCollection = function(singleItemName, fieldNames, factory, options)  {var self = this;
    var collection = new Collection(self.__db, singleItemName, fieldNames, factory, options);
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
    self.__registerDocumentTypeLoader(relationship.parentOfChildCollection);
    self.__registerDocumentTypeLoader(relationship.childrenOfParentCollection);
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
        self[accessFunc.ModelFunctionName] = self.__wrapFunction(collection, accessFunc.collectionFunction);
      });
    });
  };
  
  def.__wrapFunction = function (collection, collectionFunction)  {var self = this;
    return function() {
      //chain this call, should fail for now.
      //var deferred = self.__queueCall(collection[baseFunctionName], collection, [collection, data, options]);
      return collectionFunction.apply(collection, arguments);
    }
  };
  
  def.__queueCall = function (func, target, args)  {var self = this;
    //reuse from other factory, but prevent it from being called yet.
      //chain this call
      var deferred = func.apply(target, args);
    
  };

  /************* INITAL LOADING FUNCTIONALITY *************/
  
  def.__registerDocumentTypeLoader = function(collection)  {var self = this;
    var dbDocumentType = collection.dbDocumentType;
    if (dbDocumentType in self.__dbDocumentTypeLoaders) {
      var claimedBy = self.__dbDocumentTypeLoaders[dbDocumentType];
      throw 'Collection \"' + collection.collectionName + '\" tried to register for the dbDocumentType: \"' + dbDocumentType + 
        '\" but it is already claimed by collection \"' + collection.collectionName + '\".' +
        '\nTypeIdentifiers are strings used to determine what collection each document should be loaded in';
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

