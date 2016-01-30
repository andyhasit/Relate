c = console; 

describe('Collection', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, collection, Collection, $rootScope;
  
  beforeEach(inject(function(_Collection_, QueuedResponseDb, _$rootScope_, _db_, $q) {
    Collection = _Collection_;
    $rootScope = _$rootScope_;
    db = new QueuedResponseDb(_db_);
    collection = new Collection(db, 'project', DummyFactory);
  }));

  it('registers items as the correct objects', function() {
    collection._registerDocument({_id: 123, name: 'test1'});
    collection._registerDocument({_id: 456, name: 'test2'});
    expect(collection.items.length).toEqual(2);
    expect(collection.items[0]).toEqual(jasmine.any(DummyFactory));
  });
  
  it('adds items to db correctly', function() {
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
    expect(documentInDb.type).toEqual(collection.typeIdentifier);
  });
  
  it('saves changes to db correctly', function() {
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
  
  it('removes document trigges calls to relationships', function() {
    collection.add({name: 'test1'});
    /*collection._registerRelationship()
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
    */
  });
  
});

