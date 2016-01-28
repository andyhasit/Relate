c = console; 

describe('ParentChildRelationship', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, Collection, ParentChildRelationship, ValueRegister, $rootScope;
  var task1, task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, _ParentChildRelationship_, _$rootScope_, _ValueRegister_, _db_, $q) {
    Collection = _Collection_;
    ValueRegister = _ValueRegister_;
    ParentChildRelationship = _ParentChildRelationship_;
    $rootScope = _$rootScope_;
    db = _db_;
    
    projectCollection = new Collection(db, 'project', DummyFactory);
    taskCollection = new Collection(db, 'task', DummyFactory);
    projectCollection._registerDocument({_id: 'p001', name: 'project 1'});
    projectCollection._registerDocument({_id: 'p002', name: 'project 2'});
    taskCollection._registerDocument({_id: 't001', title: 'Do dishes'});
    taskCollection._registerDocument({_id: 't002', title: 'Go running'});
    taskCollection._registerDocument({_id: 't003', title: 'Go swimming'});
    taskCollection._registerDocument({_id: 't004', title: 'no parents'});
    
     
    task1 = taskCollection.getItem('t001');
    task2 = taskCollection.getItem('t002');
    task3 = taskCollection.getItem('t003');
    task4 = taskCollection.getItem('t004');
    project1 = projectCollection.getItem('p001');
    project2 = projectCollection.getItem('p002');
    
    relationship = new ParentChildRelationship(db, projectCollection, taskCollection);    
  }));
  
  fit('link works as expected', function() {
    
    relationship.link(project1, task1);
    $rootScope.$apply();
    relationship.link(project2, task2);
    $rootScope.$apply();
    relationship.link(project1, task3);
    $rootScope.$apply();
    relationship.link(project2, task4);
    $rootScope.$apply();
    expect(relationship.getChildren(project1)).toEqual([task1, task3]);
    expect(relationship.getChildren(project2)).toEqual([task2, task4]);
    expect(relationship.getParent(task1)).toEqual(project1);
    expect(relationship.getParent(task2)).toEqual(project2);
  });
  
  it('removeItem with parent calls remove on child collection', function() {
    
    relationship.link(project1, task1);
    spyOn(taskCollection, 'remove').and.callThrough();
    
  });
  
  /*
  getParent
  getChild
  link
  _removeItem
  
  idea is that _removeItem will 
  mock fake _parentDeleteInProgress ValueRegiter.
  */
  
});

