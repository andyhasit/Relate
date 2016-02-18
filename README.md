#Relate

A data collection and relationship manager for CouchDB/PouchDB written in angularJS.

####What it does:

You pass it:

  - A database object (any object which implements put, post, get, remove using the same signature as PouchDB)
  - An initial load query
 
Then specify collections

    app.factory('model', function(RelateModel){
      var db = new PouchDB('dbname');
      var loadQuery = db.allDocs;
      var model = new RelateModel(db);
      model.addCollection('project', ['name', description']);
      model.addCollection('task', ['name', complete']);
      model.addParentChildRelationship('project', 'task');
      return model
    });
    

This will create a model object with methods for finding, creating, deleting, and linking tasks to projects.

    app.controller('EditProjectCtrl', function($stateParams, model){
      $scope.projectId = $stateParams.projectid;
      $scope.saveProjectChanges = function() {
        model.saveProject($scope.project);
      };
      model.ready().then( function() {
        $scope.project = model.getProject(projectid);
        $scope.tasks = model.getProjectTasks(projectid);
      });
    });