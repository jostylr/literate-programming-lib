Here we have common commands. 

    {   eval : sync(_"eval", "eval"),
        passthru : sync(function (text) {return text;}, "passthru"),
        sub : _"sub",
        store: sync(_"store command", "store"),
        log : sync(_"log", "log"),
        async : async(_"async eval", "async"),
        compile : _"compile",
        raw : sync(_"raw", "raw"),
        trim : sync(_"trim", "trim"),
        join : sync(_"join", "join"),
        cat : sync(_"cat", "cat"),
        echo : sync(_"echo", "echo"),
        get : _"get",
        array : sync(_"array", "array"),
        minidoc : sync(_"minidoc::", "minidoc"),
        augment : _"augments::", 
        push : sync(_"push", "push"),
        pop : sync(_"pop", "pop"),
        "." : _"dot",
        "if" : _"if",
        "done" : _"done",
        "when" : _"when"
    }

## Folder prototype
    
     var sync  = Folder.prototype.wrapSync = _"Command wrapper sync";
    Folder.sync = function (name, fun) {
        return (Folder.commands[name] = sync(name, fun));
    };

    var async = Folder.prototype.wrapAsync = _"Command wrapper async";
    Folder.async = function (name, fun) {
        return (Folder.commands[name] = async(name, fun));
    };

    var defaults = Folder.prototype.wrapDefaults = _"command wrapper cb sequence";
    Folder.defaults = function (name, fun) {
        return (Folder.commands[name] = defaults(name, fun) );
    };

### Command wrapper sync

This is a utility for wrapping synchronous functions that have signature
`input, args --> output`  Basically, we throw the arguments into the
form of interest and upon output, we emit it. Doc is the context of the sync. 

We catch any errors and emit an error event. This prevents further processing
of this block as the text ready event does not further. It just stops
executing. 

    function (fun, label) {
        _":switching"

        var f = function (input, args, name, command) {
            var doc = this;
            var gcd = doc.gcd;

            try {
                var out = fun.call(doc, input, args, name);
                gcd.scope(name, null); // wipes out scope for args
                gcd.emit("text ready:" + name, out); 
            } catch (e) {
                doc.log(e);
                gcd.emit("error:command execution:" + name, 
                    [e, e.stack, input, args, command]); 
            }
        };

        if (label) {
            f._label = label;
        }

        return f;
    }

[switching]()

Due to poor thinking, I put the function first and then the name. This is a
bit unconventional and is annoying. But it is easy to distinguish strings and
functions so we do so and fix it. 

        var temp;
        if (typeof fun === "string") {
            temp = fun;
            fun = label;
            label = fun;
        }


### Command wrapper async

Here we wrap callback functionated async functions. We assume the function
call will be of `input, args, callback` and the callback will
receive `err, data` where data is the text to emit. 

    function (fun, label) {
        _"command wrapper sync:switching"
        var f = function (input, args, name, command) {
            
            var doc = this;
            var gcd = doc.gcd;

            var callback = function (err, data) {
                if (err) {
                    doc.log(err);
                    gcd.emit("error:command execution:" + name, 
                        [err, input, args, command]);
                } else {
                    gcd.scope(name, null); // wipes out scope for args
                    gcd.emit("text ready:" + name, data);
                }
            };
            callback.name = name; 
            fun.call(doc, input, args, callback, name);
        };
        if (label)  {
            f._label = label;
        } 
        
        return f;
    }
    
### Command wrapper cb sequence

The idea of this is a command that is not fundamentally async, but that may
require waiting for a sequence. It expects an array whose first leading
argument is a tag function that creates a unique name for the call when passed
in the arguments. The next arguments are strings which indicate the
default value store in the document. Empty is fine. The final argument is the
function to execute in a synchronous. If you want the last one to be async,
then presumably one could just be async the whole way. This is for sync
except for a little bit of default filling in of arguments.   

fun is actually an array whose last element is the final function to execute. 

`doc.wrapDefaults`

    function (label, fun) {
        _"command wrapper sync:switching"
        var i, n, bad;

        var arr = fun.slice();
        var tag = arr.shift() || '';
        fun = arr.pop();

        _":tag"

        _":check array for non-empty string" 
        
        var f = function (input, args, name, command) {
            
            var doc = this;
            var gcd = doc.gcd;
            var v = doc.colon.v;
            
            var cbname = tag.call(doc, args);    

            gcd.when(cbname + v + "setup", cbname); 

            arr.forEach(function (el, i) {
                if ( _":check need default" ) {
                    gcd.when(cbname + v + i, cbname);
                    doc.retrieve(el, cbname + v + i); 
                } 
            });
            
            gcd.on(cbname, _":handler");
            
            gcd.emit(cbname + v + "setup");
            
        };

        if (label)  {
            f._label = label;
        } 
        
        return f;
    
    }


[handler]()

This reads off the data from the emitted events into the args array. Then it
executes the synchronous function.

The index we need for argument replacing should be in the last of the name. 

    function(data) {
        data.shift(); // get rid of setup
        data.forEach(function (el) {
            var ev = el[0];
            var i = parseInt(ev.slice(ev.lastIndexOf(v)+1));
            args[i] = el[1];
        });
        try {
            var out = fun.call(doc, input, args, name);
            gcd.scope(name, null); // wipes out scope for args
            gcd.emit("text ready:" + name, out); 
        } catch (e) {
            doc.log(e);
            gcd.emit("error:command execution:" + name, 
                [e, e.stack, input, args, command]); 
        }
    }



[check array for non-empty string]() 

This looks for a non-empty string in the array. Any entries that are not
strings get converted to empty strings. 

This swallows having non-string elements and perhaps should be revisited.

    n = arr.length;
    bad = true;
    for (i = 0; i < n; i += 1) {
        if (arr[i] && typeof arr[i] === "string") {
            bad = false;
        } else {
            arr[i] = '';

        }
    }

[check need default]()

We need the string in the defining array to be non-empty and if so, we then
only do something if the arg in the corresponding position is undefined or
empty. 

    ( el ) && ( ( typeof args[i] === "undefined" ) || ( args[i] === '' ) )


[tag]() 

This makes a function if the tag is a string. The basic idea is we have a
tagname, then we have the arguments that are called, and then a unique
counter. Hopefully this is sufficient to make it unique and identifiable.  

    if (typeof tag === "string") {
        tag = (function (tag) {
            return function (args) {
                var doc = this;
                var col = doc.colon.v;
                return tag + args.join(col) + col + doc.file +  
                    col + doc.uniq();
            };
        })(tag);
    }

## Commands


### Eval

This implements the command `eval`. This evaluates the first argument as JavaScript. It
is formulated to be synchronous eval.

`code` contains the text to be eval'd which is the first argument. `text` has
the incoming text and is the return variable. `args` is available; the first
one is shifted off to the code variable.


    function ( text, args ) {
        var doc = this;

        var code = args.shift();

        try {
            eval(code);
            return text.toString();
        } catch (e) {
            doc.gcd.emit("error:command:eval:", [e, e.stack, code, text]);
            return e.name + ":" + e.message +"\n" + code + "\n\nACTING ON:\n" +
                text;
        }
    }

### Async Eval

This implements the ability to evaluate input asynchronously. This will
execute input in the context given. So doc, args, callback should all be
variables available in the code. When done, invoke callback with signature
`f(err, data)` where data should be string. 

Note the catch here will not catch errors from the async stuff, but will catch
some mistakes.

    function (text, args, callback) {
        var doc = this;

        var code =  args.shift();

        try {
            eval(code);
        } catch (e) {
            doc.gcd.emit("error:command:async:", [e, e.stack, code, text]);
            callback( null, e.name + ":" + e.message +"\n"  + code + 
             "\n\nACTING ON:\n" + text);
        }
    }


### Compile

This takes in some text and compiles it, returning the compiled text when
done. A main use case would be multiple processing of a block, say after
subbing in some values or to wait to do block substitution until after some
processing.

This is a bit of a hack. So any command will have a colon in it. This triggers
the block compiling to emit a minor ready event, which we can listen for and
the simply emit the text ready event. The name also include the file name 

The stripped is to remove the starting filename. 

There is only one argument which gives an alternate mainblock name for minor
blocks to use. 

To have multiple blocks with minors, you could use the sub command: `sub $1,
dude, $2, man | compile`

    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var file = doc.file;
        var colon = doc.colon.v;
        var i, n, start ;

        var stripped = name.slice(name.indexOf(":")+1) + colon + "c";

        if (args[0]) {
            start = args[0].toLowerCase();
        } else {
            _":mainblock name"
        }

        _":minors"

        gcd.once("minor ready:" + file + ":" + stripped, function (text) {
            gcd.emit("text ready:" + name, text); 
        });
        doc.blockCompiling(input, file, stripped, start );
    }

[mainblock name]()

This gets the mainblock name if first argument does not give it. 

    i = name.indexOf(":")+1;
    n = name.indexOf(":", i);
    if (n === -1) { n = name.indexOf(colon); }
    start = name.slice(i, n);

[minors]()

If there are additional arguments, we can use those arguments to create the
minor blocks and store values in them. The arguments alternate between name
and value, allowing the value to be whatever. 

Reusing i,n. Want to jump by 2, start at 1 as 0 is the compile name. 

    n = args.length;
    for (i = 1; i < n; i += 2) {
        if (args[i] && (typeof args[i] === "string") ) {
            if (typeof args[i+1] === "undefined") {
                doc.store(start + doc.colon.v + args[i].toLowerCase(), '');
            } else {
                doc.store(start + doc.colon.v + args[i].toLowerCase(), args[i+1]);
            }
        }
    }
    
    

### Sub

This is the sub command which allows us to do substitutions. Each pair of
arguments is a term and its replacement value. We will sort the keys by length
so that the largest matches happen first. 

We will do the replacement using indexOf and splicing due to potential
conflicts with .replace (the $ replacements and the lack of global aspect if
given a string). 

This will indent the subsequent lines so it is appropriate to use with blocks
of code. 


    function (str, args, name) {
        var doc = this;
        var gcd = this.gcd;

This is to ensure all the objects are strings. Since we are sorting on their
length, we need to make sure they are strings. Using toString seems
reasonable. Other places are not often troubled because they are simply using
them as strings in a way that they get typecast. 


        args = args.map(function (el) {
            return el.toString();
        });
        
        var index = 0, al = args.length, k, keys, obj = {}, 
            i, j, old, newstr, indented;

        for (i = 0; i < al; i +=2) {
           obj[args[i]] = args[i+1]; 
        }

        keys = Object.keys(obj).sort(function (a, b) {
            if ( a.length > b.length) {
                return -1;
            } else if (a.length < b.length) {
                return 1;
            } else {
                return 0;
            } });


        k = keys.length;
        for (j = 0; j < k; j += 1) {
            index = 0;
            old = keys[j];
            newstr = obj.hasOwnProperty(keys[j]) ? obj[keys[j]] : '';
            while (index < str.length ) {
                _":replace"
            }
        }

        gcd.emit("text ready:" + name, str);
    }

[replace]()

This is the function that replaces a part of a string with another.


        i = str.indexOf(old, index);

        if (i === -1) {
            break;
        } else {
            indented = doc.indent(newstr, doc.getIndent(str, i));
            str = str.slice(0,i) + indented + str.slice(i+old.length);
            index = i + indented.length;
        }

### Store Command

This is a thin wrapper of the store function. It returns the input immediately
even though the storing may not yet be done. 

    function (input, args) {
        var doc = this;

        var vname = doc.colon.escape(args[0]);

        if (vname) {
            doc.store(vname, input);
        }
        return input; 
    }

### Log

This outputs the input and args to the doc.log function. In particular, it
joins the args and input with `\n---\n` 

    function (input, args) {
        var doc = this;
        if (args && args.length) {
            doc.log(input + "\n~~~\n" + args.join("\n~~~\n"));
        } else {
            doc.log(input);
        }
        return input;
    }


### Raw

This takes the raw text between two markers. Typically the markers will be the
header and an exclude.  This is a stand-alone command, i.e., the input is
irrelevant. 

    function (input, args) {
        var doc = this;
        var start, end, text;
        var gcd = doc.gcd;

        var file = doc.parent.docs[args[2]] || doc;
        
        if (file) {
            text = file.text;
            start = args[0].trim() + "\n";
            start = text.indexOf(start)+start.length;
            end = "\n" + args[1].trim();
            end = text.indexOf(args[1], start);
            return text.slice(start, end);
        } else {
            gcd.emit("error:raw:" + doc.file, args);
            return '';
        }


    }


### Trim

Bloody spaces and newlines

    function (input) {
        return input.trim();
    }


## Join

This will join the incoming text and the arguments beyond the first one
together using the separator which is the first argument. This only makes
sense when there is at least one argument.   

    function (input, args) {
        var sep = args.shift() || '';
        if (input) {
            args.unshift(input);
        }
        return args.join(sep);
    }

### Cat

Concatenating text together and returning it. Probably mostly a single
argument use case. 

    function (input, args) {
        var sep = '';
        if (input) {
            args.unshift(input);
        }
        return args.join(sep);
    }



### Echo

This is a simple command to echo the argument and ignore the input. Why?  This
allows one to use subcommands and start it in the chain. `cat` kind of does
this but just for text. 

    function (input, args) {
        return args[0];
    }

##### Sync

    echo
    ---
    _"../"
    ---
    `echo arg` This returns the first argument to pass along the pipe flow.
    Nothing else is done or passed. 


### Get

This gets a section from the document just as if one were using the
substitution text. This is useful for compositions. 

It takes an optional command

    function (input, args, name) {
        var doc = this;
        var colon = doc.colon;

        var section = colon.escape(args.shift());
        doc.retrieve(section, "text ready:" + name);
    }

### Array

This shunts the input and the arguments into an array to be passed onto the
next pipe.

Slice is probably unnecessary, but in case args arrays got reused, this would
protect from that. 

We also augment the array to have the custom properties for the "arr" object.

    function (input, args) {
        var doc = this;
        var ret = args.slice();
        ret.unshift(input);
        ret = doc.augment(ret, "arr");
        return ret;
    }
##### sync

    arr 
    _"../"
 
##### doc

    arr
    `arr arg1, arg2, ...` This generates an array to pass on that consists of
    `[input, arg1, arg2, ...]`. 


##### test

Basic test and also, having some inline stuff. 

    arr.md
    ---
    var f = _"../";
    var a = f("1", ["2", "3"]);
    var b = ["1", "2", "3"];
    t.deepEquals(a, b);
    t.equals(a, b);




## Dot

This defines the command `.`  It takes the incoming thing as an object and
uses the first argument as the method to call. The other arguments are just
used in the calling of the method. 

So for example if the input is an array, then we can use `. join ;\n` to join
the array into text with a semicolon and a newline at each end. 

Adding a little async option. If the object has a method that is the command,
but with a `.` in front, then we call that as if it was a command. Otherwise,
we assume a normal property. 

If property does not exist yet, this causes a problem, but augmenting will
stop the flow within the same pipeline. 

    function (input, args, name, cmdname) {
        var doc = this;
        var gcd = doc.gcd;
        var propname = args.shift();
        var async = false;
        var prop;
        if ( (prop = input["." + propname] ) ) {
            async = true;
        } else {
            prop = input[propname];
        }
        var ret;
        if (typeof prop === "function") {
            if (async) {
                prop.call(doc, input, args, name, cmdname);
                return;
            } else {
                ret = prop.apply(input, args);
                if (typeof ret === "undefined") {
                    doc.log("method returned undefined " + propname, input, propname, args);
                    ret = input;
                } 
            }
        } else if (typeof prop === "undefined") {
            doc.log("property undefined " + propname, input, propname, args); 
            ret = input; 
        } else {
            ret = prop;
        }
        gcd.emit("text ready:" + name, ret);
    }

### Push

    function (input, args, name) {
        var folder = this.parent;
        var stack = folder.stack;
        var cmdpipe = name.slice(0, name.lastIndexOf(folder.colon.v));
        if (stack.hasOwnProperty(cmdpipe)) {
            stack[cmdpipe].push(input);
        } else {
            stack[cmdpipe] = [input];
        }
        return input;
    }

### Pop 

    function (input, args, name) {
        var gcd = this.gcd;
        var folder = this.parent;
        var stack = folder.stack;
        var cmdpipe = name.slice(0, name.lastIndexOf(folder.colon.v));
        var ret;
        if (stack.hasOwnProperty(cmdpipe)) {
            ret = stack[cmdpipe].pop();
            if (stack[cmdpipe].length === 0) {
                delete stack[cmdpipe];
            }
        } else {
            gcd.emit("error:pop found nothing to pop:"+name);
            ret = input;           
        }
        return ret;
    }

### if

This checks a flag and then runs a command. 

    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var flag = args[0];

        if (doc.parent.flags.hasOwnProperty(flag) ) {
            doc.commands[args[1]].call(doc, input, args.slice(2), name);
        } else {
            gcd.emit("text ready:" + name, input);
        }
        

    }

### when

This pauses the flow until the argument list of events is done. 

    function (input, args, name) {
        var folder = this.parent;
        var gcd = this.gcd;
        var done = folder.done;
        var cache = done.cache;
        var when = [];

        var i, n = args.length;
        for (i = 0; i < n; i +=1) {
            if (! cache[args[i]]) {
                when.push(args[i]);
            }
        }
        if (when.length > 0) {
            done.gcd.once("ready to send:" + name, function () {
                gcd.emit("text ready:" + name, input);
            });
            done.gcd.when(when, "ready to send:" + name);
        } else {
            gcd.emit("text ready:" + name, input);
        }
    }

### done

This allows one to issue a command of done. 

    function (input, args, name) {
        var gcd = this.gcd;
        this.parent.done.gcd.emit(args[0]);
        gcd.emit("text ready:" + name, input);
    }

[action]()

This is the action name to assign for listening to done events. Something like
`doc.done.gcd.once(str, "done");` where str is the string that is also in the argument
list, something like `file saved:...`;

    function (data, evObj) {
        var folder = this;
        folder.done.cache[evObj.ev] = true;
    }


