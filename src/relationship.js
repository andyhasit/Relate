/*
New way:

Specify one relationship per collection.
It knows of the other collection, and how the relationship behaves.

The main data object is responisble for passing complementary relationships to the collections.

Linking:
   collection ends up with methods:
   setParent
   addChild
   removeChild
   addTag
   removeTag
   
   add a data.printInfo() function.
   

*/

angular.module('Relate').factory('ParentRelationship', function($q) {

  var Relationship = function(propertyName, parentCollection, parentPopertyName) {
    this.propertyName = propertyName;
    this._parentCollection = parentCollection;
    this._parentPopertyName = parentPopertyName;
  };
  
  Relationship.prototype._convertFromDoc = function(doc) {
    var value = doc[this.propertyName];
    if (value) {
      this._parentCollection.getItem(value);
    }
  };
  
  Relationship.prototype._convertToDoc = function(value) {
    return value.id;
  };
  
  Relationship.prototype._onItemRemove = function(item) {
    var value = doc[this.propertyName];
    if (value) {
      var parentItem = this._parentCollection.getItem(value);
      if (parentItem) {
        parentItem._links[this._parentPopertyName]
      }
    }
  };
  
});