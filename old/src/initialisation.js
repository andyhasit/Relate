
angular.module('relate').service('Initialiser', function($q, BackEnd, collections, relationships, Collection, ChildrenRelationship, ParentRelationship) {
  /*
  Initialises the collections and relationships based on the model.
  var model = [
    'bucket:log',
    'bucket:task',
    'day:log',
    'day:task',
    'task:scoreField'
  ];
  
  */
  function getCollection (name) {
    var pluralName = name + 's';
    var collection = collections[pluralName];
    if (collection == undefined) {
      collection = new Collection(pluralName, name);
      promises.push(collection.items.$loaded());
      collections[pluralName] = collection;
    }
    return collection;
  }
  
  function registerRelationship (relationship) {
    relationships[relationship.name] = relationship;
    promises.push(relationship.items.$loaded());
  }
  
  var promises;
  
  this.initialise = function (startPath, model) {
    BackEnd.initialise(startPath);
    promises = [];
    var defer = $q.defer();
    angular.forEach(model, function (entry) {
      var elements = entry.split(':');
      var parent = elements[0];
      var child = elements[1];
      childCollection = getCollection(child);
      parentCollection = getCollection(parent);
      //Create relationships...
      childrenRelationship = new ChildrenRelationship(parentCollection, childCollection);
      parentRelationship = new ParentRelationship(parentCollection, childCollection);
      registerRelationship(childrenRelationship);
      registerRelationship(parentRelationship);
      //Cross-link...
      childCollection.__addParentRelationship(parentRelationship);
      parentCollection.__addChildrenRelationship(childrenRelationship);
    });
    $q.all(promises).then( function () {
      defer.resolve();
    });
    return defer.promise;
  };
  
});

