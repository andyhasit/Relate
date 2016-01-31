
fdescribe('Model', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, model, Collection, $rootScope, projectCollection, taskCollection, collection, task1,
    task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, QueuedResponseDb, _Model_, _$rootScope_, _db_, $q) {
    $rootScope = _$rootScope_;
    db = _db_;
    model = new _Model_(db);
    //TODO: change this to fakeDb set, and add getLastX
    spyOn(db, 'allDocs').and.returnValue($q.when({rows:[
      {
        id: 'p001',
        doc: {_id:'p001', _rev: '1-p001', type: 'project', name: 'project1'}
      },
      {
        id: 'p002',
        doc: {_id:'p002', _rev: '1-p002', type: 'project', name: 'project2'}
      },
      {
        id: 't001',
        doc: {_id:'t001', _rev: '1-t001', type: 'task', name: 'task1'}
      },
      {
        id: 't002',
        doc: {_id:'t002', _rev: '1-t002', type: 'task', name: 'task2'}
      },
      {
        id: 'lnk001',
        doc: {_id:'lnk001', _rev: '1-lnk001', type: 'lnk_child_tasks_of_project', parentId: 'p001', childrenIds: ['t002']}
      }
      ,
      {
        id: 'lnk002',
        doc: {_id:'lnk002', _rev: '1-lnk002', type: 'lnk_parent_project_of_task', parentId: 'p001', childId: 't002'}
      }
      
    ]}));
    model.addCollection('project', ['name'], DummyFactory);
    model.addCollection('task', ['name'], DummyFactory);
    model.addParentChildLink('project', 'task');
    model.ready();
    $rootScope.$apply();
  }));
  
  it('creates accessor functions', function() {
    expect(typeof model.newTask).toEqual('function');
    expect(typeof model.findTasks).toEqual('function');
    expect(typeof model.saveTask).toEqual('function');
    expect(typeof model.deleteTask).toEqual('function');
    expect(typeof model.getTaskProject).toEqual('function');
    expect(typeof model.getProjectTasks).toEqual('function');
  });
   
  it('getItem works on fresh load', function() {
    task2 = model.getTask('t002');
    expect(typeof task2).toEqual('object');
    expect(task2._id).toEqual('t002');
  });
  
  it('loaded items have expected properties', function() {
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    expect(task2._id).toEqual('t002');
    expect(task2._rev).toEqual('1-t002');
    expect(task2.name).toEqual('task2');
  });
  
  it('getParent works on fresh load', function() {
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    expect(model.getTaskProject(task2)).toEqual(project1);
  });
  
  it('getChildren works on fresh load', function() {
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    expect(model.getProjectTasks(project1)).toEqual([task2]);
  });
  
  /*save delete new */
  
  it('find works with object as query', function() {
    task1 = model.getTask('t001');
    var results = model.findTasks({name: 'task1'});
    expect(results).toEqual([task1]);
  });
  
  it('find with empty object as query returns all objects', function() {
    task1 = model.getTask('t001');
    var results = model.findTasks({});
    expect(results).toEqual([task1, task2]);
  });
  
  it('can create items', function() {
    task1 = model.getTask('t001');
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    var task3;
    model.newTask({name: 'unicycle'}).then(function() {
      task3 = model.findTasks({name: 'unicycle'})[0];
    });
    $rootScope.$apply();
    expect(task3.name).toEqual('unicycle');
    expect(model.findTasks({}).length).toEqual(3);
  });
  
  it('can link items', function() {
    task1 = model.getTask('t001');
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    expect(model.getTaskProject(task2)).toEqual(project1);
    expect(model.getTaskProject(task1)).toEqual(null);
    expect(model.getProjectTasks(project1)).toEqual([task2]);
    
    model.setTaskProject(task1, project1);
    $rootScope.$apply();
    expect(model.getTaskProject(task1)).toEqual(project1);
    expect(model.getProjectTasks(project1)).toEqual([task2, task1]);
  });
  
  xit('can link and unlink items at will', function() {
    task1 = model.getTask('t001');
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    expect(model.getTaskProject(task2)).toEqual(project1);
    expect(model.getTaskProject(task1)).toEqual(null);
    model.setTaskProject(task1, project1);
    $rootScope.$apply();
    expect(model.getTaskProject(task1)).toEqual(project1);
  });
  
});