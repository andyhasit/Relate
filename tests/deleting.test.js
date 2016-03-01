
describe('deleting', function() {

  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));

  beforeEach(inject(function( _model_, _$rootScope_, FakeDb, $q) {
    $rootScope = _$rootScope_;
    var db = new FakeDb();
    //var db = new PouchDB('http://localhost:5984/test_karma');
    model = _model_;
    model.initialize(db);
  }));

  it('can delete normal items', function() {
    projectCollection = model.collection('project', ['name']);
    model.dataReady();
    flush();
    project1 = newItem('project');
    project2 = newItem('project');
    project3 = newItem('project');
    flush();
    expect(model.allProjects()).toEqual([project1, project2, project3]);
    deferred1 = model.deleteItem(project1);
    c.log(deferred1);
    deferred2 = model.deleteItem(project3);
    c.log(deferred2);
    deferred3 = model.saveItem(project2);
    flush();
    c.log(deferred3);
    expect(model.allProjects()).toEqual([project2]);

  });

  it('can set and change parent with one to many', function() {

    projectCollection = model.collection('project', ['name']);
    taskCollection = model.collection('task', ['name']);
    taskProjectJoin = model.join('project', 'task', {cascadeDelete: true}); // in other words: {cascadeDelete: true} //TODO: test default sticks
    model.dataReady();
    flush();

    project1 = newItem('project');
    project2 = newItem('project');
    task1 = newItem('task');
    task2 = newItem('task');
    task3 = newItem('task');
    //task4 = newItem('task');
    //task5 = newItem('task');
    //task6 = newItem('task');
    model.setTaskProject(task1, project2);
    model.setTaskProject(task2, project2);
    model.setTaskProject(task3, project2);
    //model.setTaskProject(task4, project2);
    //model.setTaskProject(task5, project2);
    //model.setTaskProject(task6, project2);
    flush();
    $rootScope.$apply();
    expect(model.getProjectTasks(project2)).toEqual([task1, task2, task3]);
    expect(model.allTasks()).toEqual([task1, task2, task3]);

    model.deleteItem(project1);
    flush();
    expect(model.allProjects()).toEqual([project2]);
    expect(model.allTasks()).toEqual([task1, task2, task3]);
    model.deleteItem(project2);

    flush();
    expect(model.allTasks()).toEqual([]);

  });

});
/*

tagProjectJoin = model.join('project', 'tag', {type: 'manyToMany'});

    tagCollection = model.collection('tag', ['name']);

*/
