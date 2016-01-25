describe('TestBackEnd', function() {
  
  var BackEnd, Initialiser, collections;
  var model = [
    'bucket:log',
    'bucket:task',
    'day:log',
    'day:task',
    'task:scoreField'
  ];
  var userName = 'andyhasit',
    basePath = 'https://glowing-torch-7948.firebaseio.com/',
    userDataSuffix = 'my_app_data/',
    startPath = basePath + userDataSuffix + userName + '/';
    
  beforeEach(module('relate'));
  
  beforeEach(inject(function(_BackEnd_, _Initialiser_, _collections_) {
    BackEnd = _BackEnd_;
    Initialiser = _Initialiser_;
    collections = _collections_;
  }));

  it('is alive', function() {
    var ref = BackEnd.getReference('tasks');
    console.log(ref);
  });
  
  it('works', function() {
    Initialiser.initialise(startPath, model).then( function() {
      collections.tasks.add({title: 'myFirstTask'}, {});
    });
    /*
    util.removeIf(collection, function(item) {
      return (item.name === 'bob')
    });
    expect(collection.length).toEqual(1);
    expect(collection[0].id).toEqual(46);
    */
  });
  
  /*
  it('addRecords', function() {
    var collection = [
      {id: 21, name:'bob'},
      {id: 46, name:'bob'},
      {id: 86, name:'bob'},
    ];
    var newRecords = [
      {id: 46, name:'bob'},
      {id: 48, name:'sam'},
    ];
    util.addRecords(collection, newRecords)
    expect(collection.length).toEqual(4);
    expect(collection[2].id).toEqual(86);
    expect(collection[3].id).toEqual(48);
  });
  
  it('findFirst', function() {
    var collection = [
      {id: 21, name:'bob'},
      {id: 46, name:'bob'},
      {id: 86, name:'bob'},
    ];
    
    item1 = util.findFirst(collection, function(item) {
      return (item.id===46)
    });
    expect(item1).toEqual({id: 46, name:'bob'});
    item1 = util.findFirst(collection, function(item) {
      return (item.id===49)
    });
    expect(item1).toEqual(null);
  });
  
  
  it('removeIf', function() {
    var collection = [
      {id: 21, name:'bob'},
      {id: 46, name:'tom'},
      {id: 86, name:'bob'},
    ];
   
    util.removeIf(collection, function(item) {
      return (item.name === 'bob')
    });
    expect(collection.length).toEqual(1);
    expect(collection[0].id).toEqual(46);
  });
  */
  


});
