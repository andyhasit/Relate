

xdescribe('TestDataService', function() {
  
  beforeEach(module('Relate'));
  
  var data, db;
  
  beforeEach(inject(function(_data_, _db_, QueuedResponseDb) {
    data = _data_;
    db = new QueuedResponseDb(_db_);
  }));
  
  var DummyFactory = function (doc) {
    this.doc = doc;
  };
  
  it('creates collection as property', function() {
    expect(data['projects']).not.toBeDefined();
    var collection = data.addCollection('project', DummyFactory);
    expect(data['projects']).toEqual(collection);
  });
  
  it('throws an error if registering two collection with same name', function() {
    //TODO: doesn't catch specific RelateBadSetupError, just Error;
    data.addCollection('project', DummyFactory);
    var wrapper = function () {
      data.addCollection('project', DummyFactory)
    };
    expect(wrapper).toThrow();
  });
  
  /*
  TODO:
    throws an error if registering two collection with same typeIdentifier' (Once collection options are implemented
    loading works (dummy db.allDocs())
  */

});

