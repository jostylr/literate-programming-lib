Directives allow us to control the document flow. 

    {   
        "save" : _"save",
        "new scope" : _"new scope",
        "store" : _"store",
        "log" : _"log",
        "out" : _"out",
        "load" : _"load",
        "cd" : _"cd",
        "link scope" : _"link scope",
        "transform" : _"transform",
        "define" : _"define directive",
        "subcommand" : _"subcommand directive",
        "block" : _"block",
        "ignore" : _"ignore language",
        "eval" : _"eval",
        "if" : _"if",
        "flag" : _"flag",
        "push" : _"push",
        "h5" : _"h5",
        "compose" : _"compose",
        "partial" : _"partial",
        "version" : _"version",
        "npminfo" : _"npminfo",
    }

## Folder prototype

    var dirFactory = Folder.prototype.dirFactory = _"dir factory";
    Folder.plugins.npminfo = _"npminfo:types";
    Folder.prototype.compose = _"compose:folder compose";

## Doc prototype


    dp.getBlock = _"Doc block";
    dp.stripSwitch = _"strip switch";
    dp.midPipes = _"Middle of pipes";
    dp.getPostPipeName = _"Post pipe name";
    dp.pipeDirSetup = _"Pipe processing for directives";

    

Directives get a single argument object which gets the link, the href, and
 the text after the colon. 

## Post pipe name

This is a practically trivial function for getting the name after a pipe.

We need to add one past the pipe and so if it is not found, then it becomes a
0 and we can just do if. 

    function (name) {
        var ind = name.indexOf("|") + 1;
        if (ind) {
            return name.slice(ind);
        } else {
            return '';
        }
    } 
 
## Dealing with directive pipes

Sometimes we want to have pipes being parsed and used. This should be an easy
thing to do and this is where the helper functions live. They are attached via
prototyping from Folder down to doc.

One goal is to try and eliminate a need to understand the gcd object. We just
make the choices. 

#### Doc block

We start by deciding which block of text to read in from. 

This typically comes from `args.href` and the leading sharp is removed if
present. If there is a sharp, then we also replace dashes with spaces. 


`start = doc.getBlock(args.href, args.cur)`

Note start (href) is not expected to have colon escapes, but cur might. 


    function (start, cur) {
        var doc = this;
        var colon = doc.colon;

        if (typeof cur === "string") {
            cur = colon.restore(cur);
        } else {
            cur = '';
        }

        if (typeof start === "string") {
            if ( start[0] === "#") {
                start = start.slice(1).replace(/-/g, " ");
            }

            start = doc.convertHeading(start);

            if (start[0] === ":") {
                start = doc.stripSwitch(cur) + start;
            }

        } else {
            doc.gcd.emit("error:start not a string in doc block", [start, cur]);
            start = '';
        }
        
It is possible (likely even!) that start consisted of just `#` which indicates
that it should be the current block name to use for starting. Afer slicing
from the hash, start would be empty in this case. 
        
        if (!start) {
            start = cur;
        }
        return colon.escape(start);
    }
        


#### Strip switch

This is a small utility that recovers the block name not including any minor
block. 

    function (name) {
        var ind, blockhead;

        blockhead = name = name || '';

        if ( (ind = name.indexOf("::")) !== -1)  {
            if (  (ind = name.indexOf(":", ind+2 )) !== -1 ) {
                blockhead = name.slice(0, ind);
            }
        } else if ( (ind = name.indexOf(":") ) !== -1) {
            blockhead = name.slice(0, ind);
        }

        return blockhead;

    }


#### Middle of pipes

This deals with the stuff between the colon and the first pipe. What that
stuff represents, if anything, depends on the directive. Note that the pipe is
not currently escapable. 

`doc.midPipes(args.title);`

    function (str) {
        var ind = str.indexOf("|");
        var options, pipes;

        ind = str.indexOf("|");
        if (ind === -1) {
            options = str.trim();
            pipes = "";
        } else {
            options = str.slice(0,ind).trim();
            pipes = str.slice(ind+1);
        }

        return [options, pipes];
    }

#### Pipe Processing for directives

This should handle the pipes for directives given the needed info. This setups
the events. Supply the end of the title string, the emitname which is defined
in the directive (unique), the handler to be called (also defined in the
directive), and the starting block. 

`doc.pipeDirSetup(pipes, emitname, f, start)`

    function (str, emitname, handler, start) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        var block;

        var subEmit, textEmit, doneEmit;

        if (str) {
            str = str + '"';
            doneEmit = "text ready:" + emitname;
            textEmit = "text ready:" + emitname + colon.v + "sp";
            subEmit = "pipe chain ready:" + emitname + colon.v + "sp";
            gcd.once(doneEmit, handler);
            
            gcd.when(textEmit, subEmit);
            
            gcd.once(subEmit, function (data) {
                var text = data[data.length-1][1] || '';
                gcd.emit(doneEmit, text);
            });
            

            block = doc.stripSwitch(colon.restore(start));

            doc.pipeParsing(str, 0, '"', emitname + colon.v + "sp", block,
                subEmit, textEmit);

        } else {
            gcd.once("text ready:" + emitname + colon.v + "sp", handler); 
        }

    }


### Dir Factory

This produces functions that can serve as directives with the pipe parsing
built in. It takes in an emitname function and a handler creator. 

This is designed around the state variable holding the state. This is the
easiest to have flexibility with the functions. So each of the provided
functions might modify and add to the state. Note that the state starts as the
arguments parsed from a directive link, but that things get added to it. 

In particular, namefactory should add an emitname and handlerfactory should
add in handler.

    function (namefactory, handlerfactory, other) {

        return function (state) {
            _":init"
            
            namefactory.call(doc, state);
            
            handlerfactory.call(doc, state);

            other.call(doc, state);

            _":emit"
        };
        

    }


[init]()

This sets up the variables and parsing of the incoming arguments. 

    var doc = this;
    var gcd = doc.gcd;
    var colon = doc.colon;
    
    state.linkname = colon.escape(state.link);
    var temp;

    state.start =  doc.getBlock(state.href, state.cur);
    
    temp = doc.midPipes(state.input);
    state.options = temp[0];
    state.pipes = temp[1];


[emit]()

This setups the pipe processing and then queues/executes it based on whether
the start value is ready. 

Typically, the starting value is found from href. But if during the processing
we have the `state.start` set to falsy, then we use `state.value` or the empty
string.

This has to do with the store directive where one can just specify a simple
value. Also, if state.start is falsy, then we use current location for the
heading reference (end of pipeDirSetup).

We also want the emit to not happen until all parsing is done. For example,
the push directive needs the waiting. 

We make sure each emitname ends in ":" as this allows for unnamed mainblocks
to be cut correctly in the subname computation (subname
transformation:slicing).  

    doc.pipeDirSetup(state.pipes, state.emitname, state.handler, 
        ( state.start ||  state.block || '') );

    var pipeEmitStart = "text ready:" + state.emitname + colon.v + "sp";
    if (! state.value) {
        doc.retrieve(state.start, pipeEmitStart);
    } else {
        gcd.once("parsing done:"+this.file, function () {
            gcd.emit(pipeEmitStart, state.value || "" );
        });
    }


#### Save

Here we write the save function using the factory function. 

    
    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()


    function (state) {
        state.emitname =  "for save:" + this.file + ":" + 
          (state.saveprefix || '') + state.linkname; 
    }


[handler factory]()

    function (state) {
        var gcd = this.gcd;
        var linkname = (state.saveprefix || '') + state.linkname;

        var f = function (data) {
            if (data[data.length-1] !== "\n") {
               data += "\n";
            }
            gcd.emit("file ready:" + linkname, data);
        };
        f._label = "save;;" + linkname;

        state.handler = f;

    }

[other]()

    function (state) {
        var file = this.file;
        var gcd = this.gcd;
        var linkname = (state.saveprefix || '') + state.linkname;
        var options = state.options;
        var start = state.start;
        // es6 var {linkname, options, start} = state; 

        gcd.scope(linkname, options);

        gcd.emit("waiting for:saving file:" + linkname + ":from:" + file, 
             ["file ready:" + linkname, "save", linkname, file, start]);

    }

[reporter]() 

Here we make the function that will give the report when a save does not
happen. This is very important. 

The args should be `filename to save, section to wait for`. 

    function (args) {
        var name = this.recording[args[2]] || args[2];
        return "NOT SAVED: " + args[0] + " AS REQUESTED BY: " + args[1] + 
            " NEED: " + name;
    }

### Out

This is the same as save, except it just ouputs it to the console via doc.log. 


    dirFactory(_":emitname", _":handler", _":other")

[emitname]() 

    function (state) {
        state.emitname = "for out:" + this.file + ":" + this.colon.escape(state.linkname);
    }

[handler]()

    function (state) {
        var doc = this;
        var gcd = doc.gcd;
        var linkname = state.linkname;
        var emitname = state.emitname;


        var f = function (data) {
            gcd.emit(emitname, data);
            doc.log(linkname + ":\n" + data + "\n~~~\n");
        };

        f._label = "out;;" + linkname;

        state.handler = f;       

    }

[other]() 

    function (state)  {
        var gcd = this.gcd;
        var linkname = state.linkname;
        var emitname = state.emitname;
        var start = state.start;
        var options = state.options;
        
        gcd.scope(linkname, options);

        gcd.emit("waiting for:dumping out:" + linkname, 
            [emitname, linkname, this.file, start]  );
    }


[reporter]() 

Here we make the function that will give the report when a save does not
happen. This is very important. 

The args should `outname, file, section to wait for`. 

    function (args) {
        var name = this.recording[args[2]] || args[2];
        return "NOT REPORTED OUT: " + args[0] + " AS REQUESTED BY: " + args[1] + 
            "\nNEED: " + name;
    }



### New scope

This is a directive that creates a new global scope. The args should give us
the global name and a local name. In the link, it goes
`[scopename](# "newscope:")` 

    function (args) {
        var doc = this;
        var scopename = args.link;

        doc.parent.createScope(scopename);

    }

### Link Scope

This is a directive that aliases a scope. This is unlikely to be used too
much; generally one would use the load for a litpro doc and other scopes
should just be what one wants. But anyway, it is easy to implement. 
`[alias](# "link scope:scopename")`

    function (args) {
        var doc = this;
        var alias = args.link;
        var scopename = args.input;

        doc.createLinkedScope(scopename, alias); 

    }


### Store

This is the directive for storing some text. 

`[name](#start "store: value|...")`

We have pipes that either act on value, if defined, or do start. If doing
value, best to use `#` and not have any code in that block.

    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()


    function (state) {
        var linkname = state.linkname;

        state.emitname =  "for store:" + this.file + ":" + linkname;
    }

[handler factory]()

    function (state) {
        var doc = this;
        var c = doc.colon.v;
        var linkname = state.linkname;

        var f = function (data) {
            if (state.varname[0] === c) {
                //allowing minor blocks to get the major block directive is in
                state.varname = state.cur.split(c)[0] + state.varname; 
            }
            doc.store(state.varname, data);
        };
        f._label = "storeDir;;" + linkname;

        state.handler = f;

    }
    
        

[other]() 

So the value can be in the options or as a pipe or from the start block. The
pipe comes first in precedence. 

    function (state) {

        var ln = state.linkname;
        var ind = ln.indexOf("|");
        if (ind !== -1) {
            state.varname = ln.slice(0, ind).trim();
            state.block = state.start;
            state.start = '';
            state.value = ln.slice(ind+1).trim();
        } else {
            state.varname = state.linkname;
        }

        if (state.options) {
            state.block = state.start;
            state.start = '';
            state.value = state.options;
        }
    }

### Transform

This is the directive for manipulating some text. The href hash tag has the
variable value to retrieve and then it gets sent into the pipes. The stuff
before the pipes is an options thing which is not currently used, but reserved
to be in line with other directives, available for the future, and just looks
a bit better (ha). If the link text contains a pipe with some text after it,
the final value after the pipes will be stored in the name given by the post
pipes in the link text.  

`[](#... ": ..|..")` or transform:

    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()

We store the important name in args.name. Note that this includes the pipes as
that may be the only distinguishing feature (see tests/store.md for example)

    function (state) {
        state.name = this.colon.escape(state.start + ":" + state.input);
        state.emitname =  "for transform:" + this.file + ":" + state.name;
    }


[handler factory]()


    function (state) {
        var doc = this;
        var gcd = doc.gcd;


        var f = function (data) {
            gcd.emit(state.emitname, data);
            var name = doc.getPostPipeName(state.linkname);
            if (name) {
                doc.store(name, data);
            }
        };
        f._label =  "transform;;" + state.name;
        
        state.handler = f;
    }


[other]()


    function (state) {
        var doc = this;
        var gcd = this.gcd;
        var name = state.name;
        var start = state.start;
        var emitname = state.emitname;

        gcd.emit("waiting for:transforming:" + name, 
            [emitname, name, doc.file, start]  );
    }



### Log

This is just a taste of what is possible, but this is a fairly simple taste so
we will implement it here. 

The log directive will take in a string and whenever an event matches that
string, it will log it and its data to the console. 

Form: `[string](# "log:")`

If the string has `\:` in it, then that will be replaced with the triple
colon. Regular colons are not escaped.

An alternate form is  `[](# "log:")`  which will instead listen for any
mention of the current block. Currently not scoped to listen to the file part
since this would catch other docs using that block name under their own
nickname for the file. 



    function (args) {
        
        var doc = this;
        var gcd = doc.gcd;

        var str = args.link;
        var i;
        while ( (i = str.indexOf("\\:") ) !== -1 )  {
            str = str.slice(0, i) + doc.colon.v + str.slice(i+2);
        }

        str = str || doc.colon.escape(args.cur);

        gcd.monitor(str, function (ev, data) {
            doc.log("EVENT: " + ev + " DATA: " + data);
        });

    }

 
### Load

This loads files into the folder and associates the nickname with it in the
local doc.

All docs that are already loading or loaded will be present in the
folder.docs object. If not, then we need to load it. We will also need to
check for the nickname already existing in scopes. If it does exist, we emit an
error and do not load the file. 

We use the folder colon escape for the url since that is global to folders
while the nickname is strictly internal and uses the local colon escape.
Somehow I get the feeling I have made a mess of this escape stuff; it should
not have been so flexible.

`[alias](url "load:options")`


    function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var folder = doc.parent;
        var url = (args.loadprefix || '') + args.href.trim();
        var options = args.input;
        var urlesc = folder.colon.escape(url);
        var nickname = doc.colon.escape(args.link.trim());
        
        gcd.scope(urlesc, options);

        if (nickname && (nickname !== urlesc) ) {
            doc.createLinkedScope(urlesc, nickname);
            _":load url"
        } else {
            _":load url"
        }

    }


[load url]()

This loads the url if needed. The file is loaded exactly once.

    if (!(folder.docs.hasOwnProperty(urlesc) ) ) {
        gcd.emit("waiting for:loading for:" + doc.file, 
            "need document:" + urlesc);
        gcd.emit("need document:" + urlesc, url );
    }

### Pipe

The href is a place to load from. The linkname is the place to send it. The
pipes transform the loaded information. 

#### Pipes

This takes in an href that points to a set of files to load and then sends
them to pipes and then outputs them per the link name which has some kind of
pattern matching. 

### cd

This changes the directory, either for save or load. 

Syntax `[prefix](#ignore "cd: load|save")` This sets a prefix for load or
save, depending. To clear, use the same command but with empty prefix.


    function (args) {
        var doc = this;
        var path = args.link.trim();
        var type = args.input.trim();
        if (type === "load") {
            doc.loadprefix = path;
        }
        if (type === "save") {
            doc.saveprefix = path;
        }
    }

### Define directive

This is where we can implement commands in a litpro doc. 

The syntax is `[name](#whatever "define: async/sync/raw |cmd ... ")` where the name
is the name of the command. Whatever is the section. If the section is not
defined, then the current one is used. Between the colon and the pipes is
async/sync/raw option to whether it gets wrapped in the convenience async sync
or just simply taken as is. The default is sync cause that's the easiest to
understand. 

Commands that are not known when asked for are waited for. 

The code block should return a function that expects `input, args, name` as an
input. 


    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()

    function (state) {
        state.emitname =  "cmddefine:" + state.linkname;
    }

[handler factory]() 

    function (state) {
        var doc = this;
        var gcd = this.gcd;
        var cmdname = doc.normalize(state.linkname);

        var han = function (block) {
            var f; 
            
            try {
                block = "f="+block;
                eval( block);
            } catch (e) {
                doc.gcd.emit("error:define:"+cmdname, [e, block]);
                doc.log(e.name + ":" + e.message +"\n" + block);
                return;
            }

            switch (state.options) {
                case "raw" :  f._label = cmdname;
                    doc.commands[cmdname] = f;
                break;
                case "async" : doc.commands[cmdname] = 
                    doc.wrapAsync(f, cmdname);
                break;
                case "defaults" : doc.commands[cmdname] = 
                    doc.wrapDefaults(f, cmdname);
                break;
                default : doc.commands[cmdname] = 
                    doc.wrapSync(f, cmdname);
            }

            gcd.emit("command defined:" + cmdname);
        };
        han._label = "cmd define;;" + cmdname;

        state.handler = han;

    }

[other]() 

    function (state) {
        var cmdname = state.linkname;

        var file = this.file;
        var gcd = this.gcd;

        gcd.emit("waiting for:command definition:" + cmdname, 
            ["command defined:"+cmdname, cmdname, file, state.start]  );

    }



[reporter]() 

Here we make the function that will give the report when a save does not
happen. This is very important. 

The args should `filename to save, section to wait for`. 

    function (args) {
        var name = this.recording[args[2]] || args[2];
        return "COMMAND NOT DEFINED: " + args[0] + " AS REQUESTED IN: " + args[1] + 
            "\nNEED: " + name;
    }

### subcommand directive

This defines a subcommand for a function or directly on the doc if href leads
to a blank command name.

    function (args) {
        var doc = this;

        var block = doc.blocks[args.cur];
        
        var subCommandName = args.link;

        var cmdName = args.href.trim().slice(1);
       
        var f; 
        
        try {
            block = "f="+block;
            eval( block);
        } catch (e) {
            doc.gcd.emit("error:subcommand define:"+subCommandName, [e, block]);
            doc.log(e.name + ":" + e.message +"\n" + block);
            return;
        } 

        doc.defSubCommand( subCommandName, f, cmdName); 
         
    }

### partial

This takes in a command and returns a new command that feeds in a given
argument.

The syntax is `[name](#start "partial: existingcmd, number | cmds")`

The name is the new command name, between the colon and pipe is the existing
command name and the argument slot to fill; the default is 0. 
The hashref and the commands are for creating the arguments. 

    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()

This can be the same as the define command as we are creating a new command.

    function (state) {
        state.emitname =  "cmddefine:" + state.linkname;
    }

[handler factory]() 

    function (state) {
        var cmdname = state.linkname;
        var doc = this;
        var gcd = this.gcd;

        var opts = state.options.split(",");
        var command = opts[0]; //old command
        var arg = (opts[1] ? parseInt(opts[1].trim(),10) : 0);
        var propcommand = false;

        var fun;   //closure

        var han = function (block) {
            if ( (command[0] === ".") && (command.length > 1) ) {
                fun = doc.commands["."];
                propcommand = command.slice(1);
            } else {
                fun = doc.commands[command];
            }

            if (fun) {
                _":run fun"
            } else {
                var lasthand = function () {
                    fun = doc.commands[command];
                    if (fun) {
                        _":run fun"
                    } else { // wait some more ? why
                        gcd.once("command defined:" + command, lasthand);
                    }
                };
                lasthand._label = "delayed command:" + command +
                    ":" + cmdname;
                gcd.once("command defined:" + command, lasthand);
            }
        };
        han._label = "cmd define;;" + cmdname;

        state.handler=han;

    }

[run fun]()

This is the bit that actually executes the partial function, once we have it. 

We slice the args array, concatenating the new value in with the old. 

    doc.commands[cmdname] = 
        function (input, args, name, command) {
            var doc = this;
            var newargs; 
            var push = Array.prototype.push;

            if (propcommand) {
                newargs = [propcommand];
             } else {
                newargs = [];
             }
             push.apply(newargs, args.slice(0, arg));
             newargs.push(block);
             push.apply(newargs, args.slice(arg));

            fun.call (doc, input, newargs, name, command); 
        };
    gcd.emit("command defined:" + cmdname);

    
[other]() 

This also seems reasonable to copy from the define. Not really sure what is
being done here. 

    function (state) {
        var cmdname = state.linkname;

        var file = this.file;
        var gcd = this.gcd;

        gcd.emit("waiting for:command definition:" + cmdname, 
            ["command defined:"+cmdname, cmdname, file, state.start]  );
    }





### compose

This takes existing commands and composes them. This is helpful if you want to
do the same sequence of commands repeatedly. 

`[cmd name](#unused "compose: cmd1, arg1, arg2 | cmd2, $2, arg2, @1...")`

So it is a sequence of commands separated by pipes. The `argi`'s fill in values
into the command. There is a special syntax of `$i` to refer to the command
argument of the composed command and `@i` to refer to temporarily shifting off an array in
the ith position. `@i...`  will fill in the rest of the arguments from the
array. Each array is "reset" between commands.  Probably best not to use the
shifting too much.

At least for now, this will be a fairly simple parsing algorithm. The
assumption is that the arguments are either simple text or the substitutions.
Will revisit later if need be. 

This uses `folder.compose` to create a function that actually works. 


    function (args) {
        var doc = this;
        var gcd = doc.gcd;
        
        var cmdname = args.link;
        _":setup cmd array"

        _":setup delayed command definition"
    }


[setup delayed command definition]()

This loops over the unique command names and sets up a .when to define this
command once all the other commands are defined. If all are defined, we define
it immediately. 

We do not check for the leader properties being defined since there is no way
to check for that at this point. 

    var fcmd = doc.file + ":" + cmdname;
    var compready = "composition ready:" + fcmd;
    var compcheck = "composition command checking:" + fcmd;
    var cmddefine = "command defined:" + cmdname;

    var define = function () {
        doc.commands[cmdname] =  doc.parent.compose.apply(null, cmds);
        gcd.emit(cmddefine);
    };

    gcd.once(compready, define);

    gcd.when(compcheck, compready);
   
    // get unique cmds
    var obj = {};        
    cmds.forEach(function (el) {
       obj[el[0]] = 1;
    });

    Object.keys(obj).forEach(function (el) {
        if (doc.leaders.indexOf(el[0]) !== -1 ) {
            return ;
        }
        if (!(doc.commands[el])) {
            gcd.when("command defined:" +  el, cmddefine);
        }
    });

    gcd.emit(compcheck);


[folder compose]()

This is takes in arrays of `arrs = [[cmd, arg1, ...],..]` and spits out a
function that will see those commands in sequence as a command function.

This is to be defined on the `Folder.prototype.compose`. 

    function () {
        var arrs = arguments;

        return function (input, cmdargs, name, cmdname ) {
            var doc = this;
            var colon = doc.colon;
            var gcd = doc.gcd;
            var done = "text ready:" + name; 
            
            var exec = _":executes command";

            var c = colon.v + cmdname + colon.v ;

            var i, n = arrs.length;
            for (i = 0; i < n-1 ;i += 1) {
                gcd.once("text ready:" + name + c + i, exec); 
            }
            // when all done, the last one is sent as the final bit
            gcd.once("text ready:" + name + c + (n-1), function (text) {
               gcd.emit(done, text); 
            }); 

            //start it
            exec(input, {pieces: [name+c+"-1"]});
        };

    }


[executes command]() 

This executes the command in the ith position by splitting on colon in the
emitname and taking the last bit.

This relies on closures: the `arrs` is the [cmd arg1], listing given at
definition time and the `cmdargs` are the arguments passed in at the invocation.

    function (data, evObj) {
        var bit = evObj.pieces[0];
        var pos = parseInt(bit.slice(bit.lastIndexOf(colon.v) + 1), 10)+1;
        var cmd = arrs[pos][0];
        var args = arrs[pos].slice(1);

        _":deal with special commands"

        _":modify args"


        doc.cmdworker(cmd, data, args, name + c + pos);

    }
    
[modify args]() 

This is the bit that enables the substituting behavior. Anything of the form
`$i` is a direct substitution from the passed in arguments. `@i` leads to
inserting the array, a bit at a time unless it is at the end, in which case
unused ones get spread into it, e.g., `a, @0, b, $1, @0` leads to, if `@0 = [1, 2,
3]`, to  `a, 1, b, [1, 2, 3], 2, 3`. If we had `a, @0, b` then it would be
just `a, 1, b`.  Extra dollar signs or at signs reduce by 1, i.e., cheap
collapse. 

arrtracker will track what the arrays might be.


This also replaces `\n` with the new line. May want to think about expanding
this, but this deals with what I need right now. I could, for example, do an
eval, quoting the object, to get JS's default sub behavior. 

    var arrtracker = {}; 
    var ds = /^([$]+)(\d+)$/;
    var at = /^([@]+)(\d+)$/;
    var nl = /\\n/g; // new line replacement
    var n = args.length;
    var subnum;
    var i, el; 
    
    var noloopfun = function (args) {
        return function (el) {
            args.push(el);
        };
    };

    
    for (i = 0; i < n; i +=1 ) {
        el = args[i] =  args[i].replace(nl, '\n'); 
        var match = el.match(ds);
        var num;
        if (match) {
            if (match[1].length > 1) { //escaped
                args[i] = el.slice(1);
                continue;
            } else {
                num = parseInt(match[2], 10);
                args[i] = cmdargs[num];
                continue;
            }
        }
        match = el.match(at);
        if (match) {
            if (match[1].length > 1) { //escaped
                args[i] = el.slice(1); 
                continue;
            } else {
                num = parseInt(match[2], 10);
                if (arrtracker.hasOwnProperty(num)) {
                    subnum = arrtracker[num] += 1;
                } else {
                    subnum = arrtracker[num] = 0;
                }

To deal with spreading operator, we need to for the index being the last one
in the array. If it is we slice and foreach it into the args   

                if (i === (n-1)) {
                    args.pop(); // get rid of last one
                    cmdargs[num].slice(subnum).forEach(
                        noloopfun(args));
                } else {
                    args[i] = cmdargs[num][subnum];
                }
            }
        }
    }

    

[setup cmd array]() 

This splits on pipes and commas, trimming.



    var cmds = args.input.split("|").map(function (el) {
        var arr = el.split(",").map(function(arg) {
            arg = arg.trim();
            return arg;
        });

The command and first argument potentially are still together. Separate on
first space. 

        var ind = arr[0].indexOf(" ");
        if (ind !== -1) {
            arr.unshift(arr[0].slice(0, ind).trim());
            arr[1] = arr[1].slice(ind).trim();
        }
        return arr;
    });
    
[deal with special commands]()

Here we want to implement a couple of custom commands that are useful in
composing: blank which is just ignored (seems to be common for me to have a
couple of pipes in a row), `->$i` which puts the input into the ith argument,
`$i->` which replaces the input with the argument in `i`. And similarly with
the @ symbol for an array for storage. The `$i` suffices for retrieving the
array. 

    var m, a;
    if (cmd === '') {
        gcd.emit("text ready:" + name + c + pos, data);
        return;

    // store into ith arg    
    } else if ( (m = cmd.match(/^\-\>\$(\d+)$/) ) ) {
        cmdargs[parseInt(m[1], 10)] = data; 
        gcd.emit("text ready:" + name + c + pos, data);
        return;

    // retrieve from ith arg
    } else if ( (m = cmd.match(/^\$(\d+)\-\>$/) ) ) {
        gcd.emit("text ready:" + name + c + pos, 
            cmdargs[parseInt(m[1], 10)]);
        return;

    } else if ( (m = cmd.match(/^\-\>\@(\d+)$/) ) ) {
        a = cmdargs[parseInt(m[1], 10)];
        if (Array.isArray(a)) {
            a.push(data);
        } else {
            cmdargs[parseInt(m[1], 10)] = 
                doc.augment([data], "arr");
        }
        gcd.emit("text ready:" + name + c + pos, data);
        return;
    }



### eval

Run any code you like. Now. 

The syntax is `[name](# "eval:)`  This will evaluate the code in the current
block. That's it. Nothing fancy. This gives immediate access to evaling. If
you need somthing involving other blocks, use the command eval and pipe in
input. It has access to doc due to scope of eval. This leads to whatever one
might need access to but keep in mind that it is being evaled during the
marked parsing stage. If there is a pipe in the link text, then the `ret`
variable will lead to its value being stored under the name post pipe in the
link text. The name to save under is also accessible under storageName. 


    function (args) {
        var doc = this;

        var block = doc.blocks[args.cur];
        
        var storageName = doc.getPostPipeName(args.link);
        var ret = '';
        
        try {
            eval(block);
            if (storageName) {
                doc.store(storageName, ret);
            }
        } catch (e) {
            doc.gcd.emit("error:dir eval:", [e, block]);
            doc.log(e.name + ":" + e.message +"\n" + block);
            return;
        }
        
    }



### Block

This is a directive that turns on or off the code blocks being registered.
Directives and headings are still active. 

This turns block concatenation back on. Note that the number of on's must be
the same as those off's. That is two offs will require two ons before code is
being compiled. Extra ons are ignored. 


    function (args) {
        var doc = this;
        
        if (args.link === "off") {
            doc.blockOff += 1;
        } else if (args.link === "on") {
            if (doc.blockOff > 0 ) {
                doc.blockOff -= 1;
            }
        } else {
            doc.log("block directive found, but the toggle was not understood: " + 
                args.link + "  It should be either on or off");
        }

    }



### Ignore language

This is to add the languages to ignore when compiling. Not going to code up a
listen to language one. 

The idea is that if you want pretty formatting from code fences, but don't
want the code compiled, then we can do that with this. So we could have code
fenced code with `js` as the compile path and `javascript` as the noncompiled
example code. 

    function (args) {
        var lang = args.link;

        var doc = this;
        var gcd = doc.gcd;

        gcd.on("code block found:" + lang, "ignore code block");

    }

### if

The directive if checks for the flag and then calls the directive being
referenced if need be. 

    function (args) {
        
        var doc = this;
        var folder = doc.parent;
        
        var title = args.input;
        var ind = title.indexOf(";");
        var flag = title.slice(0, ind).trim();
        var directive, semi, fun;
        
        if (folder.flags.hasOwnProperty(flag) ) {
            semi = title.indexOf(":", ind);
            directive = title.slice(ind+1, semi).trim();
            args.directive = directive;
            args.input = title.slice(semi+1).trim();

            if (directive && (fun = doc.directives[directive] ) ) {
                fun.call(doc, args);
            }
        }
    }

### flag

This sets the flag on the folder which is `this.parent`.

`[flag name](# "flag:")`

    function (args) {
        this.parent.flags[args.link.trim()] = true;

    }

### Push

This is to add some text to a variable. It should only be used within a single
document; multi-documents should use add locally and grab those exports more
methodically. 

The idea is that we have a directive of the form `[doc variable](#start "push: | ...")`

It will then add a gcd.when named to `push:file:doc variable` and it will emit
when ready an add ready event. This will generate the doc variable as an
appended list in the order of appearance in the document.

The motivation is to deal with putting in pieces of functionality into the
code in a more distributed way in the compiled form while keeping it tightly
localized. For example, in this document, we attach a basic function in the
prototype for Folder. Then we might use that to initialize something in the
doc. All of that seems best suited to be placed with the code itself. In
particular, knowing what the function's name is can be useful. The starting
prototype could be placed in the code as is, but the follow up setup is
trickier.

It generates an array which then needs to be assembled into text. For example,
if one was pushing onto `awesome`, then we could use `_"awesome| . join \,,"` 
okay that sucks. 

The href hash tag has the variable value to retrieve and then it gets sent
into the pipes. The stuff before the pipes is an options thing which is not
currently used, but reserved to be in line with other directives, available
for the future, and just looks a bit better (ha). The link text is a variable
name to store. 


    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()

We store the important name in state.name. Note that this includes the pipes as
that may be the only distinguishing feature (see tests/store.md for example)

    function (state) {
        var doc = this;
        
        var ln = state.linkname;
        var ind = ln.indexOf("|");
        if (ind !== -1) {
            state.varname = ln.slice(0, ind).trim();
            state.block = state.start;
            state.start = '';
            state.value = ln.slice(ind+1).trim();
        } else {
            state.varname = state.linkname;
        }
        
        state.name = doc.colon.escape(state.linkname + ":"  + 
            state.start + ":" + state.input);
        state.emitname =  "for push:" + doc.file + ":" + state.name;
        state.donename =  "push bit:" + doc.file + ":" + state.name;
        state.goname =  "push ready:" + doc.file + ":" + state.varname;
    }


[handler factory]()


    function (state) {
        var doc = this;
        var gcd = doc.gcd;


        var f = function (data) {
            gcd.emit(state.donename, data);
        };
        f._label =  "push;;" + state.name;
        
        state.handler = f;
    }


[other]()

This sets up the when waiting.  

    function (state) {
        var doc = this;
        var gcd = this.gcd;
        var name = state.name;
        var start = state.start;
        var emitname = state.emitname;

        gcd.emit("waiting for:push bit:" + name, 
            [emitname, name, doc.file, start]  );
        gcd.flatWhen(state.donename, state.goname ); 
    }

[action]()

This responds to push events and stores the value. 

    push ready --> finish push

    var name = evObj.pieces[0];
    var file = evObj.pieces[1]; 
    var doc = gcd.parent.docs[file];

    if (! Array.isArray(data) ) {
        data = [data];
    }
    data = doc.augment(data, "arr");


    if (doc) {
        doc.store(name, data);
    } else {
        gcd.emit("error:impossible:action push", 
            [data, evObj.pieces]);
    }

### h5

This will listen for certain h5 headings and do a push of them onto a
variable. 

`[var name](#heading "h5: off / full |pipe stuff")`

We do a closure around the heading we are looking for. We need an exact match
(case insensitive, trimmed) after transforming the href `#this-has-dashes` to
`this has dashes`. Then we can obtain the full path and we define a
gcd.when for it (the event name could be helpful).  

We can also do pipe stuff that will act after everything is assembled. This
could be used for a little common data formatting. 

We also have the option of having an off option. If that is placed, then we
emit an off event with the heading. This is so that we could scope the h5
headers.

If href is empty, then we use the var name.

This returns an array from the .when which is by default flattened. 

    function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;

        var heading = args.href.slice(1); 
        heading = doc.convertHeading(heading.replace(/-/g, ' '));

        if (! heading ) {
            heading = args.link;
        }
       
        var temp = doc.midPipes(args.input);
        var options = temp[0]; 

        if (options === "off") { 
            gcd.emit("h5 off:" + colon.escape(heading));
            return;
        }
        
        var pipes = temp[1];

To ensure that the array is an augmented array, we inject a command here

        pipes = "augment arr" + (pipes ? " |" + pipes : "");

        var name = colon.escape(args.link);
        var whendone = "text ready:" + doc.file + ":" + name + colon.v  + "sp" ;

        doc.pipeDirSetup(pipes, doc.file + ":" + name, _":whendone", doc.curname ); 
        var seenAlready =[]; 
        var handler = gcd.on("heading found:5:" + doc.file , _":found");

        gcd.once("h5 off:" + colon.escape(heading), function () {
            gcd.off("heading found:5:" + doc.file, handler);
        });

        if (options === "full") {
            gcd.when("parsing done:" + doc.file, whendone).silence();  
        } else {
            gcd.flatWhen("parsing done:" + doc.file, whendone).silence();  
        }

        

    }

[found]() 

We are assuming all is within one file. So we can use the doc and file and gcd
as closures. 

    function (data ) {
       
        var found = doc.convertHeading(data);
        var full; 

        if (found === heading) {
            full = colon.escape(doc.levels[0]+'/'+found);
            if (seenAlready.indexOf(full) === -1) { 
                gcd.when("text ready:" + doc.file + ":" + full, whendone); 
                seenAlready.push(full);
            }
        }
    }

[whendone]()

This executes when all the variables headings we have listened to have been
computed.

This largely will return a text ready if there are no pipes, but we also have
the option of pipes.

    function (data) {

        doc.store(name, data);
    }    


### Version

This gives the name and version of the program. 

`[name](# "version: ")`

    function (args) {
        var doc = this;
        var colon = doc.colon;

        var ind = args.input.indexOf(";");
        if (ind === -1) { ind = args.input.length +1; }

        doc.store(colon.escape("g::docname"), 
            args.link.trim());
        doc.store(colon.escape("g::docversion"),
            args.input.slice(0, ind).trim());
        doc.store(colon.escape("g::tagline"), 
            (args.input.slice(ind+1).trim() || "Tagline needed" ) );

    }

### npminfo

This takes in a string for npm files and store the values in global variables.

`[author name](github/gituser "npminfo: author email; deps: ; dev: " )`

    function self (args) {
        var doc = this;
        var g = "g" + doc.colon.v + doc.colon.v;

        var types = doc.plugins.npminfo;

        doc.store(g+"authorname", args.link);

        var gituser = args.href.slice(args.href.lastIndexOf("/")+1).trim();
        doc.store(g+"gituser", gituser);

        var pieces = args.input.split(";");

        doc.store(g + "authoremail", (pieces.shift() || '').trim());
      
        pieces.forEach(function (el) {
            if (!el) {return;}

            var ret = [];
            
            var ind = el.indexOf(":");
            var prekind = el.slice(0, ind).trim();
            var kind = types[prekind];
            if (!kind) { 
                doc.log("unrecognized type in npminfo:" + prekind );
                return;
            }
            var entries = el.slice(ind+1).split(",");
            entries.forEach(function(el) {
                if (!el) {return;}
                var bits = kind.element(el);
                if (bits) {
                    ret.push(bits);
                }
            });
            doc.store(g +  kind.save, kind.val(ret) );
        });

        doc.store(g + "year", ( new Date() ).getFullYear().toString() );
    }

[standard]()

This is to give a function that handles what the dependency string should be.  
 
    function (str) {
        var pieces;
        
        if (str) {
            pieces = str.trim().split(/\s+/);
            if (pieces.length === 2) {
                return '"' + pieces[0].trim() + '"' + " : " + '"^' + 
                    pieces[1].trim() + '"';
            } 
        }
    }

[deps]()

    {   val : function (arr) {return arr.join(",\n");},
        element : _":standard",
        save : "npm dependencies" 
    }

[dev]()

    {   val : function (arr) {return arr.join(",\n");},
        element : _":standard",
        save : "npm dev dependencies"
    }

[types]() 

    { 
        deps : _":deps",
        dev : _":dev"
    }


