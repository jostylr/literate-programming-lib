
This is the augment command. It adds properties and methods to the input
object. If the input object is a string or number, it is converted into an
object first and then augmented. 

    function (input, args, name, cmdname) {
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
doc, folder prototypes. 

We also want to leave a record of this so that when creating a new object, the
augments continue, if reasonable. So we create an array of key, value pushed
in order of augmentation. 

When transferring augmentation from old to new, we call it as an object from
the array and so we can access its data. We recognize this by the lack of a
type variable.

    function self (obj, type) {

        var selfaug = obj._augments;
        if (!selfaug) {
            selfaug = obj._augments = [];
            selfaug.self = self;
        }

        selfaug.keys = _":keys";
        
        var props; 

        if ( typeof type === "string" ) {

            var augs = this.plugins.augment;
            props = augs[type];

            if (type === "arr") {
                if ( ! Array.isArray(obj) ) {
                    obj = [obj];
                }
            }

            Object.keys(props).forEach( function (el) {
                obj[el] = props[el];
                selfaug.push([el, props[el]]);
            });

        } else {
            props = this;  
            props.forEach(function (el) {
                var key = el[0], val = el[1];
                obj[key]  = val;
                selfaug.push([key, val]);
            });
        }

        return obj;
    }

[keys]() 

This returns the object's keys without the augment properties. Hack of
homemade prototypey thingy. 

    function () {
        var keys = Object.keys(obj);
        var augkeys = obj._augments.map( function (el) {
            return el[0];
        });
        augkeys.push("_augments");
        return keys.filter(function (el) {
            return  (augkeys.indexOf(el) === -1);
        });
    }

## Folder prototype
    
    Folder.prototype.augment = _"doc augment"; 
    Folder.prototype.cmdworker = _"command worker"; 
    Folder.plugins.augment = {
        arr : _"arrays::",
        minidoc : _"minidoc::methods"
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







