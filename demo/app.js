
var c = console,
    app = angular.module('app', ['Relate']);

app.run(function(model) {
  c.log(model);
  //var db = new PouchDB('relate-demo');
  var db = new PouchDB('http://localhost:5984/kittens');
  
  c.log(db);
  model.initialize(db);
  
  model.defineCollection('cat', ['name', 'colour']);
  model.defineCollection('person', ['name', 'age'], {plural:'people'});
  model.defineRelationship({
    type:'parentChild',
    parent:'person', 
    child:'cat'
  });
  
});

app.controller('Ctrl', function($scope, model) {
  model.dataReady().then(function() {
    model.printInfo();
    $scope.cats = model.allCats();
  });
  
  $scope.createData = function() {
    model.newCat({name: 'Mog', colour: 'tabby'});
    model.newCat({name: 'Owl', colour: 'striped'});
    model.newCat({name: 'Mille', colour: 'white'});
    model.newCat({name: 'Jafar', colour: 'burmese'});
  };
  
  
});
/*

app.service('modelddd', function(RelateModel) {
  //var db = new PouchDB('relate-demo');
  var db = new PouchDB('http://localhost:5984/kittens');
  RelateModel.call(this, db);
  this.prototype = Object.create(RelateModel);
  c.log(8888888);
  c.log(db);
  this.defineCollection('cat', ['name', 'colour']);
  this.defineCollection('person', ['name', 'age'], {plural:'people'});
  this.defineRelationship({
    type:'parentChild',
    parent:'person', 
    child:'cat'
  });
  
});

*/