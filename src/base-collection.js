
angular.module('Relate').factory('BaseCollection', function($q) {
  /*
  A collection has an internal index of the objects in the database.
  What it uses as keys and values is up to the derived class.
  */
  var BaseCollection = function()    {var self = this;
    self.__index = null;
    self.__db = null;
  };
  
  BaseCollection.prototype.__createPending = function(key, document)    {var self = this;
    self._index[key] = {
      pending: true,
      pendingPromise: self.__createInDbThenLoad(document)
    };
  };
  
  BaseCollection.prototype.__createInDbThenLoad = function(document)    {var self = this;
    var defered = $q.defer();
    document.type = self.typeIdentifier;
    self.__db.post(document).then( function (result) {
      if (result.ok) {
        self.__db.get(result.id).then( function (docFromDb) {        
          defered.resolve(self.loadDocumentFromDb(docFromDb));
        });
      } else {
        console.log(result);
        throw "Error fetching data";
      }
    });
    return defered.promise;
  };
  
  return BaseCollection;
});