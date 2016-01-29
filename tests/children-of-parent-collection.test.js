c = console; 

describe('ChildrenOfParentCollection', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, ChildrenOfParentCollection, ParentOfChildCollection, Collection, $rootScope, projectCollection, taskCollection, collection;
  var task1, task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, QueuedResponseDb, _ChildrenOfParentCollection_, _ParentOfChildCollection_, _$rootScope_, _db_, $q) {
    Collection = _Collection_;
    ChildrenOfParentCollection = _ChildrenOfParentCollection_;
    ParentOfChildCollection = _ParentOfChildCollection_;
    $rootScope = _$rootScope_;
    db = new QueuedResponseDb(_db_);
    projectCollection = new Collection(db, 'project', DummyFactory);
    taskCollection = new Collection(db, 'task', DummyFactory);
    projectCollection._registerDocument({_id: 'p001', name: 'project 1'});
    projectCollection._registerDocument({_id: 'p002', name: 'project 2'});
    taskCollection._registerDocument({_id: 't001', title: 'Do dishes'});
    taskCollection._registerDocument({_id: 't002', title: 'Go running'});
    taskCollection._registerDocument({_id: 't003', title: 'Go swimming'});
    taskCollection._registerDocument({_id: 't004', title: 'no parents'});
    
    collection = new ChildrenOfParentCollection(db, projectCollection, taskCollection);
    
    
    task1 = taskCollection.getItem('t001');
    task2 = taskCollection.getItem('t002');
    task3 = taskCollection.getItem('t003');
    task4 = taskCollection.getItem('t004');
    
    project1 = projectCollection.getItem('p001');
    project2 = projectCollection.getItem('p002');
  }));
  
  function createDefaultLinks() {
    collection._registerDocument({_id: '456', parentId: 'p001', childIds: ['t001', 't002', 't003']});
    collection._registerDocument({_id: '789', parentId: 'p002', childIds: ['t004']});
  }
  
  fit('link works with completely new items', function() {
    expect(collection.getChildren(project1)).toEqual([]);
    expect(collection.getChildren(project2)).toEqual([]);
    collection.link(project2, task1);
    collection.link(project2, task2);
    $rootScope.$apply();
    expect(collection.getChildren(project1)).toEqual([]);
    expect(collection.getChildren(project2)).toEqual([task1, task2]);
  });
  
  it('link works with items that have parents', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    collection.link(project2, task1);
    $rootScope.$apply();
    expect(collection.getChildren(project1)).toEqual([task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4, task1]);
  });
  
  it('link task with no previous parent works', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    taskCollection._registerDocument({_id: '778923', title: 'New task'});
    var task5 = taskCollection.getItem('778923');
    collection.link(project1, task5);
    $rootScope.$apply();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3, task5]);
    expect(collection.getChildren(project2)).toEqual([task4]);
  });
  
  it('link to parent null works', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    collection.link(null, task1);
    $rootScope.$apply();
    expect(collection.getChildren(project1)).toEqual([task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
  });
    
  it('getChildren returns the correct objects', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
  });
  
  it('removeChild works', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    collection.removeChild(task1);
    $rootScope.$apply();
    expect(collection.getChildren(project1)).toEqual([task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
  });
  
  it('removeParent works', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    collection.link(project1, task4);//Just moving task4 so project2 is empty.
    $rootScope.$apply();
    expect(collection.getChildren(project2)).toEqual([]);
    spyOn(db, 'remove').and.callThrough();
    collection.removeParent(project2);
    $rootScope.$apply();
    expect(db.remove).toHaveBeenCalledWith({_id: '789', parentId: 'p002', childIds: [ ] });
  });
  
  it('removeChild fails if it still has children', function() {
    createDefaultLinks();
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    spyOn(db, 'remove').and.callThrough();
    var fn = function() {
      collection.removeParent(project2);
      $rootScope.$apply();
    }
    expect(fn).toThrow('Cannot delete parent object as it still has children');
  });
  
  /*
  Test sequences of operations to check _reverseIndex was updated -- how?
  */
  
});

