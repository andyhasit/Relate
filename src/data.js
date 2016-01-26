
angular.module('Relate').service('data', function($q, Collection) {
  /*
  This service loads the data and provides access to all the collections.
  Usage:
    data.init(db);
    data.addCollection('project');
    data.addCollection('task');
    data.addParentOfChildCollection(data.projects, data.tasks);
  */
  var self = this;
  self._typeIdentifiers = {}; //These are for determining what collection to load docs into.
    
  self.init = function(db) {
    self._db = db;
  };
  
  self.addCollection = function(name, factory, options) {
    /*
    name must be singular. Let's do a check that "this" doesn't have this key.
    also check typeIdentifier is unique.
    */
    var collection = new Collection(self._db, name, factory, options);
    registerCollection(collection);
    registerTypeIdentifier(collection);
    return collection;
  };
  
  self.addParentOfChildCollection = function(parentCollection, childCollection, options) {
    var collection = new ParentChildRelationship(self._db, parentCollection, childCollection, options);
    registerCollection(collection);
    registerTypeIdentifier(collection.parentOfChildCollection);
    registerTypeIdentifier(collection.childrenOfParentCollection);
    return collection;
  };
  
  
  
  /*
  Want to do:
    project.tasks = function() {
      data.link_projects_tasks.getProjectTasks(this._id)
    }
    project.tags = function() {
       data.link_projects_tags.getProjectTags(this._id)
    }
    tag.projects = function() {
       data.link_projects_tags.getTagProjects(this._id)
    }
     
    constructor:
      self = this;
      
  
  */
  function RelateBadSetupError(message) {
    this.name = "RelateBadSetupError";
    this.message = (message || "");
  }
  RelateBadSetupError.prototype = new Error();
  //RelateBadSetupError.constructor = RelateBadSetupError;

  function registerCollection(collection) {
    //Used for collections and relationships.
    var name = collection.collectionName;
    if (name in self) {
      throw new RelateBadSetupError('Failed to register collection called \"' + name + 
        '\" as Object \"data\" already has a property with same name.' +
        '\nPerhaps you added the collection twice?');
    } else {
      self[name] = collection;
    }
  }
  
  function registerTypeIdentifier(collection) {
    var typeIdentifier = collection.typeIdentifier;
    if (typeIdentifier in self._typeIdentifiers) {
      var claimedBy = self._typeIdentifiers[typeIdentifier];
      throw new RelateBadSetupError('Collection \"' + collection.collectionName + '\" tried to register for the typeIdentifier: \"' + typeIdentifier + 
        '\" but it is already claimed by collection \"' + collection.collectionName + '\".' +
        '\nTypeIdentifiers are strings used to determine what collection each document should be loaded in');
    } else {
      self._typeIdentifiers[typeIdentifier] = collection;
    }
  }
  
  var _dataObtained = false;
  self.ready = function () {
    //Returns a promise that ensures data is only fetched once.
    var defer = $q.defer();
    if (_dataObtained) {
      defer.resolve();
    } else {
      loadData().then( function () {
        _dataObtained = true;
        defer.resolve();
      });
    }
    return defer.promise;
  };
  
  function registerDocument(document) {
    //Registers a document loaded from the db to the correct collection
    var typeIdentifier = document.type;
    if (typeIdentifier) {
      var collection = self._typeIdentifiers[typeIdentifier];
      if (collection) {
        collection._registerDocument(document, typeIdentifier); //TODO: is typeIdentifier needed?
      } else {
        console.log('Could not load document \"' + document._id + '\" as type was not recognised (' + typeIdentifier + ')');
      }
    } else {
      //self._db.remove(document);
      console.log('Could not load document \"' + document._id + '\" as it has no \"type\" field.');
    }
  }
  
  function loadData() {
    // Does the actual loading of data.
    var defer = $q.defer();
    self._db.allDocs({
      include_docs: true,
      attachments: true
    }).then(function (result) {
      angular.forEach(result.rows, function(row){
        //delete all:  self._db.remove(row.doc);
        registerDocument(row.doc);
      });
      defer.resolve();
    }).catch(function (err) {
      console.log(err);
    });
    return defer.promise;
  }
  
});
