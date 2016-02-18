
describe('Model', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, model, $rootScope, projectCollection, taskCollection, task1,
    task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, QueuedResponseDb, _RelateModel_, _$rootScope_, _db_, $q) {
    $rootScope = _$rootScope_;
    db = _db_;
    model = new _RelateModel_(db);
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
    model.defineCollection('project', ['name'], DummyFactory);
    model.defineCollection('task', ['name'], DummyFactory);
    model.defineRelationship({
      type:'parentChild',
      parent:'project', 
      child:'task'
    });
    model.onDataReady();
    $rootScope.$apply();
    
    task1 = model.getTask('t001');
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    project2 = model.getProject('p002');
    
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
    expect(typeof task2).toEqual('object');
    expect(task2._id).toEqual('t002');
  });
  
  it('loaded items have expected properties', function() {
    expect(task2._id).toEqual('t002');
    expect(task2._rev).toEqual('1-t002');
    expect(task2.name).toEqual('task2');
  });
  
  it('getParent works on fresh load', function() {
    expect(model.getTaskProject(task2)).toEqual(project1);
  });
  
  it('getChildren works on fresh load', function() {
    expect(model.getProjectTasks(project1)).toEqual([task2]);
  });
  
  /*save delete new */
  
  it('find works with object as query', function() {
    var results = model.findTasks({name: 'task1'});
    expect(results).toEqual([task1]);
  });
  
  it('find with empty object as query returns all objects', function() {
    var results = model.findTasks({});
    expect(results).toEqual([task1, task2]);
  });
  
  it('can create items', function() {
    var task3;
    model.newTask({name: 'unicycle'}).then(function() {
      task3 = model.findTasks({name: 'unicycle'})[0];
    });
    $rootScope.$apply();
    expect(task3.name).toEqual('unicycle');
    expect(model.findTasks({}).length).toEqual(3);
  });
  
  it('can link items', function() {
    expect(model.getTaskProject(task2)).toEqual(project1);
    expect(model.getTaskProject(task1)).toEqual(null);
    expect(model.getProjectTasks(project1)).toEqual([task2]);
    
    model.setTaskProject(task1, project1);
    $rootScope.$apply();
    expect(model.getTaskProject(task1)).toEqual(project1);
    expect(model.getProjectTasks(project1)).toEqual([task2, task1]);
  });
  
  it('can link and unlink items at will', function() {
    expect(model.getProjectTasks(project1)).toEqual([task2]);
    model.newProject({name: 'newProj'}).then(function(proj) {
      newProject = proj;
    });
    $rootScope.$apply();
    expect(newProject.name).toEqual('newProj');
    model.setTaskProject(task2, newProject);
    $rootScope.$apply();
    expect(model.getProjectTasks(project1)).toEqual([]);
    expect(model.getTaskProject(task2)).toEqual(newProject);
  });
  
});