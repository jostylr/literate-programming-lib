This is the object that holds subcommands. Commands with unique requirements
can use this as a prototype.  

    (function () {
        var ret = {};
        
        ret.echo = ret.e = _"echo";
       
        ret.join = ret.j = _"join";
        
        ret.array = ret.arr = ret.a = _"array";

        ret.object = ret.obj = ret.o = _"object";

        ret.merge = _"merge";

        ret["key-value"] = ret.kv = _"key value";

        ret.act = _"act";

        ret.property = ret.prop = _"property";

        ret.json = _"json";

        ret.set = _"set";

        ret.gset = _"gSet";

        ret.get = _"get";

        ret.gget = _"gGet";

        ret.arguments = ret.args = _"arguments";

        ret.number = ret.n = ret["#"] = _"number";

        ret.eval = _"sc eval";

        ret.log = _"sc log";

        ret.true = ret.t = function () {return true;}; 
        ret.false = ret.f = function () {return false;}; 
        ret.null = function () {return null;}; 
        ret.doc =  function () {return this;}; 
        ret.skip = function () {return ;}; 

        return ret;

    })()

## Attach Subcommands

This attaches subcommands to plugins and folders. Note that this will attach
to the appropriate object based on the `this` whether it be Folder, folder, or
doc. 

    function (sub, f, cmd) {
        var subs, cmdplug,  cmdsub;

        if (cmd) {
            cmdplug = this.plugins[cmd];
            if (!cmdplug) {
                cmdplug = this.plugins[cmd] = {};
            } 
            cmdsub = cmdplug.subCommands;
            if (!cmdsub) {
                cmdsub = cmdplug.subCommands = {};
            }
            cmdsub[sub] = f;
        } else {
            subs = this.subCommands;
            subs[sub] = f; 
        }
    }




### Echo

This simply returns the input, but if it is surrounded by quotes, we remove
them. 

    function () {
        var arr = Array.prototype.slice.call(arguments);
        
        var ret = arr.map(function (str) { 
            if (("\"'`".indexOf(str[0]) !== -1) && 
                (str[0] === str[str.length-1]) ) {
                
                return str.slice(1, -1);
            } else {
                return str;
            }
        });

        ret.args = true;

        return ret;
    }

### Join


The first entry is the joiner separator and it joins the rest
  of the arguments. For arrays, they are flattened with the separator as well
  (just one level -- then it gets messy and wrong, probably).

    function (sep) {
        var args = Array.prototype.slice.call(arguments, 1);
        var ret = [];
        
        args.forEach( function (el) {
            if ( Array.isArray(el)) {
                ret.push(el.join(sep));
            } else {
                ret.push(el);
            }
        });

        return ret.join(sep);

    }

### Array 

This creates an array of the arguments.

    function () {
        return Array.prototype.slice.call(arguments, 0);
    }


### Object

This presumes that a JSON stringed object is ready
  to be made into an object.

    function (str) {
        var ret, doc = this;
        try {
            ret = JSON.parse(str);
            if (Array.isArray(ret) ) {
                return ["val", ret];
            } else {
                return ret;
            }
        } catch (e) {
            doc.gcd.emit("error:arg prepping:bad json parse:" + this.cmdname, 
                [e, e.stack, str]);
            return ["error", e];
        }
    }


### Merge

Merge arrays or objects, depending on what is there.

To merge the arrays, we use concat with the first argument as this and the
rest as arguments from slicing the arguments. 

For objects, we use the first object, iterate over the keys, adding. The later
objects will overwrite the earlier ones. 

    function (a) {
        var ret, args; 
        if (Array.isArray(a) ) {
            args = Array.prototype.slice.call(arguments, 1);
            return Array.prototype.concat.apply(a, args);
        } else {
            args = Array.prototype.slice.call(arguments, 1);
            ret = a;
            args.forEach( function (el) {
                var key;
                for (key in el) {
                    ret[key] = el[key];
                }
            });
            return ret; 
        }
    }

### Key Value

This produces an object based on the assumption that a
  `key, value` pairing are the arguments. The key should be text. 

    function () {
        var ret = {};
        var i, n = arguments.length;
        for (i = 0; i < n; i += 2) {
            ret[arguments[i]] = arguments[i+1];
        }

        return ret;
    }

### Property

This takes in an object and a list of keys to access something along the
property chain. 

    function () {
        var props = Array.prototype.slice.call(arguments, 0);
        var obj;
        try {
            obj = props.reduce(function (prev, cur) {
                return prev[cur];
            });
            return obj;
        } catch (e) {
            this.gcd.emit("error:bad property access:" +
                this.cmdname, [e, e.stack, props]);
            return;
        }
    }

### Act

This allows one to do `obj, method, args` to apply a method to an
  object with the slot 2 and above being arguments. For example, one could do
  `act( arr(3, 4, 5), slice, 2, 5)` to slice the array.

    function (obj, method) {
        try {
            return  obj[method].apply(obj, 
                Array.prototype.slice.call(arguments, 2)) ;
        } catch (e) {
            this.gcd.emit("error:arg prepping:bad method:" + this.cmdname, 
                [e, e.stack, obj, method,
                Array.prototype.slice.call(arguments)]);
            return ;
        }
    }

### JSON

This will convert an object to to JSON representation. If it fails (cyclical
structures for example), then it emits an error.

    function (obj) {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            this.gcd.emit("error:arg prepping:bad json:" + this.cmdname, 
                [e, e.stack, obj]);
            return ;
        }
    }

### Set

The presumption is that this is an object passed in whose scope is to be used.
If one wants to bubble the argument up, one can use `pass` in third
argument.

    function (obj, retType) {
        var doc = this;
        var gcd = doc.gcd;
        var name = doc.cmdName;
        var scope, key; 
        
        scope = gcd.scope(name);
        if (!scope) {
            scope = {};
            gcd.scope(name, scope);
        }
        for (key in obj) {
            scope[key] = obj[key];
        }
        if (retType === "pass" ) {
            return obj;
        } else {
            return ;
        }
    }

### gSet
  
This does this in a way that other commands in the pipe chain can
  see it.

    _"set | sub  doc.cmdName , _":sub line" " 

[sub line]()

    doc.cmdName.slice(0, doc.cmdName.lastIndexOf(doc.colon.v)) 
    

### Get

This retrieves the value for the given key argument(s).

    function () {
        var doc = this;
        var gcd = doc.gcd;
        var name = doc.cmdName;
        var scope; 
        
        scope = gcd.scope(name);
        if (!scope) {
            gcd.emit("error:arg prepping:no scope:" + name);
            return ;
        }

        var i, n = arguments.length;
        var ret = [];
        for (i = 0; i < n; i +=1 ) {
            ret.push(scope[arguments[i]]);
        }
        ret.args = true; // each is separate 
        return ret;
    }

### gGet

This retrieves the value for the given key argument from the pipe chain.

    _"get | sub  doc.cmdName , _":sub line" " 

[sub line]()

    doc.cmdName.slice(0, doc.cmdName.lastIndexOf(doc.colon.v)) 
    

### Arguments

This expects an array and each element becomes a separate
  argument that the command will see. E.g., `cmd arguments(arr(3, 4))` is
  equivalent to `cmd 3, 4`. This is useful for constructing the args
  elsewhere. In particular, `args(obj(_"returns json of an array"))` will
  result in the array from the subsitution becoming the arguments to pass in.  

    function (arr) {
        var ret =  arr.slice(0); //make a shallow copy
        ret.args = true;
        return ret;
    }


### Number

This converts the argument(s) to numbers, using js Number function. Each
number becomes a separate argument. 

    function () {
        var ret = [], i, n = arguments.length;
        for (i = 0; i < n; i += 1) {
            ret.push(Number(arguments[i]));
        }
        ret.args = true;
        return ret;
    }


### sc Eval

Will evaluate the argument and use the magic `ret` variable as the value to
  return. This can also see doc and args has the arguments post code.
  Recommend using backticks for quoting the eval; it will check for
  that automatically (just backticks, can do echo for the others if needed).

    function (code) {
        var ret, doc = this;
        var args = Array.prototype.slice.call(arguments, 1);

        if ( (code[0] === "`" ) && (code[code.length-1] === code[0]) ) {
            code = code.slice(1, code.length-1);
        }
       
        try {
            eval(code);
            return ret;
        } catch (e) {
            doc.gcd.emit("error:arg prepping:bad eval:" + doc.cmdname, 
                [e, e.stack, code, args]);
            return;
        }

    }

### sc Log

This logs the argument and passes them along as arguments.

    function () {
        var doc = this, name = doc.cmdName;
        var args = Array.prototype.slice.call(arguments);
        doc.log("arguments in " + name + ":\n---\n" + 
            args.join("\n~~~\n") + "\n---\n");
        return args;  
    }
