
angular.module('relate').service('BackEnd', function($q, Firebase, $firebaseArray) {
  var self = this, __startPath, __rootRef;
  
  self.getReference = function (name) {
    var ref = new Firebase(__startPath + '/' + name);
    return ref;
  };
  
  self.initialise = function (startPath){
    __startPath = startPath;
    __rootRef = new Firebase(__startPath);
  };
  
  self.atomicUpdate = function (updateData) {
    /*
    updateData = {
      tasks__bucket : {
        taskKey : bucketKey,
      }
    }
    */
    c.log(updateData);
    var promises = [], path, ref;
    for (var path in updateData) {
      if (updateData.hasOwnProperty(path)) {
        obj = $firebaseObject(new Firebase(path));
        //value = updateData[path];
        c.log(__rootRef.child(path));
        d = __rootRef.child(path).update(updateData[path]);
        c.log(d);
        promises.push(d);
      }
    }
    //return __rootRef.update(updateData);
    $q.all(promises).then( function () {
      defer.resolve();
    });
    return defer.promise;
  };
  
});