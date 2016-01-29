
angular.module('Relate').factory('BaseCollection', function($q) {
    
  var BaseCollection = function() {
    
  };
  BaseCollection.prototype.__createDocument = function(document) {
    //Post then fetch a new document.
    var defer = $q.defer();
    var self = this;
    self._db.post(document).then( function (result) {
      if (result.ok) {
        self._db.get(result.id).then( function (docFromDb) {        
          defer.resolve(docFromDb);
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