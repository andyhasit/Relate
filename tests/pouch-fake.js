
/*
.and.returnValue($q.when({}));

*/
angular.module('PouchFake', []).service('db', function($q) {
  var self = this;
  self.documents = {};
  
  function copyObject(data) {
    var document = {};
    for (var prop in data) {
      if (data.hasOwnProperty(prop)) {
          document[prop] = data[prop];
      }
    }
    return document;
  }
  self.post = function(data) {
    var document = copyObject(data);
    var id = data._id || Date.now();
    document._id = id;
    document._rev = "1-" + id;
    self.documents[id] = document;
    return $q.when({
          "ok": true,
          "id": document._id,
          "rev": document._rev
        }
    );
  };
  
  self.put = function(data) {
    var document = copyObject(data);
    var id = document._id;
    var newRev = "2-" + id;
    document._rev = newRev;
    self.documents[id] = document;
    return $q.when({
          "ok": true,
          "id": document._id,
          "rev": document._rev
        }
    );
  };
  
  self.remove = function(data) {
    var document = copyObject(data);
    var id = document._id;
    var newRev = "2-" + id;
    document._rev = newRev;
    document._deleted = true;
    delete self.documents[id];
    return $q.when({
          "ok": true,
          "id": document._id,
          "rev": document._rev
        }
    );
  };
  
  self.get = function(id) {
    return $q.when(self.documents[id]);
  }
  
});

var DummyFactory = function (document) {
  this.document = document;
  this._id = document._id;
};
  
