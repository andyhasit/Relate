ss

/*

queue test: two calls; second one doesn't even fire until first is resolved. Check current implementation does fail for now.

2 objects, do saves.



*/


describe('Promise queuing', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, model, $rootScope, task1, task2, task3, task4, project1, project2;
  
  beforeEach(inject(function( _RelateModel_, _$rootScope_, FakeDb, $q) {
    $rootScope = _$rootScope_;
    var db = new FakeDb();
    
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
    
    model = new _RelateModel_(db);
    model.defineCollection('project', ['name'], DummyFactory);
    model.defineCollection('task', ['name'], DummyFactory);
    model.defineRelationship({
      type:'parentChild',
      parent:'project', 
      child:'task'
    });
    
    model.onDataReady();
    $rootScope.$apply();
    
    task1 = model.getTask('task_1');
    task2 = model.getTask('task_2');
    project1 = model.getProject('project_1');
    project2 = model.getProject('project_2');
    
  }));
  
  it('getItem works on fresh load', function() {
    expect(typeof task2).toEqual('object');
    expect(task2._id).toEqual('task_2');
  });
  
});