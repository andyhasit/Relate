c = console; 

describe('Collection', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, Collection, $rootScope;
  
  beforeEach(inject(function(_Collection_, _$rootScope_, _db_, $q) {
    Collection = _Collection_;
    $rootScope = _$rootScope_;
    db = _db_;
  }));

  it('registers items as the correct objects', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection._registerDocument({_id: 123, name: 'test1'});
    collection._registerDocument({_id: 456, name: 'test2'});
    expect(collection.items.length).toEqual(2);
    expect(collection.items[0]).toEqual(jasmine.any(DummyFactory));
  });
  
  it('adds items to db correctly', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection.add({name: 'test1'});
    $rootScope.$apply();
    expect(collection.items.length).toEqual(1);
    var item = collection.items[0];
    expect(item.document.name).toEqual('test1');
    var documentInDb;
    db.get(item.document._id).then(function(result) {
      documentInDb = result;
    });
    $rootScope.$apply();
    expect(documentInDb).toEqual(item.document);
  });
  
  it('saves changes to db correctly', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection.add({name: 'test1'});
    $rootScope.$apply();
    var item = collection.items[0];
    item.document.name = "boo";
    collection.save(item);
    var documentInDb;
    db.get(item.document._id).then(function(result) {
      documentInDb = result;
    });
    $rootScope.$apply();
    expect(documentInDb.name).toEqual("boo");
  });
  
  it('removes document from db correctly', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection.add({name: 'test1'});
    $rootScope.$apply();
    var item = collection.items[0];
    collection.remove(item);
    $rootScope.$apply();
    var documentInDb;
    db.get(item.document._id).then(function(result) {
      documentInDb = result;
    });
    $rootScope.$apply();
    expect(documentInDb).toBeUndefined(); 
  });
  
});

