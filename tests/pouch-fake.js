
/*
.and.returnValue($q.when({}));

*/
function debug(item, cue){
  if (cue) {
    console.log('' + cue);
  }
  console.log('' + item);
}

angular.module('PouchFake', []).service('db', function($q) {
  var self = this;
  self.nextId = 1;
  
  function newId(){
    self.nextId ++;
    return self.nextId;
  }
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
    var id = data._id || newId();
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
  };
  
  self.allDocs = function(id) {
    var data = {
      "offset": 0,
      "total_rows": 1,
      "rows": [{
        "doc": {
          "_id": "0B3358C1-BA4B-4186-8795-9024203EB7DD",
          "_rev": "1-5782E71F1E4BF698FA3793D9D5A96393",
          "title": "Sound and Vision",
          "_attachments": {
            "attachment/its-id": {
              "content_type": "image/jpg",
              "data": "R0lGODlhAQABAIAAAP7//wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
              "digest": "md5-57e396baedfe1a034590339082b9abce"
            }
          }
        },
       "id": "0B3358C1-BA4B-4186-8795-9024203EB7DD",
       "key": "0B3358C1-BA4B-4186-8795-9024203EB7DD",
       "value": {
        "rev": "1-5782E71F1E4BF698FA3793D9D5A96393"
       }
     }]
    };
    return $q.when(data);
    /*
    spyOn(db, 'allDocs').returnValue($q.when({rows:[
      {
        id: '123',
        doc: {_id:'123', _rev: '1-123', name: 'hello'}
      }
    ]}));
    */
  };
  
});

var DummyFactory = function () {
};
  
