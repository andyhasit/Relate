#MajorMagic

So you love creating AngularJS apps with CouchDb or PouchDB as a backend, but wish you could just define your data like this:
          
    model.defineCollection('person', ['name', 'age']);
    model.defineCollection('pet', ['name', 'complete']);
    model.defineRelationship(
      {type: 'parentChild', parent: 'person', child: 'pet'}
    );
    
And magically end up with functions like this:

    model.newPet()
    model.savePerson()
    model.findPersons()
    model.getPersonPets()  // returns [pet1, pet2,...]
    model.deletePerson()   // deletes all their pets too!

And that these functions would:

   1. Persist changes to CouchDB/PouchDB without you having to write any API code or http calls.
   2. Take care of structuring the database (in a way that it easily usable by other applications, and keeps the database size down to a bare minimum).
   2. Be configurable so that __deletePerson()__ doesn't cascade on delete, or so that __getPetPerson()__ shows up as __getPetOwner()__ instead.
   3. Still run lightning fast on an app with 1000s of objects in 30 different collections with over a dozen joins.
  
--
Well wish no more. MajorMagic is here!
 
##What's special about MajorMagic?

It lets you develop certain types of apps much faster, because:

  1. You don't have to worry about the backend, just point and shoot.
  2. Working with functions named after your data types (and that all live on the same object) makes for a very fluid dev experience.
  3. You get to work with a pseudo-relational model with prewritten queries that runs so damn fast you can load the whole schema in memory.

--
What the f...?

Yes, I thought you might say that.

I call it pseudo-relational model because items are all stored in collections of same type (as opposed to nested trees, or all together) but doesn't use foreign keys to model relationships.

  * Easier to find things
  * Track where things are

The problem with the relational model is that it's really slow.

##How does it do this?

It uses hashes to track the relationships bi-directionally. One hash for a parent's children, and one for child's parent object. With this strategy it's important that every operations which can affect the state goes through the same channel, and that these operations complete synchronously.
That obviously clashes with the asynchronous model of most things javascript nowadays, inluding db calls.
The deal is that all accessor calls which change data are wrapped in a promise queue system, where on promise doesn't fire until the previous one is resolved.

##Important note about queries

Accessor functions that modify data (anything other than get or find) implement the promise interface using $q.
Accessor that don't modify data (get and find) return straight away, which makes databinding nicer.
But here is the catch: although the api calls are fired off asynchronously, and do not block any other javascript or DOM updates from executing MajorMagic blocks any calls to it while a promise is pending.


 although asynchronous, procedure calls block MajorMagic


in order to provide the super fast querying on relationships, MajorMagic stores a lot of state.




##Installation


##Usage


##Under the hood




MajorMagic is 



##### What you do:

  1. Create an instance of __MajorMagicModel__, passing a PouchDb instance or similar.
  2. Define collections (name, fields, optional constructor function)
  3. Define relationships between those (parentChild, manyToMany etc...)
  4. Start playing! 

For example:

    var db = new PouchDB('dbname');  //Can use any wrapper with same interface
    var model = new MajorMagicModel(db);
          
    model.addCollection('project', ['name']);
    model.addCollection('task', ['description', 'complete']);
          
    model.addRelationship({
      type: 'parentChild',
      parent: 'project', 
      child: 'task'
    });
    
There are more options you can use for each of the above, but this is all you need for the default behaviour.
  
##### What MajorMagic does:

  1. Loads the documents from your db (all or selectively) to memory.
  2. Maintains two way mapping for all relatioships (which is why it is super fast).
  3. Adds functions to your model named as per your collections.
  4. Persists changes to the database (taking care of the structuring so you don't have to).

For example:

    model.dataReady().then(function() {

      // 'model' now has your data loaded, and functions named after your collections:

      model.newProject(data)
      model.newTask(data)
      model.deleteTask(task)
      model.findTasks(query)
      model.getProjectTasks(project)
      model.setTaskProject(project, task)
      
      // These functions persist changes to the database, and handle relationships:
      
      // Would create a link between project1 and the new task.
      project1 = model.getProject(id);
      model.newTask({
        description: 'Eat cake',
        project: project1
      });
      
      // Would delete all child tasks (default behaviour, can be disabled)
      model.deleteProject(project1);
      
    });
  
### What else is special?

MajorMagic has a number of other features:

#####1. Super fast querying once data is loaded

MajorMagic caches the relationships bi-directionally (i.e. the children of every parent object, and the parent of every child) meaning that if your model has many joins

#####2. Flexible relationships

You pass it:

  - A database object (any object which implements put, post, get, remove using the same signature as PouchDB)
  - An initial load query
 
Then specify collections

    var db = new PouchDB('dbname');  //Can use any object put, post, get, remove
    var model = new MajorMagicModel(db);
          
    model.addCollection('project', ['name']);
    model.addCollection('task', ['description', 'complete']);
          
    model.addRelationship({
      type: 'parentChild',
      parent: 'project', 
      child: 'task'
    });
    
    ...
    
    project1 = model.newProject({name: 'My website'});
    //flush
    model.newTask({
      description: 'sort domain',
      description: false,
      project: project1
      });
    project.childTasks()  // [Task{}]
      model.newProject({name: 'My website'}).then( function(result){
        var newProject = result;
        newProject.addTask
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
    

      model.getProjectTasks(project1) == [
        {description: 'Eat cake', _id: '67198', _rev: '1-67198'}
        ]
      model.getTaskProject(task1) == 

MajorMagic




What I've found is that this is far more intuitive to work with than raw SQL


The truth is that while noSQL is easier to work with

So let's take a step back, and look at the problem. When the data get complex, it needs to be structured. Unless it's hierarchical, the cleanest way to to this is with the relational model.
The problem with the relational model is that it's slow. Sure, you can get your initial data payload out of it easy enough, but iterating over joins at every turn is just a no go in the running application.

It's far easier to keep track of where things are when everything is in a top level collection compared to a chunk of json nested 7 levels deep.



required inside a running aplication gets quite complex


  5. 
  6. which is both simpler to design and easier to work with than a complex noSQL model, but magically runs just as fast and has 90% of queries pre-written for you.



compare the relational model to noSQL/Json.




#####Design
The relational model is quite intuitive to design and work with, even non-devs can put together a decent schema. On the other hand, a lot of developers struggle to make decisions on noSQL, and the answer is usually "it depends how you'll be querying the data".

#####Performance

Denormalising data speeds things up but introduces the risk of mistakes.




Aside from providing handily named functions for you to work with


##Internals


MajorMagic exposes a single object: the model, with which you define your collections, and onto which the **accessor functions** are added.

The model creates Collection and Relationship objects in the background, and the accessor functions are simply wrappers around calls to their functions with names that are easier to work with.

These **accessor functions** are just conveniently named wrappers around calls to the actual new, save, get, find, delete, link and unlink funtions on the corresponding Collection and Relationship objects.

But they are more than plain wrapper functions. In order for the relationships to keep state




Contracts
