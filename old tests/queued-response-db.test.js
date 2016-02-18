
describe('QueuedResponseDb', function() {
  
  FakeDb = function() {
    this.promises = [];
    this.put = function(data) {
      var defer = $q.defer();
      this.promises.push(defer);
      return defer.promise;
    }
    this.resolve = function(index, data) {
      this.promises[index].resolve(data);
    }
  }
  
  var $q, $rootScope, db, QueuedResponseDb;
  beforeEach(module('Relate'));
  beforeEach(module('PouchFake'));
  beforeEach(inject(function(_$rootScope_, _QueuedResponseDb_, _$q_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    QueuedResponseDb = _QueuedResponseDb_;
    db = new FakeDb();
  }));
  
  it('test helper FakeDb returns promises in exact order specified', function() {
    var returnedData = [];
    angular.forEach(['cat', 'dog', 'bird', 'cow'], function(animal) {
      db.put(animal).then( function(result) {
        returnedData.push(animal + ' '+ result);
      });
    });
    db.resolve(2, 'chirps');
    db.resolve(1, 'barks');
    db.resolve(3, 'moos');
    db.resolve(0, 'meaows');
    $rootScope.$apply();
    
    expect(returnedData[0]).toEqual('bird chirps');
    expect(returnedData[1]).toEqual('dog barks');
    expect(returnedData[2]).toEqual('cow moos');
    expect(returnedData[3]).toEqual('cat meaows');
  });
  
  it('resolves promises in order they were called even though underlying promises resolved in different order', function() {
    var qrd = new QueuedResponseDb(db);
    var returnedData = [];
    angular.forEach(['cat', 'dog', 'bird', 'cow'], function(animal) {
      qrd.put(animal).then( function(result) {
        returnedData.push(animal + ' '+ result);
      });
    });
    db.resolve(2, 'chirps');
    db.resolve(1, 'barks');
    db.resolve(3, 'moos');
    db.resolve(0, 'meaows');
    $rootScope.$apply();
    
    expect(returnedData[0]).toEqual('cat meaows');
    expect(returnedData[1]).toEqual('dog barks');
    expect(returnedData[2]).toEqual('bird chirps');
    expect(returnedData[3]).toEqual('cow moos');
  });
  
});
  