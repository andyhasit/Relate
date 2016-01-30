#Notes on Code and Style

Conventions used in factory providers:

####1. Name the constructor function to variable __*Class*__


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
     
This just saves a lot of editing when renaming factories and creating new ones by copying from existing code.

Find and replace falls apart if __*Person*__ appears elsewhere.


###2. Save the prototype to variable __*def*__

    ...
      var Class = function (name) {
        this.name = name;
      };
      var def = Class.prototype;
        
      def.sayHello = function() {
        return 'hello';
      };
    ...
    
     
This makes moving and copying function code between between factories so much easier.

You may also find it more readable.

###3. Assign __this__ to __self__ on every function definition

    ...
      def.speak = function (sentence)    {var self = this;
        return self.name + ' says ' + sentence;
      };
    ...
    

Assigning __this__ to __self__ inside every function on the prototype means you no longer have to switch between the two, from now on always use __self__. This will save a lot of headaches.

Putting it on the same line as the function declaration:

  - Tucks it out of the way (still ugly, but better than alternatives)
  - Makes it easy to change in the future, e.g. adopting a JS Class framework.

I like to leave 4 spaces before the __{__ which makes it easier to see the function parameters.
     
###4. Use **\__underscores** for private properties and functions

    ...
      def.sayHello = function ()    {var self = this;
        ...
      };
      
      def.__rebuildState = function ()    {var self = this;
        ...
      };
    ...
 This just helps make it clear what is public and what is private.
 
###5. Put private functions in a parent class

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
    
###6. Create a __copyPrototype()__ function to pull in functions from other factories

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
      util.inheritPrototype(Class, ActiveRecordFunctions); 
      util.inheritPrototype(Class, WidgetInternalFunctions);
      var def = Class.prototype;
      
      def.sayHello = function () {var self = this;
        ...
      };
      
      return Class;
    });

This is not strictly speaking OOP inheritance. We are merely importing functions from the prototypes that have the functions we want. In that way it is more like a mixin.

Advantages: 

  - You can import from as many prototypes as you want, which is preferable to having an inheritance chain.
  - The code intention is clear.
  - You can still override the functions.
