
describe('Flexible naming', function() {
  
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  var db, model, $rootScope;
  
  beforeEach(inject(function( _model_, _$rootScope_, FakeDb, $q) {
    $rootScope = _$rootScope_;
    var db = new FakeDb();
    model = _model_;
    model.initialize(db);
  }));
  
  function ready() {
    model.dataReady();
    $rootScope.$apply();
  }
  
  it('two collections and a relationship', function() {
    model.collection('project', ['name']);
    model.collection('task', ['name']);
    model.join({
      type:'parentChild',
      parent:'project', 
      child:'task'
    });
    ready();
    
    expect(typeof model.newTask).toEqual('function');
    expect(typeof model.findTasks).toEqual('function');
    expect(typeof model.saveTask).toEqual('function');
    expect(typeof model.deleteTask).toEqual('function');
    expect(typeof model.getTaskProject).toEqual('function');
    expect(typeof model.getProjectTasks).toEqual('function');
  });
  
  it('two collections with plural name', function() {
    model.collection('project', ['name']);
    model.collection('person', ['name'], {plural: 'people'});
    model.join({
      type:'parentChild',
      parent:'project', 
      child:'person'
    });
    ready();
    
    expect(typeof model.newPerson).toEqual('function');
    expect(typeof model.getPerson).toEqual('function');
    expect(typeof model.deletePerson).toEqual('function');
    expect(typeof model.findPeople).toEqual('function');
    expect(typeof model.getPersonProject).toEqual('function');
    expect(typeof model.getProjectPeople).toEqual('function');
  });
  
  it('colletions with multiple parents different type', function() {
    model.collection('project', ['name']);
    model.collection('task', ['name']);
    model.collection('calendarDay', ['date']);
    model.join({
      type:'parentChild',
      parent:'project', 
      child:'task'
    });
    model.join({
      type:'parentChild',
      parent:'calendarDay', 
      child:'task'
    });
    ready();
    
    expect(typeof model.newTask).toEqual('function');
    expect(typeof model.newCalendarDay).toEqual('function');
    expect(typeof model.getTaskProject).toEqual('function');
    expect(typeof model.getTaskCalendarDay).toEqual('function');
    expect(typeof model.getProjectTasks).toEqual('function');
    expect(typeof model.getCalendarDayTasks).toEqual('function');
  });
  
  it('relationship with parent alias', function() {
    model.collection('task', ['name']);
    model.collection('calendarDay', ['date']);
    model.join({
      type: 'parentChild',
      parent: 'calendarDay', 
      child: 'task',
      parentAlias: 'plannedDate'
    });
    ready();
    expect(typeof model.newTask).toEqual('function');
    expect(typeof model.newCalendarDay).toEqual('function');
    expect(typeof model.getTaskPlannedDate).toEqual('function');
    expect(typeof model.setTaskPlannedDate).toEqual('function');
    expect(typeof model.getCalendarDayTasks).toEqual('function');
  });
  
  it('relationship with child alias', function() {
    model.collection('task', ['name']);
    model.collection('calendarDay', ['date']);
    model.join({
      type: 'parentChild',
      parent: 'calendarDay', 
      child: 'task',
      childAlias: 'plannedTasks'
    });
    ready();
    expect(typeof model.newTask).toEqual('function');
    expect(typeof model.newCalendarDay).toEqual('function');
    expect(typeof model.setTaskCalendarDay).toEqual('function');
    expect(typeof model.getCalendarDayPlannedTasks).toEqual('function');
  });
  
  it('colletions with multiple parents same type to fail without aliases', function() {
    model.collection('task', ['name']);
    model.collection('calendarDay', ['date']);
    model.join({
      type:'parentChild',
      parent:'calendarDay', 
      child:'task'
    });
    function joinWithClash (){
      model.join({
        type:'parentChild',
        parent:'calendarDay', 
        child:'task'
      });
    }        
    expect(joinWithClash).toThrow(
     'More than one collection/relationship attempting to register dbDocumentType: "lnk_parent_calendarDay_of_task".'
    );
  });
   
  it('colletions with multiple parents same type succeeds using aliases', function() {
    model.collection('task', ['name']);
    model.collection('calendarDay', ['date']);
    model.join({
      type: 'parentChild',
      parent: 'calendarDay', 
      child: 'task',
      childAlias: 'actualTasks', 
      parentAlias: 'ActualDate'
    });
    model.join({
      type: 'parentChild',
      parent: 'calendarDay',
      child: 'task',
      childAlias: 'plannedTasks',
      parentAlias: 'plannedDate',
    });
    ready();
    expect(typeof model.newTask).toEqual('function');
    expect(typeof model.newCalendarDay).toEqual('function');
    expect(typeof model.getTaskActualDate).toEqual('function');
    expect(typeof model.getTaskPlannedDate).toEqual('function');
    expect(typeof model.getCalendarDayPlannedTasks).toEqual('function');
    expect(typeof model.getCalendarDayActualTasks).toEqual('function');
  });
   
});