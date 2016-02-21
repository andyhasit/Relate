
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
  
  
  it('setting new parent', function() {
    project1 = newItem('project');
    project2 = newItem('project');
    task1 = newItem('task');
    task2 = newItem('task');
    
    expect(model.getProjectTasks(project1)).toEqual([]);
    expect(model.getTaskProject(task1)).toEqual(null);
    
    model.setTaskProject(task1, project2);
    model.setTaskProject(task2, project2);
    flush();
    
    expect(model.getProjectTasks(project2)).toEqual([task1, task2]);
    
  });
  
 
});

/*

  
  it('sets up one to many relationships correctly', function() {
    expect(model.getProjectTasks(project1)).toEqual([task2, task3]);
    expect(model.getProjectTasks(project2)).toEqual([task4]);
    expect(model.getProjectTasks(project3)).toEqual([]);
    expect(model.getTaskProject(task1)).toEqual(null);
    expect(model.getTaskProject(task2)).toEqual(project1);
    expect(model.getTaskProject(task3)).toEqual(project1);
    expect(model.getTaskProject(task4)).toEqual(project2);
  }); 
  
  it('sets up many to many relationships correctly', function() {
    expect(model.getProjectTags(project1)).toEqual([tag1, tag2]);
    expect(model.getProjectTags(project2)).toEqual([tag2, tag3]);
    expect(model.getProjectTags(project3)).toEqual([]);
    expect(model.getTagProjects(tag1)).toEqual([project1]);
    expect(model.getTagProjects(tag2)).toEqual([project1, project2]);
    expect(model.getTagProjects(tag3)).toEqual([project2]);
    expect(model.getTagProjects(tag4)).toEqual([]);
  });
  
*/