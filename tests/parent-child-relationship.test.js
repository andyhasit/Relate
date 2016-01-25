c = console; 

describe('ParentOfChildCollection', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, Collection, $rootScope;
  
  beforeEach(inject(function(_Collection_, _ParentOfChildCollection_, _$rootScope_, _db_, $q) {
    Collection = _Collection_;
    ParentOfChildCollection = _ParentOfChildCollection_;
    $rootScope = _$rootScope_;
    db = _db_;
  }));
  
  it('........registers items as the correct objects', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection._registerDocument({_id: 123, name: 'test1'});
    collection._registerDocument({_id: 456, name: 'test2'});
    expect(collection.items.length).toEqual(2);
    expect(collection.items[0]).toEqual(jasmine.any(DummyFactory));
  });
  
  
});

