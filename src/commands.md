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
        "-" : _"dash",
        "if" : _"if",
        "ifelse" : _"ifelse",
        "done" : _"done",
        "when" : _"when"
    }

## More

These were written elsewhere and brought in. So they had a slightly different
establishing convention. 

    _"evil"

    _"funify"

    _"arrayify"

    _"objectify"

    _"immediate function execution"

    _"caps"

    _"assert"

    _"wrap"

    _"js-string"

    _"html-wrap"

    _"html-table"

    _"html-escape"

    _"html-unescape"

    _"snippets"
    
    _"matrix::"


    

## Doc

This produces the command documentation. 

    ## Built in commands

    Note commands need to be one word and are case-sensitive. They can be
    symbols as long as that does not conflict with anything (avoid pipes,
    commas, colons, quotes).

    _"comdoc | .join \n"    
    * **minidoc** `minidoc :title, :body` This takes an array and converts
      into an object where they key value is either the args as keys and the
      values the relevant input items or the item in the array is a
      two-element array whose first is the key and second is the value. The
      named keys in the arguments skip over the two-element arrays. minidocs
      are augmented with some methods.  See the augment section.
    * **augment** `augment type` This augments the object with the methods
      contained in the type augment object. See the augment section. 
    _"matrix::doc"



* [comdoc](#cdoc "h5: ")

## Folder prototype
    
For the normalization, we want to make sure it is not the first character to
avoid conflicts with the leader character in certain circumstances. 

    Folder.normalize = function (name) { 
        name = name.toLowerCase().
            replace(/(.)-/g, "$1").
            replace(/(.)_/g, "$1");
        return name;
        
    };
    var sync  = Folder.prototype.wrapSync = _"Command wrapper sync";
    Folder.sync = function (name, fun) {
        _":normalize"
        return (Folder.commands[name] = sync(name, fun));
    };

    var async = Folder.prototype.wrapAsync = _"Command wrapper async";
    Folder.async = function (name, fun) {
        _":normalize"
        return (Folder.commands[name] = async(name, fun));
    };

    var defaults = Folder.prototype.wrapDefaults = _"command wrapper cb sequence";
    Folder.defaults = function (name, fun) {
        _":normalize"
        return (Folder.commands[name] = defaults(name, fun) );
    };

[normalize]()
    
    name = Folder.normalize(name);


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
            return text;
        } catch (e) {
            doc.gcd.emit("error:command:eval:", [e, e.stack, code, text]);
            return e.name + ":" + e.message +"\n" + code + "\n\nACTING ON:\n" +
                text;
        }
    }

##### cdoc

    * **eval** `code, arg1,...`  The first argument is the text of the code to
      eval. In its scope, it will have the incoming text as the `text`
      variable and the arguments, which could be objects, will be in the
      `args` array. The code is eval'd (first argument). The code text itself
      is available in the `code` variable. The variable `text` is what is
      passed along.  This should make for quick hacking on text. The doc
      variable is also available for inspecting all sorts of stuff, like the
      current state of the blocks. If you want to evaluate the incoming text
      and use the result as text, then the line `text = eval(text)` as the
      first argument should work.

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

##### cdoc

    * **async** (async eval) `code1, code2, ...` Same deal as eval, except
      this code expects a callback function to be called. It is in the
      variable callback. So you can read a file and have its callback call the
      callback to send the text along its merry way. 

## evil

This evaluates the input. The arguments are available in an array called args. It will pass along the value in ret which is, by default, the original value of code. 

    
    Folder.sync("evil", _":fun");

[fun]()

    function (code, args) {
        var doc = this;
        var ret = code;
        try {
            eval(code);
            return ret;
        } catch (e) {
            doc.gcd.emit("error:command:evil:", [e, e.stack, code, args]);
            return e.name + ":" + e.message +"\n" + code + "\nARGS: " + args; 
        }


    }


##### cdoc

    * **evil** While the eval commands thinks of the first argument as code
      acting on the incoming text, its twin evil thinks of the incoming text
      as the code and the arguments as just environment variables. The value
      returned is the variable `ret` which defaults to the original code. 


## funify

This returns a function. It assumes the incoming text will compile to a
function. 
    
    Folder.sync("funify", _":fun");

[fun]()

    function (code, args) {
        var doc = this;
        var f;
        try {
            eval("f=" + code);
            return f;
        } catch (e) {
            doc.gcd.emit("error:command:evil:", [e, e.stack, code, args]);
            return e.name + ":" + e.message +"\n" + code + "\nARGS: " + args; 
        }


    }


##### cdoc

    * **funify** This assumes the incoming text is a function-in-waiting and
      it evals it to become so. This is great if you want to do a `.map` or if
      you just want to mess with stuff. `.call , args..` will call the
      function and return that result. 

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
    
 
 ##### hcdoc


    * **compile** `block, minor1, val1, minor2, val2,...` This compiles a
      block of text as if it was in the document originally. The compiled text
      will be the output. The first argument gives the names of the blockname
      to use if short-hand minor blocks are encountered. This is useful for
      templating. If no blockname is given, then the current one is used. Any
      further arguments should be in pairs, with the second possibly empty, of
      a minor block name to fill in with the value in the second place. 

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

##### cdoc

    * **sub** `key1, val1, key2, val2, ...`  This replaces `key#` in the text
      with `val#`. The replacement is sorted based on the length of the key
      value. This is to help with SUBTITLE being replaced before TITLE, for
      example, while allowing one to write it in an order that makes reading
      make sense. A little unorthodox. We'll see if I regret it. 

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

##### cdoc

    * **store** `variable name`  This stores the incoming text into the
      variable name.  This is good for stashing something in mid computation.
      For example, `...|store temp | sub THIS, that | store awe | \_"temp"` will
      stash the incoming text into temp, then substitute out THIS for that,
      then store that into awe, and finally restore back to the state of temp.
      Be careful that the variable temp could get overwritten if there are any
      async operations hanging about. Best to have unique names. See push and
      pop commands for a better way to do this. 

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


##### cdoc

    * **log** This will output a concatenated string to doc.log (default
      console.log) with the incoming text and the arguments. This is a good
      way to see what is going on in the middle of a transformation.

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

##### cdoc


    * **raw** `start, end` This will look for start in the raw text of the
      file and end in the file and return everything in between. The start and
      end are considered stand-alone lines. 

### Trim

Bloody spaces and newlines

    function (input) {
        return input.trim();
    }

##### cdoc

    * **trim** This trims the incoming text, both leading and trailing
      whitespace.  Useful in some tests of mine. 


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

##### cdoc

    * **join** This will concatenate the incoming text and the arguments
      together using the first argument as the separator. Note one can use
      `\n` as arg1 and it should give you a newline (use `\\n` if in a
      directive due to parser escaping backslashes!). No separator can be as
      easy as `|join ,1,2,...`.

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


##### cdoc


    * **cat**  The arguments are concatenated with the incoming text as is.
      Useful for single arguments, often with no incoming text.

### Echo

This is a simple command to echo the argument and ignore the input. Why?  This
allows one to use subcommands and start it in the chain. `cat` kind of does
this but just for text. 

    function (input, args) {
        return args[0];
    }

##### cdoc

    * **echo** `echo This is output` This terminates the input sequence and
      creates a new one with the first argument as the outgoing. 

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

##### cdoc

    * **get** `get blockname` This is just like using `\_"blockname"` but that
      fails to work in compositions. So get is its replacement. This ignores
      the input and starts its own chain of inputs. 

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


##### cdoc


    * **array** `array a1, a2, ...` This creates an array out of the input and
      arguments. This is an augmented array.


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

##### cdoc

    * **.** `. propname, arg1, arg2,... ` This is the dot command and it
      accesses property name which is the first argument; the object is the
      input (typically a string, but can be anything). If the property is a
      method, then the other arguments are passed in as arguments into the
      method. For the inspirational example, the push directive creates an
      array and to join them into text one could do `| . join, \,`. There is
      also an alias so that any `.propname` as a command works. For example,
      we could do `| .join \,` above.  This avoids forgetting the comma after
      join in the prior example. 

## Dash

This defines the command `-`  It looks up the first argument as a property of
the properties in
the `doc.dash` object and then calls it as a command. 

For example, in full using lodash,  `-pad 5`  will pad incoming strings to
make them length 5. It does this by the leader `-` sending `pad, 5` as the
arguments to this command and this command looking through its objects for the
pad method and then calling that command. The dash object might look like: `{
'lodash' : [lodash, #], {'date': [datefns, #], ...}`  where `lodash` and
`datefns` are the objects with the methods to call and the keys are the
associated command. So it will look in `lodash` for the property `pad` and
then call the `lodash` command as `lodash pad, 5`; it searches in order of the
numbering; random otherwise.

`doc.dash === parent.dash === Folder.dash` avoids prototype issues. Also I
think prototyping the dash is confusing. 
 
    function (input, args, name ) {
        var doc = this;
        var gcd = doc.gcd;
        var propname = args[0];
        var cmd;
        var dash = doc.dash;
       
        _":found"
        
        // no such property
        if (!found) {
            doc.log("no such property on dash: ", propname, args);
            gcd.emit("text ready:" + name, input);
        } else {
            doc.commands[cmd].call(doc, input, args, name);
        }
    }

[found]()

This is also used in the subcommands dash. 


        var found = Object.keys(dash).sort(function (a,b) {
           var numa = dash[a][1], numb = dash[b][1];
           var ret = numa - numb;
           if (isNaN(ret)) {
                return 0;
           } else {
                return ret;
           }
        }).some(function (a) {
            if (typeit(dash[a][0][propname], "function" )) {
                cmd = a;
                return true;
            }
        });

##### cdoc

    * **-** `- propname, arg1, arg2,... ` This is the dash command and it
      accesses the utility property which is the first argument; the object is the
      input (typically a string, but can be anything). It calls the relevant
      command with that method. 

      Each object in the `Folder.dash` has the form `cmdname: [object with
      methods, num]` where the command name is the name to be called (such as
      `lodash` and the methods should be on the called object, such as
      `require('lodash')` and the `num` order the search, with lower numbers
      coming first. 


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

##### cdoc

    * **push** Simply pushes the current state of the incoming text on the
      stack for this pipe process.

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

##### cdoc

    * **pop** Replaces the incoming text with popping out the last unpopped
      pushed on text.

### if

This checks a flag and then runs a command. 

    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var bool = args[0];
        var cmd;

        if (bool) {
            cmd = args[1];
            args = args.slice(2);
            _"command waiting"
        } else {
            gcd.emit("text ready:" + name, input);
        }
    }

##### cdoc

    * **if** `boolean, cmd, arg1, arg2, ....` If the boolean is true, 
      then the command will execute with the given input text and
      arguments. Otherwise, the input text is passed on. This is usefully
      paired with the subcommand boolean asks. For example 
      `?and(?flag(left),?flag(right)) will execute the `if` if both `left` and
      `right` are flagged.

#### command waiting

This waits for a command to be defined.

    
    if (doc.commands[cmd]) {
        doc.commands[cmd].call(doc, input, args, name);
    } else {
        gcd.once("command defined:" + cmd, function () {
            doc.commands[cmd].call(doc, input, args, name);
        });
    }


### ifelse

This is similar to the if, but it allows for multiple conditions. Each
argument should be an array of the form `arr(bool, cmdname, arg1, arg2, ..)`

    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;

This goes until something has a true boolean. Then it executes and stops. To
have a final condition that will execute, pass in `true()`. 

        var cmd;
        var checked = args.some(function (el) {
            if ( el[0] === true ) {
                cmd = el[1];
                args = el.slice(2);
                _"command waiting"
                return true;
            } else {
                return false;
            }
        });

If checked is false, then no condition meets and we continue on. 

        if (!checked) {
            gcd.emit("text ready:" + name, input);
        }

    }


##### cdoc

    * **ifelse** `arr(bool, cmd, arg1, arg2, ...), arr(bool2, cmd2, arg21,
      arg22, ...), ...` This expects arrays of the above form as arguments. It
      works through the conditions until it finds a true value and then it
      executes the command. If none are found, then it passes along the input
      text. 



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

##### cdoc

    * **when** `name1, name2, ...` This takes in the event names and waits for
      them to be emitted by done or manually with a
      `doc.parent.done.gcd.once(name, "done")`. That would probably be used in
      directives. The idea of this setup is to wait to execute a cli command
      for when everything is setup. It passes through the incoming text. 

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

##### cdoc

    * **done** `name` This is a command to emit the done event for name. It
      just passes through the incoming text. The idea is that it would be,
      say, a filename of something that got saved. 

## Arrayify

This is a convenience method for creating arrays from a block of text. 


    Folder.plugins.arrayify = {
        sep : "\n",
        esc : "\\",
        trim : true
    };
    Folder.sync("arrayify", _":fun");
    

[fun]()    
    
    function (input, args) {
        var plug = this.plugins.arrayify;
      if (typeof args[0] === "object") {
            plug = merge(true, plug, args.shift());
        } 
        var sep = args[0] || plug.sep;
        var esc = args[1] || plug.esc;
        var trim = args[2] || plug.trim;

        var ret = [];
        var i, n = input.length, j = 0;
        for (i = 0; i < n; i += 1) {

            if (input[i] === sep) {
                ret.push(input.slice(j,i));
                j = i + 1;
                continue;
            }

If we have an escape and the next one is escape or sep, then we slice it to
exclude i, putting i+1 at i, and the next round will bump the i safely past it. 
The only need to escape the escape is if there is a separator after the escape
character and the escape character is not supposed to escape. 

            if (input[i] === esc) {
                if ( (input[i+1] === sep) || (input[i+1] === esc) ) {
                    input = input.slice(0,i) + input.slice(i+1);
                    continue;
                }
            }
        }
        ret.push(input.slice(j, i));

        if (trim) {
            ret = ret.map(function (el) {
                return el.trim();
            });
        }
         
        ret = this.augment(ret, "arr");
        return ret;

    }


##### cdoc

    * **arrayify** This takes the incoming text and creates an array out of
      it. The first argument is an object with keys `sep` to know what to
      split on, `esc` to escape the separator and itself, `trim` a boolean
      that will trim the text for each entry. The defaults are newline,
      backslash, and true, respectively. You can also pass them as the first,
      second, and third argument, respectively. 
      Note that this assumes that both sep
      and esc are single characters. You can have the usual block
      substitutions, of course, but it might be safer to escape the block and
      run it through compile, e.g., ` | arrayify | .mapc compile`. 
      This also allows nesting of objects. To get a string representation of
      the array, call `| .toString`.


## Objectify


This is a convenience method for creating objects from a block of text. 


    Folder.plugins.objectify = {
        key : ":",
        val : "\n",
        esc : "\\",
        trim : true
    };
    Folder.sync("objectify", _":fun");
    

[fun]()    
    
    function (input, args) {
        var plug = this.plugins.objectify;
        if (typeof args[0] === "object") {
            plug = merge(true, plug, args.shift());
        } 
        var keysep = args[0] || plug.key;
        var valsep = args[1] || plug.val;
        var esc = args[2] || plug.esc;
        var trim = args[3] || plug.trim;

        var ret = {};
        var key = "";
        var i, n = input.length, j = 0;
        for (i = 0; i < n; i += 1) {

            if (input[i] === keysep) {
                key = input.slice(j,i).trim();
                j =  i + 1;
                continue;
            }
            if (input[i] === valsep) {
                ret[key] = input.slice(j,i);
                j =  i + 1;
                continue;
            }


If we have an escape and the next one is escape or sep, then we slice it to
exclude i, putting i+1 at i, and the next round will bump the i safely past it. 
The only need to escape the escape is if there is a separator after the escape
character and the escape character is not supposed to escape. 

            if (input[i] === esc) {
                if ( (input[i+1] === keysep) ||
                     (input[i+1] === valsep) ||
                     (input[i+1] === esc) ) {
                   input = input.slice(0,i) + input.slice(i+1);
                   continue;
                }
            }
        }
        
        ret[key] = input.slice(j, i);
            
        if (trim) {
            Object.keys(ret).forEach( function (key) {
                 ret[key] =  ret[key].trim();
            });
        }

        ret = this.augment(ret, "minidoc");
        return ret;    

    }


##### cdoc

    * **objectify** This takes the incoming text and creates an object out of
      it. The first argument is an object with keys `key` to know what to
      split on for the key, `val` to split on for the end of the value, `esc`
      to escape the separator and itself, `trim` a boolean that will trim the
      value for each entry; keys are automatically trimmed. The defaults
      are colon, newline, backslash, and true, respectively. 
      Note that this assumes
      that all the characters are single characters. You can have the usual
      block substitutions, of course, but it might be safer to escape the
      block and run it through compile, e.g., ` | objectify | .mapc compile`.
      This also allows nesting of objects. Call `|.toString()` to get a
      string. 

## Immediate Function Execution

Nowadays, it is better to use   `{ let ... }`.  But this may still be of some
use. 

When writing this snippets of code everywhere, a problem arises as to where to
place the scope of the variables. How do we avoid temporary variables from
polluting the full scope? And how do we effectively write tests for such
snippets?

The solution is the immediate function expressions. If we enclose a snippet in
function () {} () then we get a nice enclosed scope. If we also want to add in
some parameters from the surrounding (say read-only parameters or something to
be evaluated into a closure for later use), then we can do that as well.

The syntax will be ife for the no parameter version and ` ife v, w=hidethis` to
have parameters such as function(v,w) {} (v, hidethis) That is, the = is used
to rename an outer parameter into a different variable name while just a
single variable name is assumed to have the outer variable blocked.

This is designed to detect whether it is a function or not (by first word
being function) and then return the function or simply execute the code. To
set the return value by piping, include return = text where text is what one
would write after the return: return text

    Folder.sync("ife", _":fun");


[fun]()

    function (code, args) {
        var i, n = args.length;

        var internal = [];
        var external = [];
        var arg,ret; 

        for (i=0; i <n; i +=1 ) {
            arg = args[i] || "";
            arg = arg.split("=").map(function (el) {
                return el.trim();
            });
            if (arg[0] === "return") {
                ret = arg[1] || "";
            } else if (arg.length === 1) {
                internal.push(arg[0]);
                external.push(arg[0]);
            } else if (arg.length === 2) {
                internal.push(arg[0]);
                external.push(arg[1]);
            }

        }

        var start = "(function ( "+internal.join(", ")+" ) {";
        var end = "\n} ( "+external.join(",")+" ) )";

        if (typeof ret === "string") {
            return start + code + "\n return "+ret+";" + end;
        } else if (code.search(/^\s*function/) === -1) {
            return start + code + end;
        } else {
            return start + "\n return "+ code +";"+ end;
        }
    }

##### cdoc

    * **ife** This takes a snippet of code and creates an immediate function
      execution string for embedding in code. the arguments become the
      variable names in both the function call and the function definition. If
      an equals is present, then the right-hand side is in the function call
      and will not be hidden from access in the ife. 


## caps

The idea of this is to use capital letters as abbreviations. This is not
elegant, but it is kind of cool.

    Folder.plugins.caps = _":matches";
    
    Folder.sync("caps", _":fun");
 

[fun]()

    function (input, args) {
        var matches = args[0] || this.plugins.caps;
        var match, ret;

        var i = 0; 
        while (i < input.length) {
            if (matches.hasOwnProperty(input[i]) ) {
                match = matches[input[i]];
                if (typeof match === "string") {
                    //space after cap
                    if ( (input[i+1] === " ") || 
                        (input[i+1] === "\n") ||
                        ( (i+1) === input.length) ) {
                        input = input.slice(0, i) + match + input.slice(i+1);
                        i += match.length;
                    }
                } else if (typeof match === "function") {
                    ret = match(i, input);
                    input = ret[0];
                    i = ret[1];
                }
            }
            i += 1;
        }

        return input;
    }
    
`[test | M W>900px a](# "tranform: | caps | assert echo('@media (min-width: 900px) a') , caps test ")`

[matches]()

These are the matches. Each match is either a simple string or a function that
takes in the index and string and returns the replaced string.
    
    {
        M  : "@media",
        W : function (ind, input) {
                _":width"
            }
    }

[width]()

The width converts "<" and ">" into max and min widths. It is to be surrounded
by parentheses. It should be of the form `W<600px `  with no spaces until
after the unit. 

    var reg = /\ |\n|$/g;
    reg.lastIndex = ind;
    reg.exec(input);
    var end = reg.lastIndex -1; //input.indexOf(" ", ind);
    var num = input.slice(ind+2, end);
    var rep;
    if (input[ind+1] === "<") {
        rep = "(max-width: " + num + ")";
    } else if (input[ind+1] === ">") {
        rep = "(min-width: " + num + ")";
    } else {
        return [input, ind];
    }
    return [input.slice(0, ind) + rep + input.slice(end), ind+rep.length];

##### cdoc

    * **caps** This is a command that tries to match caps and replace them.
      The idea comes from wanting to write `M W>900px` and get `@media
      (min-width:900px)`. This does that. By passing in a JSON object of
      possible matches as argument or setting the caps local object to an
      object of such matches, you can change what it matches. But it only
      will match a single character (though unicode is fine if you can input
      that).  

## assert

This is a little command that should be more general. It tests for equality of
the strings.


    Folder.sync("assert", _":fun");


[fun]()

    function (input, args) {
        var doc = this;
        if (input !== args[0]) {
            doc.log("FAIL: " + args[1] + "\nACTUAL: " + input + 
                "\nEXPECTED: " + args[0]); 
        }
        return input;
    }

##### cdoc

    * **assert** This asserts the equality of the input and first argument
    and if it
      fails, it reports both texts in a log with the second argument as a
      message. `something | assert \_"else", darn that else`. This is a way to
      check that certain things are happening as they should. 


## wrap

This takes the incoming text and wraps it between the first and second
arguments. 

    Folder.sync("wrap", _":fun");

[fun]() 

    function (code, args) {
        return args[0] + code + args[1];
    }

##### cdoc

    * **wrap** This wraps the incoming text in the first and second argument:
      `some text | wrap <, >"  will result in `<some text>`. 

## js-string


If one is trying to insert a long text into a JavaScript function, it can have
issues. So here is a little helper command that will split new lines, escape
quotes, and then put it out as an array of strings joined with new lines.

    Folder.sync("js-string", _":fun");

[fun]()

    function (code) {
        code = code.replace(/\\/g, '\\\\');
        code = code.replace(/"/g, '\\' + '"');
        var arr = code.split("\n");
        var i, n = arr.length;
        for (i = 0; i < n; i += 1) {
            arr[i] = '"' + arr[i] + '"';
        }
        code = arr.join(" +\n");
        return code;
    }

##### cdoc

    * **js-string** This breaks the incoming text of many lines into quoted
      lines with appropriate plus signs added. 


## Html-wrap

This wraps content in a tag with arguments as attributes. 

    Folder.sync("html-wrap", _":fun");

[fun]()

    function (code, options) {

        var element = options.shift();

        _":Create attribute list"

        return "<" + element + " " + attributes + ">"+code+"</"+element+ ">";
    }  
    
[Create attribute list]()

We want to create an attribute list for html elements. The convention is that
everything that does not have an equals sign is a class name. So we will
string them together and throw them into the class, making sure each is a
single word. The others we throw in as is.

    var i, option, attributes = [], klass = [], str, ind;

    for (i = 0; i < options.length; i += 1) {
        option = options[i];
        if ( ( ind = option.indexOf("=")) !== -1 ) {
            str = option.slice(0, ind+1) + '"' + 
                option.slice(ind+1).trim() + '"';
            attributes.push(str);
        } else { // class
            klass.push(option.trim());
        }
    }
    if (klass.length > 0 ) {
       attributes.push('class="'+klass.join(" ")+'"');
    }
    attributes = attributes.join(" ");

##### cdoc

    * **html-wrap** This takes the incoming text and wraps it in a tag
      element, using the first argument as the element and the rest of the
      arguments as attributes. An equals sign creates an attribute with value,
      no equals implies a class. An attribute value will get wrapped in
      quotes. 
      `text-> | html-wrap p data, pretty, data-var=right`
      will lead to  `<p class="data pretty" data-var="right">text</p>`

## Html-table

This takes in a matrix (see augmented matrix type) and spits out an html table.

This could also have been a property of matrices, but it feels like something
that is a command on it to produce something new. 

    Folder.sync("html-table", _":fun");

[fun]()

    function (mat, options) {
        var type = options.shift();

        _"html-wrap:create attribute list"

        var ret = "<table" + (attributes.length ? " " + attributes : "") + ">\n";

        if (Array.isArray(type) ) {
            _":make row | sub td, th, row, type"
        }
       
        mat.forEach(function (row) {
            _":make row"    
        });
        ret += "</table>\n";
        return ret; 
    }

[make row]()

    ret += "<tr><td>" + row.join("</td><td>") + "</td></tr>\n";

##### cdoc

    * **html-table** This requires an array of arrays; augmented matrix is
      good. The first argument should either be an array of headers or
      nothing. It uses the same argument convention of html-wrap for the rest
      of the arguments, being attributes on the html table element. We could
      allow individual attributes and stuff on rows and columns, but that
      seems best left to css and js kind of stuff. Still thinking on if we
      could allow individual rows or entries to report something, but that
      seems complicated. 


## Html-escape

An extremely simple-minded escaping of the given code to be safe in html, 
e.g., javascript into an html pre element.

Replace <>& with their equivalents.

    Folder.plugins.html_escape = {
        '<' : '&lt;',
        '>' : '&gt;',
        '&' : '&amp;'
    };

    Folder.sync("html-escape", _":fun");

[fun]()


    function (code) {
        var chars = this.plugins.html_escape;
        var record = [];
        var i = 0, start = 0, n = code.length;
        while (i< n) {
            var char = chars[code[i]];
            if ( char) {
                record.push(code.slice(start, i), char);
                start = i+1; 
            }
            i += 1;
        }
        record.push(code.slice(start));
        return record.join('');
    }

##### cdoc
    
    * **html-escape** This escapes `<>&` in html. It is mainly intended for
      needed uses, say in math writing. Very simple minded. One can modify the
      characters escaped by adding to `Folder.plugins.html_escape`. This is
      actually similar to caps and snippets. 

## HTML-Unescape

    Folder.plugins.html_unescape = {
        'lt' : '<',
        'gt' : '>',
        'amp' : '&'
    };

    Folder.sync("html-unescape", _":fun");

[fun]()


    function (code) {
        var reg = /\&(\w+)\;/g;
        var chars = this.plugins.html_unescape;
        var match;
        var record = [];
        var start = 0;
        while ( (match = reg.exec(code) ) !== null)  {
            var char = chars[match[1]];
            if ( char) {
                record.push(code.slice(start, match.index), char);
                start = reg.lastIndex; 
            }
        }
        record.push(code.slice(start));
        return record.join('');
    }


##### cdoc

    * **html-unescape** The reverse of html-escape, depending on what the
      symbols are in `plugins.html_unescape`. 

## Snippets

This handles snippets. Currently it is empty of default snippets. Most likely,
one would develop a standard lprc.js with the snippets in there. 

    Folder.plugins.snippets = {};

    Folder.sync("snippets", _":fun");
    Folder.sync("s", _":fun");

[fun]() 

    function (code, args) {
        var name = args.shift();
        var plug = this.plugins.snippets;
        var snip, ret, reg, match, rep, num;
        if (plug.hasOwnProperty(name)) {
            snip = plug[name];
            if (typeof snip === "function" ) {
                ret = snip.apply(this, args);
            } else if (typeof snip === "string") {
                _":string"
            } else {
                this.log("Unknown type of snippet:"  + args.join(", "));
                ret = args.join(",");
            }
            
        } else {
            this.log("Unknown snippet: " + args.join(", "));
            ret = args.join(",");
        }
    return ret;
    }

[string]()

So we want to be able to plug in simple parameters. 

    ret = snip;
    reg = /ARG(\d+)(?:\|\|([^|]*)\|)?/g;
    while ( (match = reg.exec(ret) ) !== null ) {
        num = parseInt(match[1],10);
        if (typeof args[num]  !== "undefined") {
            rep = args[num];
        } else { //string or undefined
            rep = match[2] || '';
        }
        ret = ret.slice(0, match.index) + rep + 
            ret.slice( match.index + match[0].length );
        // as string is changing, update lastIndex, but make sure we get past
        reg.lastIndex = match.index + rep.length; 
    }



##### cdoc

    * **snippets** (alias **s** ). This is a function for things that are
      easily named, but long to write, such as a cdn download script tag for a
      common js library, say jquery. `s jquery` could then do that. Currently,
      there are no default snippets. To load them, the best bet is in the
      lprc.js file and store the object as `Folder.plugins.snipets = obj` or,
      if you are feeling generous, one could do
      `Folder.merge(Folder.plugins.snippets, obj);`. This is really a
      stand-alone command; incoming text is ignored. 

      In writing a snippet, it can be a function which will take in the
      arguments. Alternatively, you can sprinkle ``ARG#||...| `` 
      in your code for
      the Argument with numner # and the pipes give an optional default; if
      none, then ARG# is eliminated. So `ARG0||1.9.0|` yields a default of
      1.9.0. Pipes cannot be in the default

      Be careful that the first argument is the snippet name. 


