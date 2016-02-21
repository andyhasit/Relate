
describe('Promise queuing', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, model, $rootScope, task1, task2, task3, task4, project1, project2;
  
  beforeEach(inject(function( _model_, _$rootScope_, FakeDb, _$q_) {
    $rootScope = _$rootScope_;
    db = new FakeDb();
    $q = _$q_;
    db.setData('task', ['name'], [
      ['task1'],
      ['task2'],
    ]);
    db.setData('project', ['project'], [
      ['project1'],
      ['project2'],
    ]);
    db.setData('lnk_child_tasks_of_project', ['parentId', 'childrenIds'], [
      ['project_1', ['task_2']]
    ]);
    db.setData('lnk_parent_project_of_task', ['parentId', 'childId'], [
      ['project_1', 'task_2']
    ]);
    
    model = _model_;
    model.initialize(db);
    model.collection('project', ['name'], DummyFactory);
    model.collection('task', ['name'], DummyFactory);
    model.join({
      type:'parentChild',
      parent:'project', 
      child:'task'
    });
    
    model.dataReady();
    $rootScope.$apply();
    
    task1 = model.getTask('task_1');
    task2 = model.getTask('task_2');
    project1 = model.getProject('project_1');
    project2 = model.getProject('project_2');
    
  }));
  
  it('"put" gets called twice if promises flushed (sanity check)', function() {
    spyOn(db, 'put').and.callThrough();
    var oldRev1 = task1._rev;
    var oldRev2 = task2._rev;
    task1.name = 'go surfing';
    task2.name = 'go skating';
    model.saveTask(task1);
    model.saveTask(task2);
    $rootScope.$apply();
    expect(db.put.calls.count()).toEqual(2);
    expect(task1._rev).not.toEqual(oldRev1);
    expect(task2._rev).not.toEqual(oldRev2);
  });
  
  it('"put" gets called once if promises are not flushed', function() {
    var task3;
    model.newTask('test').then(function(result) {
      task3 = result;
    });
    $rootScope.$apply();
    var oldRev1 = task1._rev;
    var oldRev2 = task2._rev;
    var oldRev3 = task3._rev;
    task1.name = 'go surfing';
    task2.name = 'go skating';
    task3.name = 'go skiing';
    
    var dbPromiseQueue = [];
    function resolveDbCall(index, promise) {
      promise.then(function(result){
        dbPromiseQueue[index].resolve(result);
      });
      var scope = $rootScope.$new();
      scope.x = dbPromiseQueue[index];
      scope.$digest();
    }
    spyOn(db, 'put').and.callFake(function() {
      var defer = $q.defer();
      dbPromiseQueue.push(defer);
      return defer.promise;
    });
    
    model.saveTask(task1);
    model.saveTask(task2);
    model.saveTask(task3);
    
    // Flush promises in the model, but not in the db
    //$rootScope.$apply();
    // Nothing should have changed, and only the first call should have gone through.
    expect(db.put.calls.count()).toEqual(1); 
    expect(task1._rev).toEqual(oldRev1);
    expect(task2._rev).toEqual(oldRev2);    
    
    
    // Flush first db call, returning what "put" would 
    resolveDbCall(0, db.put_clone(task1));
    // Second call should have gone through.
    expect(db.put.calls.count()).toEqual(2);
    expect(task1._rev).not.toEqual(oldRev1);
    expect(task2._rev).toEqual(oldRev2);
    
    // Flush second db call.
    resolveDbCall(1, db.put_clone(task2));
    expect(db.put.calls.count()).toEqual(2);
    expect(task1._rev).not.toEqual(oldRev1);
    expect(task2._rev).not.toEqual(oldRev2);
    expect(task3._rev).toEqual(oldRev3);
    
    // Flush third db call.
    resolveDbCall(2, db.put_clone(task3));
    expect(db.put.calls.count()).toEqual(3);
    expect(task1._rev).not.toEqual(oldRev1);
    expect(task2._rev).not.toEqual(oldRev2);
    expect(task3._rev).not.toEqual(oldRev3);
    
  });
  
  scope = $rootScope.$new();
  
 
});

/*

queue test: two calls; second one doesn't even fire until first is resolved. Check current implementation does fail for now.

2 objects, do saves.



*/