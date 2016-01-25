
/*
.and.returnValue($q.when({}));

*/
angular.module('PouchFake', []).service('db', function($q) {
  var self = this;
  self.documents = {};
  
  self.post = function(data) {
    var id = data._id || Date.now();
    data._id = id;
    data._rev = "1-" + id;
    self.documents[id] = data;
    return $q.when({
          "ok": true,
          "id": data._id,
          "rev": data._rev
        }
    );
  };
  
  self.put = function(data) {
    var id = data._id;
    var newRev = "2-" + id;
    data._rev = newRev;
    self.documents[id] = data;
    return $q.when({
          "ok": true,
          "id": data._id,
          "rev": data._rev
        }
    );
  };
  
  self.remove = function(data) {
    var id = data._id;
    var newRev = "2-" + id;
    data._rev = newRev;
    data._deleted = true;
    delete self.documents[id];
    return $q.when({
          "ok": true,
          "id": data._id,
          "rev": data._rev
        }
    );
  };
  
  self.get = function(id) {
    return $q.when(self.documents[id]);
  }
  
});
