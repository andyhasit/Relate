#Notes on Code and Style

###What this is about

Coding involves a lot of:

  - Copy, paste, modify operations
  - Moving functions or chunks thereof to different places
  - Renaming things
  - Running tests
  - Tests failing due to textual issues (you forgot to rename/replace)
  
The way people typically write Javascript, as well some features of the language itself, can make the above process more painful than it is in other languages.

####Examples:

Moving functions from one object to another:

    MyFirstObject.prototype.listItems = function () {
      return dataLayer.getItem(id);
    }

Moving a bunch of those elsewhere means you have to rename MyFirstObject to MySecondObject. You don't have to do that in other languages.

Changing strategy:

    MyFirstObject.prototype.listItems = function () {
      var self = this;
      var item = dataLayer.getItem(id).then(function(item) {
         
      });      
    }


This describes a number of tweaks you can make to how you write

##Conventions used in factory providers:


####1. Save the prototype and constructor as local variables

Change this:

    app.factory('MyBigLongFactoryName', function() {
      var MyBigLongFactoryName = function (name) {
        this.name = name;
      };
      
      MyBigLongFactoryName.prototype.getFoo = function() {
        //do stuff
      };
      
      MyBigLongFactoryName.prototype.getBar = function() {
        //do stuff
      };
      
      return MyBigLongFactoryName;
    });
    
To this:

 
    app.factory('MyBigLongFactoryName', function() {
      var Class = function (name) {
        this.name = name;
      };
      var def = Class.prototype;
      
      def.getFoo = function() {
        //do stuff
      };
      
      def.getBar = function() {
        //do stuff
      };
      
      return Class;
    });
    
Class and def are local variables within the factory function, so you can use the same in all your factories (you do __'use strict'__ right?)

All this does is reduce the amount of retyping you need to do when:

  - Using existing code to create new factories / functions
  - Moving functions out to other factories
  - Renaming factories
 
It doesn't sound like much, but in a crazy refactoring spree it actually makes a big difference.

I also find it makes the code more readable.



aaaa

    app.factory('MyBigLongFactoryName', function() {
      var MyBigLongFactoryName = function (name) {
        this.name = name;
      };
      var def = MyBigLongFactoryName.prototype;
      
      def.getFoo = function() {
        //do stuff
      };
      
      def.getBar = function() {
        //do stuff
      };
      
      return MyBigLongFactoryName;
    });
    
Use class
    
This makes it more readable, but most of all it makes moving or copying functions to other factories becomes so much easier.

FAQ: But I like seeing what object/prototype/factory I'm definining my functions on!  
They are all in their own the factory definition, and most likely in their own file too.

####2. Save the constructor function as local variable __*Class*__


    module.factory('Person', function() {
      var Class = function (name) {
        this.name = name;
      };
      return Class;
    });
     
    module.factory('Widget', function() {
      var Class = function (name) {
        this.name = name;
      };
      return Class;
    });
     
Naming the constructor function __Class__ inside every factory definition just saves a lot of retyping when creating new factories by copying existing code, or when renaming the factory.

FAQ: But I use find and replace!  
That's great, but it can go wrong. With this you just have one bit of text to change.



####3. Assign __this__ to __self__ on every factory function definition

    
    def.speak = function (sentence)    {var self = this;
      return self.name + ' says ' + sentence;
    };
    
    
This means you can stop using a combination of __this__ and __self__, which is a common source of errors, and extra test editing when refactoring.


Putting it on the same line as the function declaration:

  - Tucks it out of the way so it doen't look part of the function definition.
  - Makes it easy to change in the future, e.g. adopting a JS Class framework.


I like to leave 4 spaces before the __{__ which makes it easier to see the function parameters.

I also search all my files to remove any references to __this__ that sneak in.

FAQ: But I don't always need it, and it looks silly having it there.  
Functions switch from needing it to not needing it faster than a disco strobe light, and avoiding the upheaval this causes is more than worth the inconvenience. 

If it really bothers you, use a pre-processor to add it in during the compile stage.

     
####4. Use **\__underscores** for private properties and functions

    ...
      def.sayHello = function ()    {var self = this;
        ...
      };
      
      def.__rebuildState = function ()    {var self = this;
        ...
      };
    ...
 This just helps make it clear what is public and what is private.
 
####5. Put private functions in a parent class

    module.factory('WidgetInternalFunctions', function() {
      var Class = function () {};
      var def = Class.prototype;
      
      def.__rebuildState = function ()    {var self = this;
        ...
      };
      
      return Class;
    });
     
    module.factory('Widget', function(WidgetInternalFunctions) {
      var Class = function (name) {
        this.name = name;
      };
      Class.prototype = new WidgetInternalFunctions();
      var def = Class.prototype;
      
      def.sayHello = function () {var self = this;
        self.__rebuildState();
        return self.name + " says hello";
      };
      
      return Class;
    });
    
Move all the private or internal functions out to a functions factory.

This makes the actual Widget factory smaller to look at, meaning you get a quick overview of what it does and what it's public interface it.



####6. Copy prototype functions rather than inheriting

Create a function __copyPrototype()__ like so (I put it in a utility service):

    util.inheritPrototype = function(Child, Parent) {
      var childProto = Child.prototype;
      var parentProto = Parent.prototype;
      for (var prop in parentProto) {
        if (typeof parentProto[prop] == "function") {
          childProto[prop] = parentProto[prop];
        }
      }
    };
    
And use it instead of explicitly setting the prototype:

    module.factory('Widget', function(util, WidgetInternalFunctions, ActiveRecordFunctions) {
    
      var Class = function (name) {var self = this;
        self.name = name;
      };
      
      //Class.protytope = new WidgetInternalFunctions() XXX don't need this anymore
      
      util.inheritPrototype(Class, ActiveRecordFunctions); 
      util.inheritPrototype(Class, WidgetInternalFunctions);
      var def = Class.prototype;
      
      def.sayHello = function () {var self = this;
        ...
      };
      
      return Class;
    });

This is not strictly speaking OOP inheritance. We are merely importing functions from the prototypes that have the functions we want. In that way it is more like a mixin.

#####Advantages: 

  - You can import from as many prototypes as you want, which is preferable to having an inheritance chain.
  - The code intention is clear.
  - You can still override the functions.

###7. keep functions small

Try to keep the functions small, sourcing out as much as possible to other functions.

Combining this with points 5 and 6 will allow you to write more concise and understandable code in the more public facing functions and make the knitty gritty parts reusable to other factories, controllers and services.