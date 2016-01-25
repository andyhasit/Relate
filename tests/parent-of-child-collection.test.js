c = console; 

describe('ParentOfChildCollection', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, Collection, $rootScope, projectCollection, taskCollection, collection, task1,
    task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, _ParentOfChildCollection_, _$rootScope_, _db_, $q) {
    Collection = _Collection_;
    ParentOfChildCollection = _ParentOfChildCollection_;
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
    
    collection = new ParentOfChildCollection(db, projectCollection, taskCollection);
    collection._registerDocument({_id: '123', childId: '002', parentId: '001'});
    collection._registerDocument({_id: '456', childId: '003', parentId: '001'});
    collection._registerDocument({_id: '789', childId: '004', parentId: '011'});
    
    task1 = taskCollection.getItem('002');
    task2 = taskCollection.getItem('003');
    task3 = taskCollection.getItem('004');
    task4 = taskCollection.getItem('005');
    
    project1 = projectCollection.getItem('001');
    project2 = projectCollection.getItem('011');
  }));
  
  it('getParent returns the correct object', function() {
    expect(collection.getParent(task1)).toEqual(project1);
    expect(collection.getParent(task2)).toEqual(project1);
    expect(collection.getParent(task3)).toEqual(project2);
    
    collection.link(project2, task1);    
    expect(collection.getParent(task1)).toEqual(project1);
    $rootScope.$apply();
    expect(collection.getParent(task1)).toEqual(project2);
  });
  
  it('link changes parent on $digest', function() {
    expect(collection.getParent(task1)).toEqual(project1);
    collection.link(project2, task1);    
    expect(collection.getParent(task1)).toEqual(project1);
    $rootScope.$apply();
    expect(collection.getParent(task1)).toEqual(project2);
  });
  
  it('link works with tasks with no parents', function() {
    expect(collection.getParent(task4)).toEqual(null);
    expect(collection.getParent(task1)).toEqual(project1);
    collection.link(null, task1);
    collection.link(project1, task4);
    
    expect(collection.getParent(task4)).toEqual(null);
    expect(collection.getParent(task1)).toEqual(project1);
    $rootScope.$apply();
    
    expect(collection.getParent(task1)).toEqual(null);
    expect(collection.getParent(task4)).toEqual(project1);
  });
  
  it('link works with unregistered child', function() {
    taskCollection._registerDocument({_id: '778923', title: 'New task'});
    var task5 = taskCollection.getItem('778923');
    expect(collection.getParent(task5)).toEqual(null);
    collection.link(project1, task5);
    $rootScope.$apply();
    expect(collection.getParent(task5)).toEqual(project1);
  });
  
  it('link works with unregistered parent', function() {
    projectCollection._registerDocument({_id: 'sdfd8923', name: 'Proj 5'});
    var project5 = projectCollection.getItem('sdfd8923');
    taskCollection._registerDocument({_id: '778923', title: 'New task'});
    var task5 = taskCollection.getItem('778923');
    expect(collection.getParent(task5)).toEqual(null);
    collection.link(project5, task5);
    $rootScope.$apply();
    expect(collection.getParent(task5)).toEqual(project5);
  });
  
  
  /*

  removeChild
  */
  
});

