
describe('referential integrity', function() {

  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));

  beforeEach(inject(function( _model_, _$rootScope_, FakeDb, $q) {
    $rootScope = _$rootScope_;
    var db = new FakeDb();
    model = _model_;
    model.initialize(db);

    projectCollection = model.collection('project', ['name']);
    taskCollection = model.collection('task', ['name']);
    tagCollection = model.collection('tag', ['name']);
    taskProjectJoin = model.join('project', 'task');
    tagProjectJoin = model.join('project', 'tag', {type: 'manyToMany'});
    model.dataReady();
    flush();

  }));

  it('can set and change parent with one to many', function() {
    project1 = newItem('project');
    project2 = newItem('project');
    task1 = newItem('task');
    task2 = newItem('task');

    expect(model.getTaskProject(task1)).toEqual(null);

    model.setTaskProject(task1, project2);
    model.setTaskProject(task2, project2);
    flush();

    expect(model.getProjectTasks(project1)).toEqual([]);
    expect(model.getProjectTasks(project2)).toEqual([task1, task2]);
    expect(model.getTaskProject(task1)).toEqual(project2);
    expect(model.getTaskProject(task2)).toEqual(project2);

    model.setTaskProject(task2, project1);
    flush();

    expect(model.getProjectTasks(project1)).toEqual([task2]);
    expect(model.getProjectTasks(project2)).toEqual([task1]);
    expect(model.getTaskProject(task1)).toEqual(project2);
    expect(model.getTaskProject(task2)).toEqual(project1);

    model.setTaskProject(task1, null);
    flush();

    expect(model.getProjectTasks(project1)).toEqual([task2]);
    expect(model.getProjectTasks(project2)).toEqual([]);
    expect(model.getTaskProject(task1)).toEqual(null);
    expect(model.getTaskProject(task2)).toEqual(project1);

  });


  it('can set and change parent with one to many', function() {
    project1 = newItem('project');
    project2 = newItem('project');
    task1 = newItem('task');
    task2 = newItem('task');

    expect(model.getTaskProject(task1)).toEqual(null);

    model.setTaskProject(task1, project2);
    model.setTaskProject(task2, project2);
    flush();

  });

  it('can link and unlink many to many', function() {

    project1 = newItem('project');
    project2 = newItem('project');
    tag1 = newItem('tag');
    tag2 = newItem('tag');

    expect(model.getProjectTags(project1)).toEqual([]);
    expect(model.getTagProjects(tag1)).toEqual([]);
    expect(model.isProjectLinkedToTag(project1, tag1)).toEqual(false);

    model.addProjectTag(project1, tag2);
    flush();

    expect(model.isProjectLinkedToTag(project1, tag2)).toEqual(true);
    expect(model.getProjectTags(project1)).toEqual([tag2]);
    expect(model.getTagProjects(tag2)).toEqual([project1]);

    model.addProjectTag(project2, tag2);
    flush();

    expect(model.getProjectTags(project1)).toEqual([tag2]);
    expect(model.getProjectTags(project2)).toEqual([tag2]);
    expect(model.getTagProjects(tag2)).toEqual([project1, project2]);

    // Repeat, nothing should change
    model.addProjectTag(project2, tag2);
    flush();

    expect(model.getProjectTags(project1)).toEqual([tag2]);
    expect(model.getProjectTags(project2)).toEqual([tag2]);
    expect(model.getTagProjects(tag2)).toEqual([project1, project2]);

    //Remove
    model.removeProjectTag(project2, tag2);
    flush();

    expect(model.getProjectTags(project1)).toEqual([tag2]);
    expect(model.getProjectTags(project2)).toEqual([]);
    expect(model.getTagProjects(tag2)).toEqual([project1]);

    //Add back
    model.addProjectTag(project2, tag2);
    flush();

    expect(model.getProjectTags(project1)).toEqual([tag2]);
    expect(model.getProjectTags(project2)).toEqual([tag2]);
    expect(model.getTagProjects(tag2)).toEqual([project1, project2]);

  });

});


