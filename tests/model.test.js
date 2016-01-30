
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
    model.addCollection('project', DummyFactory);
    model.addCollection('task', DummyFactory);
    model.addParentChildLink('project', 'task');
    model.ready();
    $rootScope.$apply();
  }));
  
  fit('normal loading creates functions as expected', function() {
    task2 = model.getTask('t002');
    project1 = model.getProject('p001');
    expect(model.getTaskProject(task2)).toEqual(project1);
    expect(model.getProjectTasks(project1)).toEqual([task2]);
    expect(model.findTasks().length).toEqual(2);
  });
  
  it('can link items', function() {
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