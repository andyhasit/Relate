
var c = console,
    app = angular.module('app', ['Relate']);

app.run(function(model) {
  c.log(model);
  //var db = new PouchDB('relate-demo');
  var db = new PouchDB('http://localhost:5984/kittens');
  
  model.initialize(db);
  
  model.defineCollection('cat', ['name', 'colour']);
  model.defineCollection('person', ['name', 'age'], {plural:'people'});
  model.defineRelationship({
    type:'parentChild',
    parent:'person', 
    child:'cat',
    parentAlias: 'owner'
  });
  
});

app.controller('Ctrl', function($scope, model) {
  model.dataReady().then(function() {
    model.printInfo();
    $scope.cats = model.allCats;
    $scope.people = model.allPeople;
    $scope.getPersonCats = model.getPersonCats;
  });
  
  $scope.newPerson = function() {
    model.newPerson({name: $scope.newPersonName});
  };
  
  $scope.newCat = function() {
    model.newCat({name: $scope.newCatName});
  };
  
  $scope.linkCatToPerson = function() {
    model.setCatOwner($scope.linkCat, $scope.linkPerson);
  };
  
  $scope.unlinkCatFromPerson = function(cat) {
    model.setCatOwner(cat, null);
  };
    
  $scope.createData = function() {
    model.newCat({name: 'Mog', colour: 'tabby'});
    model.newCat({name: 'Owl', colour: 'striped'});
    model.newCat({name: 'Mille', colour: 'white'});
    model.newCat({name: 'Jafar', colour: 'burmese'});
  };
  
});