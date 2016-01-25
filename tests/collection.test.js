c = console; 

describe('Collection', function() {
  
  beforeEach(module('Relate'));
  
  var Collection;
  
  var db = {};
  
  beforeEach(inject(function(_Collection_) {
    Collection = _Collection_;
  }));
  
  var DummyFactory = function (doc) {
    this.doc = doc;
  };
  
   var DummyFactory2 = function (doc) {
    this.doc = doc;
  };
  
  //var Collection = function(db, name, factory, options)
  
  it('registers items as the correct objects', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection._registerDocument({_id: 123, name: 'test1'});
    collection._registerDocument({_id: 456, name: 'test2'});
    expect(collection.items.length).toEqual(2);
    expect(collection.items[0]).toEqual(jasmine.any(DummyFactory));
  });
  
  /*
  TODO:
    Test add, delete, save etc...
    
  */
  
});

