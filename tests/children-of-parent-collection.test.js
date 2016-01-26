c = console; 

describe('ChildrenOfParentCollection', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, ChildrenOfParentCollection, ParentOfChildCollection, Collection, $rootScope, projectCollection, taskCollection, collection, task1,
    task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, _ChildrenOfParentCollection_, _ParentOfChildCollection_, _$rootScope_, _db_, $q) {
    Collection = _Collection_;
    ChildrenOfParentCollection = _ChildrenOfParentCollection_;
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
    
    var parentOfChildCollection = new ParentOfChildCollection(db, projectCollection, taskCollection);
    parentOfChildCollection._registerDocument({_id: '123', childId: '002', parentId: '001'});
    parentOfChildCollection._registerDocument({_id: '456', childId: '003', parentId: '001'});
    parentOfChildCollection._registerDocument({_id: '789', childId: '004', parentId: '011'});
    
    collection = new ChildrenOfParentCollection(db, projectCollection, taskCollection, parentOfChildCollection);
    collection._registerDocument({_id: '456', parentId: '001', childIds: ['002', '003', '004']});
    collection._registerDocument({_id: '789', parentId: '011', childIds: ['005']});
    
    task1 = taskCollection.getItem('002');
    task2 = taskCollection.getItem('003');
    task3 = taskCollection.getItem('004');
    task4 = taskCollection.getItem('005');
    
    project1 = projectCollection.getItem('001');
    project2 = projectCollection.getItem('011');
  }));
  
  /*
  getChildren
  
  
  */

  
  it('getChildren returns the correct objects', function() {
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    /*
    collection.link(project2, task1);
    expect(collection.getParent(task1)).toEqual(project1);
    $rootScope.$apply();
    expect(collection.getParent(task1)).toEqual(project2);
    */
  });
  
  it('link changes correctly', function() {
    expect(collection.getChildren(project1)).toEqual([task1, task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4]);
    collection.link(project2, task1);
    $rootScope.$apply();
    expect(collection.getChildren(project1)).toEqual([task2, task3]);
    expect(collection.getChildren(project2)).toEqual([task4, task1]);
  });
  
  
  /*
  
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
  
  it('link creates documents of correct type', function() {
    spyOn(db, 'post').and.callThrough();
    taskCollection._registerDocument({_id: '778923', title: 'New task'});
    var task5 = taskCollection.getItem('778923');
    $rootScope.$apply();
    collection.link(project1, task5);
    $rootScope.$apply();
    expect(db.post).toHaveBeenCalledWith({
      childId: task5._id,
      parentId: project1._id,
      type: collection.typeIdentifier
    });
  });
  
  it('removeChild removes the key', function() {
    collection.removeChild(task1);
    expect(collection.getParent(task1)).toEqual(project1);
    $rootScope.$apply();
    expect(collection.getParent(task1)).toEqual(null);
  });
  */  
});

