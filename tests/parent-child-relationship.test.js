c = console; 

describe('ParentChildRelationship', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, Collection, ParentChildRelationship, ValueRegister, $rootScope;
  
  beforeEach(inject(function(_Collection_, _ParentChildRelationship_, _$rootScope_, _ValueRegister_, _db_, $q) {
    Collection = _Collection_;
    ValueRegister = _ValueRegister_;
    ParentChildRelationship = _ParentChildRelationship_;
    $rootScope = _$rootScope_;
    db = _db_;
    
    projectCollection = new Collection(db, 'project', DummyFactory);
    taskCollection = new Collection(db, 'task', DummyFactory);
    projectCollection._registerDocument({_id: '001', name: 'project 1'});
    projectCollection._registerDocument({_id: '011', name: 'project 2'});
    taskCollection._registerDocument({_id: '002', title: 'Do dishes'});
    taskCollection._registerDocument({_id: '003', title: 'Go running'});
    taskCollection._registerDocument({_id: '004', title: 'Go swimming'});
    taskCollection._registerDocument({_id: '005', title: 'no parents'});
    
    relationship = new ParentChildRelationship(db, projectCollection, taskCollection);
        
    task1 = taskCollection.getItem('002');
    task2 = taskCollection.getItem('003');
    task3 = taskCollection.getItem('004');
    task4 = taskCollection.getItem('005');
    project1 = projectCollection.getItem('001');
    project2 = projectCollection.getItem('011');
    
    relationship.link({_id: '456', parentId: '001', childIds: ['002', '003', '004']});
    relationship.link({_id: '789', parentId: '011', childIds: ['005']});
    
  }));
  
  it('removeItem calls ..?', function() {
    var collection = new Collection(db, 'project', DummyFactory);
    collection._registerDocument({_id: 123, name: 'test1'});
    collection._registerDocument({_id: 456, name: 'test2'});
    expect(collection.items.length).toEqual(2);
    expect(collection.items[0]).toEqual(jasmine.any(DummyFactory));
  });
  
  /*
  getParent
  getChild
  link
  _removeItem
  
  idea is that _removeItem will 
  mock fake _parentDeleteInProgress ValueRegiter.
  
  
});

