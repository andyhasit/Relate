
describe('deleting', function() {

  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));

  beforeEach(inject(function( _model_, _$rootScope_, FakeDb, $q) {
    $rootScope = _$rootScope_;
    var db = new FakeDb();
    model = _model_;
    model.initialize(db);
  }));

  fit('can set and change parent with one to many', function() {

    projectCollection = model.collection('project', ['name']);
    taskCollection = model.collection('task', ['name']);
    taskProjectJoin = model.join('project', 'task', {cascadeDelete: false}); // in other words: {cascadeDelete: true}
    model.dataReady();
    flush();

    project1 = newItem('project');
    project2 = newItem('project');
    task1 = newItem('task');
    task2 = newItem('task');
    model.setTaskProject(task1, project2);
    model.setTaskProject(task2, project2);
    flush();
    expect(model.getProjectTasks(project2)).toEqual([task1, task2]);
    expect(model.getProjectTasks(project2)).toEqual([task1, task2]);
    expect(model.allTasks()).toEqual([task1, task2]);
    /*
    model.deleteItem(project1);
    flush();
    expect(model.allProjects()).toEqual([project2]);
    expect(model.allTasks()).toEqual([task1, task2]);
    */
    model.deleteItem(project2);
    flush();
    expect(model.allTasks()).toEqual([]);

  });

});
/*

tagProjectJoin = model.join('project', 'tag', {type: 'manyToMany'});

    tagCollection = model.collection('tag', ['name']);

*/
