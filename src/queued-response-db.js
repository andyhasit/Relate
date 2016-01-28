
angular.module('Relate').factory('QueuedResponseDb', function($q, ValueRegister) {
  /*
  post put get remove
  */
  var QueuedResponseDb = function(db) {
    var self = this;
    self._db = db;
    self.queue = {};
    self._nextId = 1;
    
    self.put = function(data) {
      var promiseId = self.getNextId();
      var hiddenPromise = self._db.put(data);
      var returnedPromise = $q.defer();
      self.queuePromise(promiseId, hiddenPromise, returnedPromise);
      hiddenPromise.then(function(response) {
        self.releasePromises();
      });
      return returnedPromise.promise;
    };
  }
   
  QueuedResponseDb.prototype.getNextId = function (){
    this._nextId ++;
    return this._nextId;
  }
  
  QueuedResponseDb.prototype.queuePromise = function(promiseId, hiddenPromise, returnedPromise) {
    self.queue[promiseId] = (hiddenPromise, returnedPromise);
  };
  
  QueuedResponseDb.prototype.queuePromisePair = function() {
    
  };
  
});