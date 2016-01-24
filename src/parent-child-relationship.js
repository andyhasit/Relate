
angular.module('Relate').factory('ParentChildRelationship', function($q) {
  /*
  All data is stored in collections. Add, delete and save are done via the collection.
  */
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  var ParentChildRelationship = function(db, parentCollection, childCollection, options) {
    this._db = db;
    this.items = [];
    
    //Can be changed in options. Implement later.
    this.collectionName = name + 's';
    
    parentChildFunctionName = 'get' + capitalize(parentCollection.name) + pluralCapitalised(childCollection.name);
      //e.g. getProjectTasks
      self[parentChildFunctionName] = function(parentObject) {
        var childIds = [];
        self.items.findAll(
         
      };
  
    // e.g. lnk_child_tasks_of_project, lnk_parent_project_of_task
    this.childParentTypeIdentifier = 'lnk_' + 
    this.parentChildrenTypeIdentifier =
  };
  
  return ParentChildRelationship;
});