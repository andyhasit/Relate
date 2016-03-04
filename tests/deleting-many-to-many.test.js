
describe('linking many to many', function() {

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

  it('can link and unlink many to many', function() {

    project1 = newItem('project');
    project2 = newItem('project');
    tag1 = newItem('tag');
    tag2 = newItem('tag');

    model.addProjectTag(project1, tag2);
    flush();

    expect(model.isProjectLinkedToTag(project1, tag2)).toEqual(true);
    expect(model.getProjectTags(project1)).toEqual([tag2]);
    expect(model.getTagProjects(tag2)).toEqual([project1]);

    //now delete.
    model.deleteItem(project1);
    flush();
    
  });

});


