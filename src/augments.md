
This is the augment command. It adds properties and methods to the input
object. If the input object is a string or number, it is converted into an
object first and then augmented. 

    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var c = doc.colon.v;
        var augs = doc.plugins.augment;

        gcd.flatWhen("augment setup:" + name, "text ready:" + name);
            
        args.forEach(function (el, ind) {
            if (augs.hasOwnProperty(el) ) {
               input = doc.augment(input, el);
            } else {
                gcd.when("augment defined:" + el, "define extension:" + name);
                gcd.when("augment:" + name + c + ind , "text ready:" +
                    name).silence();
                gcd.once("define extension:" + name, function () {
                    input = doc.augment(input, el); 
                    gcd.emit("augment:" + name + c + ind);
                });
            }
        });
        
        gcd.emit("augment setup:" + name, input);


    }

## Doc augment

This is a direct function that augments objects; not a command, but on
doc, folder prototypes. This creates a function, stored in augments, that
allows its properties to be copied onto the next one.

We also want to leave a record of this so that when creating a new object, the
augments continue, if reasonable. So we create an array of key, value pushed
in order of augmentation. 

When transferring augmentation from old to new, we use the stashed augment
object to create it fresh. 

We use an ife to encapsulate the shared functions as closures. 

Beaware that strip and keys requires the object to be passed in. 

    (function () {
        var replicate = _":replicate";
        var strip = _":strip";
        var keys = _":keys";
        return _":actual";
    })()

[actual]() 

    function (obj, type) {
        if (typeof type !== "string") {
            //error
            this.log("error in augment type");
            return obj;
        }
        
        if (type === "arr") {
            if ( ! Array.isArray(obj) ) {
                obj = [obj];
            }
        }
        
        var plug = this.plugins.augment;
        
        var selfaug = obj._augments = [];
        selfaug.self = replicate;
        selfaug.strip = strip;
        selfaug.keys = keys;
        
        selfaug.type = type;
        selfaug.plug = plug;
        var props = selfaug.props =  plug[type];

        


        Object.keys(props).forEach( function (el) {
            obj[el] = props[el];
            selfaug.push([el, props[el]]);
        });
        return obj;
    }
        
[replicate]()

This is called on an augments object and is intended to replicate or augment
in a different fashion. This is called from the `_augments` as this from the
old one. 

    function (obj, type) {
        var oldaug = this;
        if (type === "arr") {
            if ( ! Array.isArray(obj) ) {
                obj = [obj];
            }
        }

        var selfaug = obj._augments = [];
        type = selfaug.type = type || oldaug.type;

        selfaug.self = replicate;
        selfaug.strip = strip;
        selfaug.keys = keys;
        
        selfaug.plug = oldaug.plug;
        var props = selfaug.props =  oldaug.plug[type];

        Object.keys(props).forEach( function (el) {
            obj[el] = props[el];
            selfaug.push([el, props[el]]);
        });

        return obj;

    }

[keys]() 

This returns the object's keys without the augment properties. Hack of
homemade prototypey thingy. 

    function (obj) {
        var keys = Object.keys(obj);
        var augkeys = obj._augments.map( function (el) {
            return el[0];
        });
        augkeys.push("_augments");
        return keys.filter(function (el) {
            return  (augkeys.indexOf(el) === -1);
        });
    }

[strip]()

This removes the augmented properties. 

    function (obj) {
        obj._augments.map( function (el) {
            delete obj[el[0]];
        });
        delete obj._augments;
    }
    

## Folder prototype
   
    Folder.prototype.augment = _"doc augment"; 
    Folder.prototype.cmdworker = _"command worker"; 
    Folder.plugins.augment = {
        arr : _"arrays::",
        minidoc : _"minidoc::methods",
        mat : _"matrix::methods"
    };


### Command worker

This deals with invoking a command in something like .apply or .mapc. 

    function (cmd, input, args, ename) {
        var doc = this;
        var gcd = doc.gcd;
        var f;

        if ( (cmd[0] === ".") && (cmd.length > 1) )  {
            cmd = cmd.slice(1);
            args.unshift(cmd);
            doc.commands["."].call(doc, input, args, ename, ".");
        } else if ( typeof (f = doc.commands[cmd] ) === "function" ) {
            doc.commands[cmd].call(doc, input, args, ename, cmd );
        } else {
            gcd.once("command defined:" + cmd, function () {
                doc.commands[cmd].call(doc, input, args, ename, cmd );
            });
        }
    }







