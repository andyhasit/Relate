
angular.module('Relate').factory('BaseCollection', function($q) {
  /*
  A collection has an internal index of the objects in the database.
  What it uses as keys and values is up to the derived class.
  */
  var BaseCollection = function() {
    this._index = {};
  };
  
  BaseCollection.prototype._registerDocument = function(docFromDb) {
    //Presumably adds the document to the index.
    throw 'Must implement in derived class';
  };
  
  BaseCollection.prototype.__createPending = function(key, document) {
    var self = this;
    self._index[key] = {
      pending: true,
      pendingPromise: self.__createDocument(document)
    };
  };
  
  BaseCollection.prototype.__getIndexEntry = function(key) {
    //Returns a promise which resolves to the new indexEntry.
    var defer = $q.defer();
    var self = this;
    var indexEntry = self._index[key];
    if (indexEntry) {
      if (indexEntry.pending) { // Db creation is pending
        indexEntry.pendingPromise.then( function (newIndexEntry) {
          defer.resolve(newIndexEntry);
        });
      } else { // Db creation is not pending
        defer.resolve(indexEntry);
      }
    } else {
      defer.resolve(null);
    }
    return defer.promise;
  };
  
  BaseCollection.prototype.__createDocument = function(document) {
    //Post then fetch a new document.
    var defer = $q.defer();
    var self = this;
    document.type = self.typeIdentifier;
    self._db.post(document).then( function (result) {
      if (result.ok) {
        self._db.get(result.id).then( function (docFromDb) {        
          defer.resolve(self._registerDocument(docFromDb));
        });
      } else {
        console.log(result);
        throw "Error fetching data";
      }
    });
    return defer.promise;
  };
  
  return BaseCollection;
});