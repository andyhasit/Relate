
fdescribe('Model', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  
  var db, model, Collection, $rootScope, projectCollection, taskCollection, collection, task1,
    task2, task3, task4, project1, project2;
  
  beforeEach(inject(function(_Collection_, QueuedResponseDb, _Model_, _$rootScope_, _db_, $q) {
    $rootScope = _$rootScope_;
    db = _db_;
    model = new _Model_(db);
    spyOn(db, 'allDocs').and.returnValue($q.when({rows:[
      {
        id: 'p001',
        doc: {_id:'p001', _rev: '1-123', type: 'project', name: 'project1'}
      },
      {
        id: 'p002',
        doc: {_id:'p002', _rev: '1-123', type: 'project', name: 'project2'}
      },
      {
        id: 't001',
        doc: {_id:'t001', _rev: '1-123', type: 'task', name: 'task1'}
      },
      {
        id: 't002',
        doc: {_id:'t002', _rev: '1-123', type: 'task', name: 'task2'}
      }
    ]}));
  }));
  
  it('adds collections as expected', function() {
    model.addCollection('project', DummyFactory);
    model.addCollection('task', DummyFactory);
    model.ready();
    $rootScope.$apply();
    expect(model.findTasks().length).toEqual(2);
    model.printInfo();
    });
  
});