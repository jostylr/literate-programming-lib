# [literate-programming-lib](# "version:1.5.3; A literate programming compiler. Write your program in markdown. This is the core library and does not know about files.")

This creates the core of the literate-programming system. It is a stand-alone
module that can be used on its own or with plugins. It can run in node or the
browser via browserify.

The basic idea is that the text is fed to it already and then it parses it. It
is event based and so to have it do something, one has to connect up the
events. 

A literate program is a series of chunks of explanatory text and code blocks
that get woven together. The compilation of a literate program can grunt,
after a fashion, as it weaves. 


## Directory structure

* [index.js](#structure-of-the-module "save:  | jshint ") This is the
  compiler.
* [test.js](#tests "save: | jshint") The test runner.
* [lprc.js](#lprc "save:|jshint") The litpro config file. 
* [README.md](#readme "save:| raw ## README, !---- | sub \n\ #, \n# |trim ") The standard README.
* [package.json](#npm-package "save: | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: |raw ## TODO, !----") A list of growing and shrinking items todo.
* [LICENSE-MIT](#license-mit "save:") The MIT license as I think that is the standard in the node community. 
* [.npmignore](#npmignore "save: ")
* [.gitignore](#gitignore "save: ")
* [.travis.yml](#travis "save: ")

## The event nature of this program

We use the [event-when module](https://github.com/jostylr/event-wheni)
to provide a flow-control based on events. As
each code block compiles, it issues an event that it is done. Anything
listening for it, then acts.

The emitter is a part of the document object. 

## Break with previous versions

This is a complete rewrite. The syntax is simplified so that only the ``_`code
block| function | functionn` `` syntax is needed. Leave off the code block to
just start using functions (leave the pipe). The code block in that syntax
need not be a code block, but could be a user-defined variable name,

Another break in the syntax is the switch link. This was a link that was on a
line by itself. It was a kind of heading, one that would make a quick separate
code block under the same heading. I find it convenient. But in trying to
match the general parsing of markdown programs, I am moving towards using a
professional markdown parser that would make it difficult to recognize the
positioning of a link, but trivial to parse one.  So the switch link will be a
link whose title quote starts with a colon. So an empty directive. It can
still be positioned as always.  Also can implement it so that if the
parenthetical is completely empty, then that is a switch. I noticed that that
is what I often do. 

For header purposes, a link's square bracket portion will be returned to the
surrounding block.

Also headers will have a way to be modified based on their levels. 
I have never used levels 5 and 6, for example.
As an example, one could have level 5 headers for tests, docs, and examples,
that could then be compiled and run bey selecting those headers.  Not sure yet. 

Also, there is no tracking of the non-significant text. So for example, raw
will not work in the same way. It was always a bit of a hack and now it will
be more so. There can be easily a plugin that will search for the heading and
cut the rest, etc.

Multiple substitue cycles are no longer supported. I always found it hard to
reason about it and it greatly simplifies the code. If you need that
functionality, it probably is workable with substitues and the variable
storage introduced. 

The compiled blocks are stored as variables. We can store arbitrary variable
names and so potentially can conflict with block names. You have been warned.
It is all "global" scope though you can use syntax to kind of scope it. Well,
actually we are scoped to the documents, that is `docname::..` gives another
scope which the var setting respects. 

Another break is that block names need to match. There is the main block which
has no minor associated with it and then there are the minors of the block. If
you want the minor commands on the main, then start the code line with `[](#
":|...")` where the colon is there to indicate a minor directive, but with no
name and no extension, this will signal the main block. Note that this will
overwrite whatever was in the main code block, if anything. Once a block
(minor or not) is switched from, it cannot be added to later. Trust me, this
is a good thing. 

## Structure of the module

This is where we outline the structure of the compile document. Essentially,
it is the module boilerplate setup, importing marked and event-when, and
exporting the Document constructor. You can pass in a string and an array of
event assignments to initialize or one can do that after the initialization.
If you pass in stuff, the compilation will begin then. If you add all of that
later, then you have to start the compilation by emitting a "ready to
compile".

By default, there are no methods for reading or writing out the results. It is
the responsible of the caller to pass handlers to accomplish that.

At the top of the heirarchy is a group of documents. This includes an event
emitter.

The Folder constructor creates folder instances that contain all the relevant
sibling literate program documents. The commands and directives are stored in
an object on Folder that are then used as prototypes for the folder instances.
Each doc within a folder shares all the directives and commands. 


    /*global require, module */
    /*jslint evil:true*/

    var EvW = require('event-when');
    var commonmark = require('commonmark');
    require('string.fromcodepoint');
   

    var apply = _"apply";


    var Folder = _"folder constructor";

    Folder.prototype.parse = _"commonmark";

    Folder.prototype.newdoc = _"Make a new document";

    Folder.prototype.colon = _"colon";

    Folder.prototype.createScope = _"Create global scope";

    Folder.prototype.join = "\n";

    Folder.prototype.log = function (text) { console.log(text); };

    Folder.prototype.indicator = "\u2AF6\u2AF6\u2AF6";
    
    var sync  = Folder.prototype.wrapSync = _"Command wrapper sync";
    Folder.sync = function (name, fun) {
        Folder.commands[name] = sync(name, fun);
    };

    var async = Folder.prototype.wrapAsync = _"Command wrapper async";
    Folder.async = function (name, fun) {
        Folder.commands[name] = async(name, fun);
    };

    var dirFactory = Folder.prototype.dirFactory = _"dir factory";

    // communication between folders, say for caching read in files
    Folder.fcd = new EvW(); 


    Folder.prototype.subnameTransform = _"Subname Transform";

    Folder.postInit = function () {}; //a hook for plugin this modification
    Folder.plugins = {};
    Folder.plugins.npminfo = _"dir npminfo:types";

    Folder.reporters = {
        save : _"save:reporter",
        out : _"out:reporter",
        "command defined" : _"define directive:reporter",
        "scope exists" : _"create global scope:reporter",
        "text" : _"text reporter",
        "minor" : _"text reporter",
        "retrieval" : _"retrieval reporter",
        "cmd" : _"command reporter"
    
    };


    Folder.prototype.reportwaits = _"reporting on waiting";

    Folder.commands = _"Commands";
    
    Folder.directives = _"Directives";



    var Doc = Folder.prototype.Doc = _"doc constructor";

    _"doc constructor:prototype"
 
    module.exports = Folder;


## folder constructor
This is the container that contains a bunch of related docs if need be and
allows them to communicate to each other if need be. It is also where
something like the read and write methods can be defined. It is likely only
one will be used but in case there is a need for something else, we can do
this.

Some things such as how to take in input and put out output are needed to be
added. The internal basic compiling is baked in though it can be overwritten.

We have a default scope called `g` for global.

    function (actions) {
        actions = actions || Folder.actions;

        var gcd = this.gcd = new EvW();
        this.docs = {};
        this.scopes = { g:{} };
        
        this.commands = Object.create(Folder.commands);
        this.directives = Object.create(Folder.directives);
        this.reports = {};
        this.recording = {};
        this.stack = {};
        this.reporters = Folder.reporters;
        this.plugins = Object.create(Folder.plugins);
        this.flags = {};
        this.Folder = Folder;

        _":done when"
        
        this.maker = _"maker";

        gcd.parent = this;

        _":handlers"

        if (actions) {
            apply(gcd, actions);
        }

        Folder.postInit(this);

        return this;
    }


[handlers]()

These are the handler actions common to much. Note that some handlers are
defined in the code and are difficult to overwrite. This was done for
closure's sake and ease. Perhaps it will get revised. 


    _"Action compiling block | oa"

    _"Action for argument finishing | oa"

    _"Parsing events:heading | oa"

    _"Parsing events:heading 5| oa"

    _"Parsing events:heading 6| oa"

    _"Parsing events:switch| oa"

    _"Parsing events:code | oa"

    _"Parsing events:code ignore | oa"

    _"Parsing events:directive | oa"

    _"Ready to start compiling blocks |oa"
    
    _"what is waiting| oa"


[done when]()

This creates the done object which is needed for done and when commands. 

    this.done = {
        gcd : new EvW(),
        cache : {}
    };
    this.done.gcd.action("done", _"cmd done:action", this);

## Doc constructor

This is the constructor which creates the doc structures. 

The emitter is shared within a folder, each document is scoped using its
filename location. The doc structure is just a holding object with none of its
own methods. 

To have event/action flows different than standard, one can write scoped
listeners and then set `evObj.stop = true` to prevent the propagation upwards.


    function (file, text, parent, actions) {
        this.parent = parent;
        var gcd = this.gcd = parent.gcd;

        this.file = file; // globally unique name for this doc

        parent.docs[file] = this;

        this.text = text;

        this.blockOff = 0;
        
        this.levels = {};
        this.blocks = {'' : ''}; //an empty initial block in case of headless
        this.heading = this.curname = '';
        this.levels[0] = text;
        this.levels[1] = '';
        this.levels[2] = '';

        
        this.vars = parent.createScope(file);

        this.commands = parent.commands;
        this.directives = parent.directives;
        this.maker = Object.create(parent.maker);
        this.colon = Object.create(parent.colon); 
        this.join = parent.join;
        this.log = this.parent.log;
        this.scopes = this.parent.scopes;
        this.subnameTransform = this.parent.subnameTransform;
        this.indicator = this.parent.indicator;
        this.wrapAsync = parent.wrapAsync;
        this.wrapSync = parent.wrapSync;
        this.dirFactory = parent.dirFactory;
        this.plugins = Object.create(parent.plugins);
    
        if (actions) {
            apply(gcd, actions);
        }

        return this;

    }


[prototype]()

    var dp = Doc.prototype;

    dp.retrieve = _"variable retrieval";

    dp.getScope = _"get scope";

    dp.createLinkedScope = _"create linked scope";
     
    dp.indent = _"indent";

    dp.getIndent = _"Figure out indent";

    dp.blockCompiling = _"block compiling";
    
    dp.substituteParsing = _"Substitute parsing";

    dp.pipeParsing = _"Parsing commands";

    dp.regexs = _"Command regexs";

    dp.backslash = _"Backslash";

    dp.whitespaceEscape = _"whitespace escape";

    dp.store = _"Store";

    dp.getBlock = _"Doc block";

    dp.stripSwitch = _"strip switch";

    dp.midPipes = _"Middle of pipes";

    dp.pipeDirSetup = _"Pipe processing for directives";




### Example of folder constructor use

This is an example that roughly sketches out what to pass in to constructor
and hten what to do.

    folder = new Folder({
        "on" : [ 
            ["need document", "fetch document"],
            ["document fetched", "compile document"],
            ["file compiled, "write file"]
           ],
        "action" : [
            ["fetch document", function (file, evObj) {
                var gcd = evObj.emitter;
                 readfile(file, function (err, text) {
                    if (err) {
                        gcd.emit("document fetching failed:"+file, err);
                    } else {
                        gcd.parent[file] = text;
                        gcd.emit("document fetched:"+file);
                    }
               });
           ],
           ["compile document", function (text, evObj) {
              var gcd = evObj.emitter;
              var filename = evObj.pieces[0];
              var doc folder.docs[filename] = new Doc(text);
              gcd.emit("need parsing:"+filename);
           }];
        ]
        .....
    });
    
    folder.gcd.emit("need document", filename);

### parsing events

These are common events that need to be loaded to the emitter. These are the
ones that assemble the literate programs. 


[heading vars]()

This is just an intro that seems commonly needed.
 
    var file = evObj.pieces[0];
    var doc = gcd.parent.docs[file];

[init block]()

I am separating out this one line since I may want to revise it. We have the
option of concatenating what is already there or overwriting. While I think it
is best form not to have the same block name twice and concatenating it up,
there may be use cases for it and this might also help track down accidental
double blocking (you get the code of both blocks to search for!).

    doc.blocks[curname] = doc.blocks[curname] || '';


[heading]()

Headings create blocks. For heading levels 1-4, they create new blocks on an
equal footing. For heading leavels 5,6, they create relative blocks using
slashes from the currently selected block (a directive could be used to switch
current block?) Level 6 is relative to level 5 and the level above so
something like `great code/test/particular` from a 3, 5, 6 combo. 

The headings are there to start code blocks. The code blocks concatenate into
whatever is there. 

We use doc.levels to navigate 

    heading found --> add block
    _":heading vars"
    var text = data.trim().toLowerCase();
    var curname = doc.heading = doc.curname = text;
    doc.levels[0] = text;
    doc.levels[1] = '';
    doc.levels[2] = '';
    _":init block"

[heading 5]()

The 5 level is one level below current heading. We stop the event propagation.


    heading found:5 --> add slashed block 
    _":heading vars"
    var text = data.trim().toLowerCase();
    doc.levels[1] = text;
    doc.levels[2] = '';
    var curname = doc.heading = doc.curname = doc.levels[0]+'/'+text;
    _":init block"
    evObj.stop = true;


[heading 6]()

The 6 level is one level below current heading. We stop the event propagation.


    heading found:6 --> add double slashed block 
    _":heading vars"
    var text = data.trim().toLowerCase();
    doc.levels[2] = text;
    var curname = doc.heading = doc.curname = doc.levels[0]+'/'+doc.levels[1]+'/'+text;
    _":init block"
    evObj.stop = true;

[switch]()

Whenever a minor block directive is found, this is used.

It uses the doc.heading as the base, appending a colonated heading stored in
the current name. Note the colon is a triple colon. All variable recalls will
have colons transformed into triple colons. This is stored in colon.v for
global overriding if need be. 

Switches can execute stuff on the compiled block. To signify when done, we
emit gcd.emit("text ready:"+ curname). But within the block compiling, we will
emit a text ready:minor:... which we should listen for here. 

Note that for piping of minors, there could be a problem if those listening
for the text then call something else wanting it; there could be a gap from
when the text ready event is fired and the storage happens. It won't happen
unless piping is going on. And the risk seems low. Let me know if it is a
problem. 

    switch found  --> create minor block
    _":heading vars"
    var colon = doc.colon;
    var text = data[0].trim().toLowerCase();

    var curname = doc.curname = doc.heading+colon.v+text;
    _":init block"


    var title = data[1];
    var fname = evObj.pieces[0] + ":" + curname;
    var pipename;
    if (title) { // need piping
        title = title.trim()+'"';
        pipename = fname + colon.v + "sp";
        doc.pipeParsing(title, 0, '"' , pipename);
        
        gcd.once("minor ready:" + fname, 
            doc.maker['emit text ready'](doc, pipename + colon.v + "0" ));
        gcd.once("text ready:" + pipename, 
            doc.maker.store(doc, curname, fname));
    } else { //just go
        gcd.once("minor ready:" + fname, 
            doc.maker['store emit'](doc, curname, fname));
    }


[code]()

Code blocks are concatenated into the current one. The language is ignored for
this.

If no language is provided, we just call it none. Hopefully there is no
language called none?! 

We join them by adding doc.join character; this is default a newline.

Note: doc.blockOff allows us to stop compiling the blocks. This is a hack. I
tried to manipulate the action, but somehow that did not work. Anyway, this
will be scoped to the doc so that's good. 

    code block found --> add code block
    _":heading vars"
    if (doc.blockOff > 0) { return;}
    if (doc.blocks[doc.curname]) {  
        doc.blocks[doc.curname] +=  doc.join + data;
    } else {
        doc.blocks[doc.curname] = data;
    }


[code ignore]()

If you want to have code that gets ignored, you can use code fences with a
language of `ignore`. We do nothing other than stop the event propagation. 

The downside is that we loose the highlight. One can provide other events in
plugins the could ignore other languages. For example, if you are coding in
javascript, you could have javascript being ignored while js not being
ignored. Or you could just put the code in its own block. 

    code block found:ignore --> ignore code block
    evObj.stop = true;


[directive]() 

Here we deal with directives. A directive can do a variety of things and it is
not at all clear what can be done in general to help the process. Note that
directives, unlike switches, are not parsed for pipes or anything after the
colon is touched. 

You can also stop this generic handling by listening for a specific directive
and stopping the propagation with evObj.stop = true.

This really just converts from event handling to function calling. Probably a
bit easier for others to handle. 


    directive found --> process directives
    _":heading vars"
    var fun;
    var directive = evObj.pieces[1];
    if (directive && (fun = doc.directives[directive] ) ) {
        fun.call(doc, data);
    }





## Event playbook

!Be skeptical of the following.

So this is a quick sketch of the kinds of events and actions that get taken in
the course of compiling. A tilder means it is not literal but rather a
variable name. 

* Document compiling starts with a `need parsing:~filename, text`


* `text ready` is for when a text is ready for being used. Each level of use
  had a name and when the text is ready it gets emitted. The emitted data
  should either by text itself or a .when wrapped up [[ev, data]] setup.  

* filename:blockname;loc;comnum;argnum(;comnum;argnum...)


## What is waiting

This is where we define the waiting function. It takes in a message to report
for whatever is interested in checking (maybe the end of a process or in a web
page, a user clicking on a report -- difficult since the compilation phase
never officially ends). It also takes in an array that should be of the form
`[event for removal, type of reporter, args for reporters...]`

`waiting for:type:file:name, [evt, reportname, args to report` 


    waiting for --> wait reporting
     
    var reports = gcd.parent.reports; 

    var evt = data[0];
    var msg = evObj.pieces.slice(0,-1).reverse().join(":");


    reports[msg] = data.slice(1);
    gcd.once(evt, function () {
        delete reports[msg];
    });



### Reporting on waiting

This is a folder level function that goes through and reports on everything,
returning an array of waiting arguments. 

    function () {
        var report = this.reports;
        var reporters = this.reporters;
        var arr, msg, data, temp;

        arr = [];
        
        for (msg in report) {
            data = report[msg];
            if (reporters.hasOwnProperty(data[0]) ) {
                temp = reporters[data[0]].call(this, data.slice(1) );
                if (temp) {
                    arr.push(temp);
                } else { 
                   // console.log(msg, data);
                }
            }
        }

        return arr; 
    }


### Text Reporter

This function deals with text that we are waiting for. 

    function (data) {
        var hint = this.recording[data[0]];
        var parts = data[0].split(":").reverse();
        var block = parts[0].split(this.colon.v)[0];
        if (hint) {
            return "PROBLEM WITH: " + hint + " IN: " + block + 
                " FIlE: " + parts[1]; 
        } 

    }

### Retrieval Reporter

This function deal with waiting for a variable to be stored. 

    function (data) {
        return "NEED VAR: " + data[1] + " FROM: " + data[0];
    }

### Command Reporter

This reports on somebody waiting for a command. 
    
    function (data) {
        var ind = data[1].lastIndexOf(this.colon.v);
        if (ind === -1) {
            ind = data[1].length;
        }
        var name = data[1].slice(0, ind);
        var hint = this.recording[name];
        return "NEED COMMAND: " + data[0] + " FOR: " + hint; 
    }

## colon

This is about the colon stuff. Colons are used in event-when for separating
events; this is convenient. But colons are also used for minor blocks as well
as present in protocols and what not. So if we use those unescaped, then the
colons will create separate events. This is not good. So we escape colons to
triple colons which hopefully is visible to most as a triple colon. Don't know
of any use of them so that should be good too. 

This defines the colon which we use internally. To escape the colon or
unescape, we define methods and export them. 


    {   v : "\u2AF6",
        escape : function (text) {
             return text.replace(/:/g,  "\u2AF6");
        },
        restore : function (text) {
            return text.replace( /[\u2AF6]/g, ":");
        }
    }

## Make a new document 

This takes in a file name, text, and possibly some more event/handler actions. 

    function (name, text, actions) {
        var parent = this;

        var doc = new parent.Doc(name, text, parent, actions);
        
        try {
            parent.parse(doc);
        } catch (e) {
            doc.log("Markdown parsing error. Last heading seen: " + 
                doc.curname);       
        }

        return doc;

    }


[junk]() 



##  commonmark

Here we implement the markdown parser. We use commonmark and it generates an
AST which we can then do whatever we like with it. Our purposes are purely
informational and we extract headers, links, and code blocks. 

    function (doc) {
        var gcd = doc.gcd;
        var file = doc.file;

        gcd.when("marked done:"+file, "parsing done:"+file);

        gcd.on("parsing done:"+file, function () {
            doc.parsed = true;
        });

        
        var reader = new commonmark.Parser();
        var parsed = reader.parse(doc.text); 

        var walker = parsed.walker();
        var event, node, entering, htext = false, ltext = false, lang, code;
        var ind, pipes, middle, title, href, directive; //for links

        while ((event = walker.next())) {
            node = event.node;
            entering = event.entering;

            _":walk the tree"

           // console.log(node.type, node.literal || '', node.destination|| '', node.title|| '', node.info|| '', node.level|| '', node.sourcepos, event.entering);
        }

        gcd.emit("marked done:" + file);
    }


[walk the tree]() 

So we examine the nodes and decide when to do something of interest. The nodes
of interest are of type Header, Link, Text, and CodeBlock. CodeBlock is easy
as the literal is all we need. Both Header and Link require us to descend and
string together the text. 


    switch (node.type) {
    case "Text" : 
        _":text"
    break;
    case "Link" : 
        _":link"
    break;
    case "CodeBlock" :
        _":code"
    break;
    case "Header" :
        _":heading"
    break;
    }
    

[text]() 

This simply adds the text to an array if the array is there. We have header
text and link text. Since links may be in headers, we have two separate text
trackers. 

    if (htext) {
        htext.push(node.literal);
    }
    if (ltext) {
        ltext.push(node.literal);
    }

[heading]()

Headings create blocks. We emit an event to say we found one. We collect the
text as we go with the text and then join them when ready. 

    if (entering) {
        htext = [];
    } else {
        gcd.emit("heading found:"+node.level+":"+file, htext.join(""));
        htext = false;
    }
    
[code]()

We emit found code blocks with optional language. These should be stored and
concatenated as need be. 

    lang = node.info;
    code = node.literal || '';
    if (code[code.length -1] === "\n") {
        code = code.slice(0,-1);
    }
    if (lang) {
        gcd.emit("code block found:"+lang+":"+file, code);
    } else {
        gcd.emit("code block found:"+ file, code);
    }

[link]() 

Links may be directives if one of the following things occur:

1. Title contains a colon. If so, then it is emitted as a directive with the
   stuff preceeding the colon being a directive. The data sent is an array
   with the link text, the stuff after the colon, and the href being sent. No
   pipe parsing is done at this point.
2. Title starts with a colon in which case it is a switch directive. The stuff
   after the colon is sent as second in the data array, with the link text as
   first. The href in this instance is completely ignored. There is some pipe
   processing that happens.
3. Title and href are empty. 

Return the text in case it is included in a header; only the link text will be
in the heading then. 

    if (entering) {
        ltext = [];
    } else {
        href = node.destination;
        title = node.title;
        ltext = ltext.join('');
        
        if (title) {
            title = title.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        }   
        if ((!href) && (!title)) {
            gcd.emit("switch found:"+file, [ltext, ""]);
        } else if (title[0] === ":") {
            if (!ltext) {
                _":transform"
            } else {
                _":switch with pipes"
            }
        } else if ( (ind = title.indexOf(":")) !== -1) {
            _":directive"
        }
        ltext = false;
    }

[transform]()

This becomes a directive, but looks a lot like a switch. It kind of fills in
the gap of main blocks not having pipes that can act on them. The idea is that
this can transform the text and do something with it, maybe just log or eval'd
or stored in a different variable. 

    gcd.emit("directive found:transform:" + file, 
        {   link : '' ,
            input : title.slice(1),
            href: href, 
            cur: doc.curname, 
            directive : "transform"
        }
    );

    

[directive]()

A nice customary directive found.

    directive =  title.slice(0,ind).trim().toLowerCase(); 
    gcd.emit("directive found:" + 
        directive +  ":" + file, 
        {   link : ltext,
            input : title.slice(ind+1),
            href: href, 
            cur: doc.curname, 
            directive : directive 
        }
    );


[switch with pipes]()

Switch probably with pipes. This adds an extension in the middle of colon and
pipe. Really not
sure why. Probably should remove that. 

    ind = 0;
    _":before pipe"
    if (middle) {
        ltext += "." + middle.toLowerCase();    
    }
    gcd.emit("switch found:" + file, [ltext,pipes]);



[before pipe]()

This takes the possible part in the middle between the switch directive's colon and
the first pipe. 

This will produce  `middle === 'js'` for `: js` or  `: js| jshint` with the
latter producing `pipes === 'jshint'`.  If there is no extension such as `:`
or `: | jshint`, then `middle === ''` and should be falsey. 

We add a quote to pipes to terminate it as that is a signal to end in other
pipe parsings, one that got stripped by the title matching of links. 


    pipes = title.indexOf("|");
    if (pipes === -1) {
        middle = title.slice(ind+1).trim(); 
        pipes = '';
    } else {
        middle = title.slice(ind+1, pipes).trim();
        pipes = title.slice(pipes+1).trim();
    }




## Ready to start compiling blocks

We will compile each block once the parsing is done. 

To exclude a block from the compiling phase, use the directives block off and
later block on to turn the block back on. 

    parsing done --> list blocks to compile
    var file = evObj.pieces[0];
    var doc = gcd.parent.docs[file];
    var blocks = doc.blocks;
    var name;
    for (name in blocks) {
        gcd.emit("block needs compiling:" + file + ":" + name); 
    }


## apply

We will load events, actions, and handlers, etc., here. They should be passed
in to the constructor in the form of  `method name: [ [args 1], [args2], ...]`
and this method will iterate over it all to load the events and so forth to
the emitter. 

    function (instance, obj) {
        var meth, i, n;

        for (meth in obj) {
            n = obj[meth].length;
            for (i = 0; i < n; i += 1) {
                instance[meth].apply(instance, obj[meth][i]);
            }

        }
    }




## Action compiling block

This is where we deal with parsing a given code block and handling the
substituting. 

This is a function that responds to the event `block needs compiling:file:block name`. 


    block needs compiling --> compiling block
    var file = evObj.pieces[1];
    var blockname = evObj.pieces[0];
    var doc = gcd.parent.docs[file]; 
    var block = doc.blocks[blockname];
    doc.blockCompiling(block, file, blockname);



### Block compiling

This is the actual parsing function. We look for underscores, basically. 

Some tricky bits. 

* We want to escape out underscores with slashes. So slashes
in front of an underscore get replaced in pairs. Note that we will need to
escape any underscores that are nested, i.e. `\_"\_"asd " "`
* We want smart indenting
* We need to replace the substitute. Thinking making an array that gets
  joined. We divide the text. 
* We allow any quote (single, double, backtick) and need it matched.

After each check, if we need to stop, we break out of the if by continuing the
loop. The fragments part of document is where we assemble the pieces of the
code block, but the subsitute part and the part in between. When all the
pieces have settled, we join them as the final step (another event).

This function can also be used as a directive, just send in a text and var
name to store it. This is another way to do multiple substitution runs.

The variable last is where to start from the last match. 

We create a stitch handler for the closures here. 

    function (block, file, bname, mainblock) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        
        var  quote, place, lname, slashcount, numstr, chr;
        var name = file + ":" + bname;
        var ind = 0;
        var loc = 0; // location in fragment array 
        var frags = [];
        var indents = [];
        var last = 0; 
        gcd.when("block substitute parsing done:"+name, "ready to stitch:"+name);
        while (true) {
            ind = block.indexOf("\u005F", ind);
            if (ind === -1) {
                frags[loc] = block.slice(last);
                loc += 1;
                break;
            } else {
                ind += 1;

                _":check for quote"
                
                _":check for escaped" 

                _":we are a go"
            

                last = doc.substituteParsing(block, ind+1, quote, lname,
                mainblock);
               
                doc.parent.recording[lname] = block.slice(ind-1, last);

                ind = last;

            }
        }
        _":stitching"

        gcd.emit("block substitute parsing done:"+name);
    }


[check for quote]()


Is the character after the underscore a quote? Can be double or single or
backtick. 

    if (block[ind].match(/['"`]/)) {
        quote = block[ind];
    } else {
        continue;
    }

[check for escaped]()

Index was already incremented past the underscore. So we subtract. 

Note that any escaping of the leading substitution should be followed by
escaping any underscores in the commands to the same level. 

This will determine whether
the underscore is escaped. This is done by looking backwards for a digit or an
underscore. Just the first underscore encountered matters. Some cases:

* `\1_"`  is the same as `\_"` and the block is not seen, yielding `_"`
* `\0_"` is the same as `_"` and the block will be run. This is good if you
  actually want `\1?` where the question mark is what is returned from the
  block run. That is `\1\0_"` is the same as `\1_"` if we had no escaping.
* `\2_"` will yield `\1_"` and prime it for more escaping.
* `\\1_"` will yield `\_"` 

And beware lists. 

    place = ind-2;
    numstr = '0123456789';
    slashcount = '';
    chr = block[place];
    if (chr === '\\' ) {
        frags[loc] = block.slice(last, place) + "\u005F";
        loc += 1;
        last = ind;  
        continue;
    } else if ( numstr.indexOf(chr) !== -1 ) {
        slashcount += chr;
        place -= 1;
        chr = block[place];
        while ( numstr.indexOf(chr) !== -1 ) {
            slashcount += chr;
            place -= 1;
            chr = block[place];
        }


We are defnitely in the stage of an escape situation. The number needs to be
positive. It will then decrement and print out a backslash and number escape,
including 0. 

        if (chr === '\\') {
            slashcount = parseInt(slashcount, 10);
            if (slashcount > 0) {
                slashcount -= 1;
                frags[loc] = block.slice(last, place) + "\\" +
                     slashcount + "\u005F";
                loc += 1;
                last = ind; 
                continue;

So with slashcount 0, this is not escaping except for the escape. 

            } else {
                frags[loc] = block.slice(last, place);
                loc += 1;
                last = ind-1;
            }
        }
    }
    


[we are a go]()

So at this point we know we have the start of a sub command. So we process
forward. In part, this means cutting up the previous string for loc. We reuse
the place variable as ind-1, the place of underscore

When the text ready for the location is emitted, we plug it into the array and
then alert the waiting. 

Note that name contains the file name, but after event parsing, the file gets
split off.

    place = ind-1;
    if (last !== place ) {
        frags[loc] = block.slice(last, place);
        loc += 1;
        last = place;
    }
    lname = name + colon.v + loc;
    gcd.once("text ready:" + lname, 
        doc.maker['location filled'](doc, lname, loc, frags, indents));
    gcd.when("location filled:" + lname, 
        "ready to stitch:" + name
    );
    if (place > 0) {
        indents[loc] = doc.getIndent(block, place);
    } else {
       indents[loc] = 0;
    }
    loc += 1;


[stitching]()

Here we stitch it all together. Seems simple, but if this is a minor block,
then we need to run the commands if applicable after the stitching. 

    if (bname.indexOf(colon.v) !== -1) {
        gcd.once("ready to stitch:" + name, 
            doc.maker['stitch emit'](doc, name, frags));
    } else {
        gcd.once("ready to stitch:"+name,
            doc.maker['stitch store emit'](doc, bname, name, frags));
    }



## Figure out indent

What is the indent? We need to find out where the first new line is and the
first non-blank character. If the underscore is first, then we have an indent
for all lines in the end; otherwise we will indent only at the end. 

The if checks if we are already at the beginning of the string; if not, we
look at the character. first is first non-blank character. 

Our goal is to line up the later lines with the first non blank character
(though usually they will have their own indent that they carry with them). 


    function ( block, place ) {
        var first, backcount, indent, chr;
        first = place;
        backcount = place-1;
        indent = 0;
        while (true) {
            if ( (backcount < 0) || ( (chr = block[backcount]) === "\n" ) ) {
                indent = first - ( backcount + 1 ); 
                break;
            }
            if (chr.search(/\S/) === 0) {
                first = backcount;
            }
            backcount -= 1;
        }
        return indent;
    }

### Indent

We need a simple indenting function. It takes a text to indent and a
two-element array giving the leading indent and the rest.

Note: Dropped the beginning indent since the leading text should just go
wherever the substitute is located (duh). It is the other lines whose
indentation needs to be managed. 

    function (text, indent) {
        var line, ret;
        var i, n;
        
        n = indent;
        line = '';
        for (i = 0; i <n; i += 1) {
            line += ' ';
        }

        ret = text.replace(/\n/g, "\n"+line);
        return ret;
    }


## Substitute parsing


This is fairly simple. We want to crunch along until we find a pipe or hit the
ending quote or run-off the end of the string (shouldn't happen; we emit an
event and stop subbing).  The
text taken is the variable, after being trimmed. 

The index is already pointing to the quote.  

The pipe parser is synchronous. It queues up all the commands based on
the
text being ready.

So there are a lot of names going on here. There is `name` which is the block
name, `lname` which is the block name plus the location added, then there is
`subname` which is the reference to the variable being subbed in. But there
might be no `subname` if it is a direct command evaluation. Each text is
stored in its respective structure in the docs.

An empty subname will retrieve an empty text from the document. 

The events are scoped by numbers using tripe colon as separator. Note the
colon itself is the event separator. 

The `.when` supplies the data of the events called in an array in order of the
emitting. The array is specifically `[ [ev1, data1], [ev2, data2]]` etc. 

The numbering of the commands is the input into that command number, not the
output. So we use subname to get the text from that location and then feed
it into command 0. If there are no commands, then command 0 is the done bit. 

    function (text, ind, quote, lname, mainblock ) { 

        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;

        var match, subname, chr, subtext;
        var subreg = doc.regexs.subname[quote];



        subreg.lastIndex = ind;
        
        match = subreg.exec(text);
        if (match) {
            _":got subname"
        } else {
            gcd.emit("failure in parsing:" + lname, ind);
            return ind;
        }
      

        if (subname === '') {
            gcd.emit("text ready:"  + lname + colon.v + "0", '');
        } else {
            subtext = doc.retrieve(subname, "text ready:"  + lname + colon.v + "0" );
        }

        return ind;

    }


[got subname]()


    ind = subreg.lastIndex;
    chr = match[2];
    subname = match[1].trim().toLowerCase();
    subname = doc.subnameTransform(subname, lname, mainblock);
    subname = colon.escape(subname);
    if (chr === "|") {
        ind = doc.pipeParsing(text, ind, quote, lname, mainblock);
    } else if (chr === quote) { 
        //index already points at after quote so do not increment
        gcd.once("text ready:" + lname + colon.v + "0",
            doc.maker['emit text ready'](doc, lname));
        doc.parent.recording[ lname + colon.v + "0"] = match[1];
    } else {
        gcd.emit("failure in parsing:" + lname, ind);
        return ind;
    }

### Subname Transform

This takes a subname and transforms it based on where it is relative to the
document. We use a hack to get the mainblock name. This works for lnames of
the form `file:main\:...` that is, everything between the first colon and
the first escaped colon will be returned as mainblock.

    function (subname, lname, mainblock) {
        var colind, first, second, main;
        var doc = this;
        var colon = doc.colon;

        _":fix colon subname"

        _":h5 transform"
       

        return subname;

    }

[slicing]() 

This slices the mainblock. It is used repeatedly in the if's to minimize the
need to do this if it is not going to be used. 

So the name variable should start with a file name with a colon after it and
then from there to a triple colon should be the major block name on record. 


    if (mainblock) {
        //console.log(mainblock)
    } else {
        colind = lname.indexOf(":");
        mainblock = lname.slice(colind+1, lname.indexOf(colon.v, colind));
    }


[fix colon subname]()

A convenient shorthand is to lead with a colon to mean a minor block. We need
to put the big blockname in for that. 

If the subname is simply a colon, then we use the major block heading on
record for it. 

Directives require a bit of finesse. See the save directive for how it handles
it. Basically, it uses the starting href as the mainblock. That is why
mainblock is being passed in everywhere. 



    
    if (subname[0] === ":") {
        _":slicing"
        if (subname === ":") {
            subname = mainblock;
        } else {
            subname = mainblock + subname;
        }
        return subname;
    } 




[h5 transform]()

Here we want to implement the h5 and h6 path shortcuts of `.` and `..`

We have a hierarchy that can be `a/b/c` and if we are at the `c` level, then
we want to be able to back up. This function will take in the varname and the
name of the block being processed and return the transformed varname. For the
`..` changes, we need to figure out whether to include the "/" or not at the
end. For the `.`, we need the colon or a slash to avoid recrusion. 

    if (subname.slice(0, 6) === "../../" ) {
        //in a/b/c asking for a
        _":slicing"
        main = mainblock.slice(0, mainblock.indexOf("/")); 
        if ((subname.length > 6) && (subname[6] !== ":") ) {
            subname =  main + "/" + subname.slice(6);
        } else {
            subname = main + subname.slice(6);
        }
    } else if (subname.slice(0,2) === "./" ) {
        // in a/b asking for a/b/c using ./c
        _":slicing"
        if (subname[2] === ":" ) {
            subname = mainblock + subname.slice(2);
        } else {
            subname = mainblock + "/" + subname.slice(2);     
        }
    } else if (subname.slice(0,3) === "../") {
        //either in a/b or in a/b/c and asking for a or a/b, respectively
        _":slicing"
        first = mainblock.indexOf("/");
        second = mainblock.indexOf("/", first+1);

        if (second !== -1) {
            // a/b/c case
            main = mainblock.slice(0, second);
        } else {
            main = mainblock.slice(0, first);
        }

        if ((subname.length > 3) && (subname[3] !== ":") ) {
            subname = main + "/" + subname.slice(3);
        } else {
            subname = main + subname.slice(3);
        }

    }


## Parsing commands

Commands are the stuff after pipes. 

A command is a sequence of non-white spaced characters followed by a white
space plus arguments or pipe.  The arguments are comma separated values that
are either the literals to be passed in as argument values or are
substitutions (underscore quote stuff) whose output is passed in as an
argument. A backslash will escape a comma, underscore, or other backslash. 

We assume we are given a piece of text with a starting position that comes
after the first pipe. We are also given a name that we attach the command
positions to as we go along. Also the ending quote must match the initial one
so we are passed in that quote as well.

We need to track the command numbering for the event emitting. 

    function (text, ind, quote, name, mainblock) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
       

        var chr, argument, argnum, match, command, 
            comname, nextname, aname, result, start, orig=ind ;
        var n = text.length;
        var comnum = 0;
        var comreg = doc.regexs.command[quote];
        var argreg = doc.regexs.argument[quote];
        var wsreg = /\s*/g;


        while (ind < n) { // command processing loop

            _":get command"

            _"get arguments for command parsing"

            gcd.emit("command parsed:" + comname);

        }
        

        return ind;

    }


[get command]()

So we just chunk along and deal with some cases. The quote at the end
terminates the loop as the substitution is done. A pipe indicates that we move
onto the next command; no arguments. A space indicates we move onto the
argument phase.

The .whens are setup to track the command being done parsing (sync), the
arguments being done, and the input (that's the text ready). For the command
name being parsed emission, we send along the doc, command and the nextname to
be sent along. 

Commands are case-insensitive just as block names are as well as being
trimmed. 

    comreg.lastIndex = ind;

    match = comreg.exec(text);
    if (match) {
        command = match[1].trim().toLowerCase();
        chr = match[2];
        ind = comreg.lastIndex;
        if (command === '') {
            command = "passthru";    
        }
        command = colon.escape(command);
        comname = name + colon.v + comnum;
        comnum += 1;
        nextname = name + colon.v + comnum;
        gcd.when(["command parsed:" + comname, 
            "text ready:" + comname],
            "arguments ready:"  + comname );
        if (chr === quote) {
            _"ending a command substitution"
            break;
        } else if (chr === "|") {
            _"ending a command substitution:com parse"
            continue;
        }
    } else {
        _"Get arguments for command parsing:failure"
    }

### ending a command substitution

The command number that is beyond the inputs represents the end of the chain.
At that point, we emit the text ready for the previous level. 


    gcd.once("text ready:" + nextname, 
        doc.maker['emit text ready'](doc, name));
    doc.parent.recording[nextname] = name;
    _":com parse"

[com parse]()

This is split off for convenience. 

    doc.parent.recording[nextname] = text.slice(orig, ind);
    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);

    

### Get arguments for command parsing

Here it gets a bit trickier. We have one loop for going over the arguments.

For each argument, After an initial white space purge, we need to check for the substitution
block. After the sub block is done, we expect optional space, followed by a
comma, pipe, or quote. Otherwise, an error message is alerted and we assume it
was an ignored comment. 

If it is not a substitution block, then we chunk along until a backslash, comma, pipe or quote.
For a backslash, it will escape the following by default: 
backslashes, underscores, pipes, commas, quotes, and it turns u
into a unicode gobbler (4 characters) while turning n into a newline and
turning an embedded newline into a space (that is, if you are wrapping place
slash at the end of the line). We check the doc for something before
referencing the built in one. 

To assemble a text with embedded stuff, you can do 
`"|cmd _"|+ the, _"awe", right"` would produce for arg1 `the great right`
if `awe` had great. Can also have it that commas are unnecessary with subs,
but I think that leads to uncertainty. Bad enough not having parentheses.  

    
    argnum = 0;
    while (ind < n) { // each argument loop
        aname = comname + colon.v + argnum;
        gcd.when("text ready:" +aname,
            "arguments ready:"+comname );
        wsreg.lastIndex = ind;
        wsreg.exec(text);
        ind = wsreg.lastIndex;

        if ( (text[ind] === "\u005F") && 
            (['"', "'", "`"].indexOf(text[ind+1]) !== -1) )  {
            _":deal with substitute text"

The next one deals with an escaped argument in subbing, that is `\0_"` means
it should be evaluated. 

        } else if ( (text.slice(ind, ind+3) === "\\0\u005F")   && 
            (['"', "'", "`"].indexOf(text[ind+3]) !== -1) )  {
                ind += 2;
                _":deal with substitute text"
        } else {
            // no substitute, just an argument. 
            argument = '';
            while (ind < n) {
                _":get full argument"
            }
            doc.parent.recording[aname] = command + colon.v + argnum + colon.v + argument;
        }
        if (chr === ",") {
            argnum += 1;
            continue;
        } else if (chr === "|") {
            _"ending a command substitution:com parse"
            break;
        } else if (chr === quote) {
            _"ending a command substitution"
            return ind;
        } else {
           _":failure" 
        }
    }





[deal with substitute text]()


So if there is a quote after an underscore, then we chunk along the substitue.
It should return the index right after the end of the subsitution part. After
that, we chunk along to the next non-whitespace character. It should be a
comma, a pipe, or a matching quote. Anything else is an error. 

        start = ind;
        ind = doc.substituteParsing(text, ind+2, text[ind+1], aname, mainblock);
        doc.parent.recording[aname] =  text.slice(start, ind);
        wsreg.lastIndex = ind;
        wsreg.exec(text);
        ind = wsreg.lastIndex;
        chr = text[ind];
        ind += 1;

[get full argument]()

Here we are mainly dealing with looking for a backslash. If it is stopped
without a backslash then we quit the loop and deal it with it elsewhere.

For the backslash, we look at the next character and see if we have anything
we can do. 

We trim each arugment as well so we need not worry about spaces in commands. 

    argreg.lastIndex = ind;
    match = argreg.exec(text);
    if (match) {
        ind = argreg.lastIndex;
        argument += match[1];
        chr = match[2];
        if (chr === "\\") {
           result = doc.backslash(text, ind, doc.indicator );
           ind = result[1];
           argument += result[0];
           continue;
        } else {
            argument = argument.trim();
            argument = doc.whitespaceEscape(argument, doc.indicator);
            gcd.emit("text ready:" + aname, argument);
            break;
        }
    } else {
        _":failure"
    }


[failure]()

For failure, we just emit there is a failure and exit where we left off. Not a
good state. Maybe with some testing and experiments, this could be done
better. Incrementing index prevent possible endless loop. 

    gcd.emit("failure in parsing:" + name, text.slice(orig, ind));
    return ind+1;
 

### Backslash

The backslash is a function on the doc prototype that can be overwritten if
need be. 

It takes in a text and an index to examine. This default function escapes
backslashes, underscores, pipes, quotes and

* u leads to unicode sucking up. This uses fromCodePoint
* n converted to a new line. 
* a whitespace will be preserved.

If none of those are present a backslash is returned. 

We return an object with the post end index in ind and the string to replace
as chr.

Note that with commonmark, `\_` will be reported as `_` to the lit pro doc.
That is in commonmark, backslash underscore translates to underscore. So to
actually escape the underscore, we need to use two backslashes: `\\_`.


    function (text, ind, indicator) {
        var chr, match, num;
        var uni = /[0-9A-F]+/g; 
        

        chr = text[ind];
        switch (chr) {
        case "|" : return ["|", ind+1];
        case '\u005F' : return ['\u005F', ind+1];
        case "\\" : return ["\\", ind+1];
        case "'" : return ["'", ind+1];
        case "`" : return ["`", ind+1];
        case '"' : return ['"', ind+1];
        case "n" : return [indicator + "n" + indicator, ind+1];
        case " " : return [indicator + " " + indicator, ind+1];
        //case "\n" : return [" ", ind+1];
        case "`" : return ["|", ind+1];
        case "," : return [",", ind+1];
        case "u" :  _":unicode"
        break;
        default : return ["\\", ind];

        }
    }



[unicode]()

This handles the unicode processing in argument strings. After the u should be
a hexadecimal number. If not, then a backslash is return and processing starts
at u. 

If it cannot be converted into a unicode, then the backslash is returned and
we move on. No warning emitted. 

    uni.lastIndex = ind;
    match = uni.exec(text);
    if (match) {
        num = parseInt(match[0], 16);
        try {
            chr = String.fromCodePoint(num);
            return [chr, uni.lastIndex];
        } catch (e)  {
            return ["\\", ind];
        }
    } else {
        return ["\\", ind];
    }


### Whitespace Escape

This escapes whitespace. It looks for indicator something indicator and
inserts. 

    function (text, indicator) {
        var n = indicator.length, start, end, rep;
        while ( (start = text.indexOf(indicator) ) !== -1 ) {
            end = text.indexOf(indicator, start + n);
            rep = text.slice(start+n, end);
            if (rep === "n") {
                rep = "\n";
            }
            text = text.slice(0, start) + rep + text.slice(end+n);
        }
        return text;

    }

    



### Command Regexs

We have an object that has the different flavors of gobbling regexs that we
need. The problem was the variable quote. I want to have statically compiled
regexs and so just stick them in an object and recall them based on quote.
With just one variable changing over three times, not a big deal. 

For commands, these are non-whitespace character strings that do not include
the given quote or a pipe. There is no escaping. 
The regex ignores the initial whitespace returning the word
in 1 and the next character in 2. A failure to match should mean it is an
empty string and the passthru can be used. 

    {

        command : {
            "'" : /\s*([^|'\s]*)(.)/g,
            '"' : /\s*([^|"\s]*)(.)/g,
            "`" : /\s*([^|`\s]*)(.)/g
        },

The argument is anything up to a comma, pipe, underscore, or the special
quote. It ignores initial whitespace. In 1 is the straight text, if any, and
then in 2 is the character to signal what to do next (quote ends processing,
pipe ends command, comma ends argument, underscore may initiate substitution,
and slash may initiate escaping).

        argument : {
            "'" : /\s*([^,|\\']*)(.)/g,
            '"' : /\s*([^,|\\"]*)(.)/g,
            "`" : /\s*([^,|\\`]*)(.)/g
        },
        endarg : {
            "'" : /\s*([,|\\'])/g,
            '"' : /\s*([,|\\"])/g,
            "`" : /\s*([,|\\`])/g

        },

And a super simple subname is to chunk up to pipes or quotes.

        subname : {
            "'" : /\s*([^|']*)(.)/g,
            '"' : /\s*([^|"]*)(.)/g,
            "`" : /\s*([^|`]*)(.)/g
        }


    }



## Scope

Okay, this is a pretty important part of this whole process. The scope is the
bit before the double colons. Fundamentally, a new document is put under the
scope of its path/filename. But it can have other names because using filenames is
a bit annoying at times. 

The big question is whether these nicknames are local to a single document or
glboal across all documents being parsed together. At first, I was going to do
local names, but I think there shall be just one universal set of scope names.
If you want a local scope, consider prefixes. Multiple global scope names can
reference the same underlying scope. 

The basic use of scopes is to store and retrieve variables. Given a scope
name, we look it up in the scopes object. If the key exists, then it will
point to either the fundamental object or to another key. If an object is
found, then we either store the variable or, if retrieving, we take it if
it exists and flag it if it does not exist. 

If a scope name does not exist, then we wait until it does exist and then
proceed through the chain again.  

### Store

This stores some text under a name. If the name has double colons, then it
will get that scope and put it there.

If the variable already exists in the scope, then after saving it to the new
location, this fact gets emitted with the old and the new. 

    function (name, text) {
        var doc = this;
        var gcd = doc.gcd;
        var scope = doc.getScope(name);

       
        var f;
        if (! scope[0]) {
            _":non-existent"
            return;
        }

        var varname = scope[1];
        var file = scope[2];
        scope = scope[0];

        var old; 
        if (scope.hasOwnProperty(varname) ) {
            old = scope[varname];
            scope[varname] = text;
            gcd.emit("overwriting existing var:" + file + ":" + varname, 
            {oldtext:old, newtext: text} );
        } else {
            scope[varname] = text;
        }
        
        gcd.emit("text stored:" + file + ":" + varname, text);
    }

[non-existent]()

This deals with the situation that the scope is not yet in a state for
existence. Essentially, it sets up a listener that will store and emit once
the scope exists. 

Scope is of the form `[null, varname, alias]`

    gcd.emit("waiting for:storing:" + doc.file + ":" + name,
        ["scope exists:" + scope[2], "scope exists",  scope[2],
        doc.file, scope[1] ]);
    f = function () {
        doc.store(name, text);
    };
    f._label = "Storing:" + doc.file + ":" + name;
    gcd.once("scope exists:" + scope[2], f);


### Variable retrieval

This function retrieves the variable either from the local document or from
other scopes. 

The local variables are in the vars object, easily enough. The scopes refer to
var containing objects of other documents or artificial scopes. Note that one doc 
can name the scopes
potentially different than other docs do. Directives define the scope name
locally. Also note that scopes, even perfectly valid ones, may not exist yet.

If either the scope does not yet exist  or the variable does not exist, then
we wait for listeners. The second argument is either a callback function or an
event string to emit. The variable is not returned. 

If the scope does not exist yet, then we wait until it does and call this
again. 

Returning undefined is good and normal.

    function (name, cb) {
        var doc = this;
        var gcd = doc.gcd;


        var scope = doc.getScope(name);


        var varname = scope[1];
        var file = scope[2];
        scope = scope[0];
        var f;
        if (scope) {
            if (typeof scope[varname] !== "undefined") {
                _":callback handling"
                return ;
            } else {
                _":no var"
                return ;
            }
        } else {
            _":no scope"
            return ;
        }
    }

[callback handling]()

Here we handle the callbacks. If it is a function, we call it with the
variable. If it is a string, we assume it is an emit string and emit the
variable name with it. Anything else is unhandled and is an error. 


    if (typeof cb === "function") {
        cb(scope[varname]);
    } else if (typeof cb === "string") {
        gcd.emit(cb, scope[varname]);
    } else {
        gcd.emit("error:unrecognized callback type:" +
            doc.file + ":" + name, (typeof cb) );
    }

[no scope]()

If there is no scope yet of this kind, then we listen for it to be defined and
linked. The file var there is poorly named; it is the link name of the scope
since the actual global scope name is not known. 

    gcd.emit("waiting for:retrieval:" + cb+ "need:" + name, 
        ["scope exists:" + file, "scope exists",  file, doc.file, varname,
        true]);
    f = function () {
        doc.retrieve(name, cb);
    };
    f._label = "Retrieving:" + doc.file + ":" + name;
    gcd.once("scope exists:" + file, f);



[no var]() 

In this bit, we have no variable defined yet. So we need to listen for it. We
will get triggered

    gcd.emit("waiting for:retrieval:" + doc.file, 
        ["text stored:" + file + ":" + varname, "retrieval", file, varname]);
    f = function () {
        doc.retrieve(name, cb);
    };
    f._label = "Retrieving:" + file + ":" + varname;
    gcd.once("text stored:" + file + ":" + varname, f); 


### Get Scope

This is the algorithm for obtaining the scope from a name of the form
`scopename::varname`. It will return an array of the form `[scope, varname, filename]`.

The filename is what the local scope points to. The scope is the actual object
that the variable names are the keys of and varname is the key that will be in
the object. Note we say filename as the scopes are probably likely to be other
docs, but they need not be. One can create global scopes with arbitrary names. 

So when a scope is requested, it may not have been linked to yet or it may not
exist yet. In fact, if it does not exist, it will not be linked to. So we only
need to worry about the linking case. 

The while loop will iterate over possible alias --> alias --> ... --> scope.
This chain should only happen when all are established. 


    function (name) {
        var ind, scope, alias, scopename, varname;
        var doc = this;
        var colon = doc.colon;
        var folder = doc.parent;

        if (  (ind = name.indexOf( colon.v + colon.v) ) !== -1 ) {
            alias = name.slice(0,ind);
            varname = name.slice(ind+2);
            scopename = doc.scopes[ alias ];
            if (typeof scopename === "string") {
                while ( typeof (scope = folder.scopes[scopename]) === "string") { 
                    scopename = scope;   
                }
                if (scope) {
                    return [scope, varname, scopename]; 
                } else { //this should never happen
                    doc.gcd.emit("error:non-existent scope linked:" + 
                        alias, scopename);
                }
            } else if (scopename) { //object -- alias is scope's name
                return [scopename, varname, alias];
            } else { // not defined yet
                return [null, varname, alias];
            }
        } else { //doc's scope is being requested
            return [doc.vars, name, doc.file];
        }
    }


### Create Global Scope

This is the function on the folder that creates a scope. This creates the vars
object on a doc as well as creates stand alone scopes. If a scope with a name
already exists, it returns that scope. If the scope is a string, then this is
a reference and I am considering that an error. An error is emitted and a new
object is created. 

    function (name) {
        var folder = this;
        var gcd = folder.gcd;
        var scopes = folder.scopes;
        var colon = folder.colon;

        name = colon.escape(name);

        if (! scopes.hasOwnProperty(name) ) {
            scopes[name] = {};
            gcd.emit("scope created:" + name);
            gcd.emit("scope exists:" + name);
        } else if (typeof scopes[name] === "string") {
            gcd.emit("error:conflict in scope naming:" + name);
            scopes[name] = {};
        }

        return scopes[name];
    }

[reporter]()

This deals with scope existing. 

    function (data) {
        if (data[3]) {
            return "NEED SCOPE: " + data[0] + " FOR RETRIEVING: " + data[2] + 
                " IN FILE: " + data[1]; 
        } else {
            return "NEED SCOPE: " + data[0] + " FOR SAVING: " + data[2] + 
                " IN FILE: " + data[1]; 
        }
    }
    


### Create Linked Scope

This is where we go to create scopes. It creates an alias to another scope. It
does not create a new scope. This is different than loading another litpro doc.

We check for whether the alias is defined or not. If it is not, then we link
it to the scope under the name. If that linked scope does not exist, we wait
to link to it until after it does exist. If two scopes try to link to each
other, this should result in nothing happening which is better than looping
repeatedly.    

Anyway, if the alias is defined already, then we check that it is a string
that corresponds to the name. If not, we issue an error report and do nothing. 

This function returns nothing. 

    function (name, alias) {
        var doc = this;
        var gcd = doc.gcd;
        var folder = doc.parent;
        var scopes = folder.scopes;
        var colon = doc.colon;

        name = colon.escape(name);
        alias = colon.escape(alias);

        if (scopes.hasOwnProperty(alias) ) {
            if (scopes[alias] !== name ) {
                gcd.emit("error:conflict in scope naming:" +
                     doc.file, [alias, name] );
            } 
        } else {
            if ( scopes.hasOwnProperty(name) ) {
                _":scope exists"
            } else {
                gcd.once("scope exists:" + name, function () {
                    _":scope exists"
                });
            }
        }


    }

[scope exists]()

This is how we link the stuff 

    
    folder.scopes[alias] = name;
    gcd.emit("scope linked:" + doc.file + ":" + alias, name);
    gcd.emit("scope exists:" + alias);



## Maker

This is an object that makes the handlers for various once's. We can overwrite
them per document or folder making them accessible to manipulations. 

    {   'emit text ready' : function (doc, name) {
                var gcd = doc.gcd;

                var evt =  "text ready:" + name;
                gcd.emit("waiting for:text:"  + name, 
                    [evt, "text", name]);
                var f = function (text) {
                    gcd.emit(evt, text);
                };
                f._label = "emit text ready;;" + name;
                return f;
            },
        'store' : function (doc, name, fname) {
                
                var f = function (text) {
                    doc.store(name, text);
                };
                f._label = "store;;" + (fname ||  name);
                return f;
            },
        'store emit' : function (doc, name, fname) {
                fname = fname || name;
                var gcd = doc.gcd;

                var evt = "text ready:" + fname;
                gcd.emit("waiting for:text:"  + fname, 
                    [evt, "text", fname]);
                var f = function (text) {
                    doc.store(name, text);
                    gcd.emit(evt, text);
                };
                f._label = "store emit;;" +  fname;
                return f;
            },
        'location filled' : function (doc, lname, loc, frags, indents ) {
                var gcd = doc.gcd;

                var evt = "location filled:" + lname;
                gcd.emit("waiting for:location:"  + lname,
                    [evt, "location", lname]);

                var f = function (subtext) {
                    subtext = doc.indent(subtext, indents[loc]);
                    frags[loc] = subtext;
                    gcd.emit(evt);
                };
                f._label = "location filled;;" + lname;
                return f;
            },
        'stitch emit' : function (doc, name, frags) {
                var gcd = doc.gcd;

                var evt = "minor ready:" + name;
                gcd.emit("waiting for:minor:" + name,
                    [evt, "minor", name]);

                var f = function () {
                    gcd.emit(evt, frags.join(""));
                };
                f._label = "stitch emit;;" + name;
                return f;
            },
       'stitch store emit' : function (doc, bname, name, frags) {
                var gcd = doc.gcd;

                var evt = "text ready:" + name;
                gcd.emit("waiting for:text:"  + name,
                    [evt, "text", name]);

                var f = function () {
                    var text = frags.join("");
                    doc.store(bname, text);
                    gcd.emit(evt, text);
                };
                f._label = "stitch store emit;;" + name;
                return f;
            }
    }


## Action for argument finishing

When arguments are ready, we need to fire the command. This is where we do
this. 

This has to decode a few different events and their data:

* command parsed:  `[doc, command, name to emit when ready]`. This has what
   we need to run the command and deal with its return. 
* text ready: for pipe input, we can recognize it by being the shortest. This is
  the input that is being piped into a command. 
* text ready: arguments. These should be all the other ones. We pop off the
  last colon.v separated number for the argument placement. 

Once all is setup, we execute the command. 

We need to decode the input from the arguments crudely instead of by
specificity as the text being emitted by subsitution would not otherwise know.
And this is simple enough. 

Commands are bound to doc by applying the arguments. The first argument is the
pipe input. The second argument is an array containing all the other
arguments. The third argument is the name to emit when all is done. 

    arguments ready --> run command
    var doc, input, name, cur, command, min = [Infinity,-1], han;
    var args = [];


    _":extract data"

    var fun = doc.commands[command];

    if (fun) {
        fun.apply(doc, [input, args, name, command]);
    } else {
        gcd.emit("waiting for:command:" + command, 
            ["command defined:" + command, "cmd", command, name]);
        han = function () {
            fun = doc.commands[command];
            if (fun) {
                fun.apply(doc, [input, args, name, command]);
            } else {
                gcd.emit("error:commmand defined but not:" + doc.file +
                    ":" + command);
            }
        };
        han._label = "delayed command:" + command + ":" + name; 
        gcd.once("command defined:" +  command, han);
    }


[extract data]()

We first run through, teasing out the command parsed event and its data while
also finding the minimum length of the text ready events.

This is a bit of arcane code. While seeking the minimum, any bit which is not
the minimum is an argument. We extract its position by being the last number
in the string. If something is the minimum, then we extract the previous
minimum winner and gets its text into the proper place. 

    var i, j, k, m, n=data.length;
    for (i = 0; i < n; i += 1) {
        cur = data[i];
        if (data[i][0].indexOf("command parsed") === 0 ) {
            doc = gcd.parent.docs[data[i][1][0]];
            command = data[i][1][1];
            name = data[i][1][2];
        } else { // should only be text ready
            j = i;
            if ( ( m = data[i][0].length ) < min[0] ) {
                j = min[1];
                min = [m, i];
            }
            if (j !== -1) {
                k = data[j][0].match(/([0-9]+)$/);
                if (k) {
                    args[k[1]] = data[j][1];
                }
            }
        }
    }

    input = data[min[1]][1];


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
                gcd.emit("text ready:" + name, out); 
            } catch (e) {
                doc.log(e);
                gcd.emit("error:command execution:" + name, 
                    [e, input, args, command]); 
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
                    gcd.emit("text ready:" + name, data);
                }
            };

            fun.call(doc, input, args, callback, name);
        };
        if (label)  {
            f._label = label;
        } 
        
        return f;
    }


## Commands

Here we have some commands and directives that are of common use

    {   eval : sync(_"eval", "eval"),
        sub : _"sub",
        store: sync(_"store command", "store"),
        log : sync(_"cmd log", "log"),
        async : async(_"async eval", "async"),
        compile : _"cmd compile",
        raw : sync(_"raw", "raw"),
        trim : sync(_"trim", "trim"),
        cat : sync(_"cat", "cat"),
        push : sync(_"push", "push"),
        pop : sync(_"pop", "pop"),
        "if" : _"cmd if",
        "done" : _"cmd done",
        "when" : _"cmd when"
    }

### Eval

This implements the command `eval`. This evaluates the arguments as JavaScript. It
is formulated to be synchronous eval.

Arguments are concatenated together and eval'd, in order with input
first.

The incoming text is stored in the variable text which the eval should be able
to see. Manipulate that variable. The text is then passed along. 


    function ( text, args ) {
        var doc = this;

        var code = args.join("\n");

        try {
            eval(code);
            return text.toString();
        } catch (e) {
            doc.gcd.emit("error:command:eval:", [e, code, text]);
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

        var code =  args.join("\n");

        try {
            eval(code);
        } catch (e) {
            doc.gcd.emit("error:command:async:", [e, code, text]);
            callback(null, e.name + ":" + e.message +"\n"  + code + 
             "\n\nACTING ON:\n" + text);
        }
    }


### Cmd Compile

This takes in some text and compiles it, returning the compiled text when
done. A main use case would be multiple processing of a block, say after
subbing in some values or to wait to do block substitution until after some
processing.

This is a bit of a hack. So any command will have a colon in it. This triggers
the block compiling to emit a minor ready event, which we can listen for and
the simply emit the text ready event. The name also include the file name 

The stripped is to remove the starting filename. 



    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var file = doc.file;
        var colon = doc.colon.v;
        var escape = doc.colon.escape;
        var i, n, start, nextname, oldname, firstname;

        var stripped = name.slice(name.indexOf(":")+1);


        var hanMaker = _":handle maker";



        if (args.length === 0) {
            gcd.once("minor ready:" + name, function (text) {
                gcd.emit("text ready:" + name, text); 
            });
            doc.blockCompiling(input, file, stripped);
        } else {
            _":args"
        }
    }

[args]()

If there are arguments to use, then we interpret them as blocks to compile
from.


    n = args.length;
    firstname = oldname = escape(stripped + colon + ( args[0] || '') + colon + 0);
    for (i = 1; i < n; i += 1) {
        start = args[i] || '';
        nextname = escape(stripped + colon + start + colon + i);
        gcd.once("minor ready:" + file + ":" + oldname, hanMaker(file,
            nextname, start) );
        gcd.emit("waiting for:cmd compiling:" + nextname  + ":from:" + doc.file, 
            ["minor ready:" + file + ":" + nextname, "compile", nextname, doc.file, start]);
        oldname = nextname;
    }
    start =  args[0] || '';
    gcd.once("minor ready:" + file + ":" + oldname, function (text) {
        gcd.emit("text ready:"  + name, text);
    });
    doc.blockCompiling(input, file, firstname, start);

[handle maker]()

This returns a function that will be the handler. It closures around the
relevant bits. 

    function (file, nextname, start) {
        return function (text) {
            doc.blockCompiling(text, file, nextname, start);
        };
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
            newstr = obj[keys[j]] || '';
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

### Cmd Log

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

### Cat

Concatenating text together and returning it. If there is only one argument,
then it just concatenates as is. If there is more than one argument, then the
first argument, which could be empty, is the join separator. 

    function (input, args) {
        var sep = '';
        if (args.length > 1) {
            sep = args[0];
            args = args.slice(1);
        }
        return (input ? input + sep : '') + args.join(sep) ;
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

### Cmd if

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

### Cmd when

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

### Cmd done

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


## Directives

The most basic directive is saving the text. 

For now, just simple saving, but we can implement the pipe parsing a bit later
for saving as well. 

    {   
        "save" : _"save",
        "new scope" : _"new scope",
        "store" : _"dir store",
        "log" : _"dir log",
        "out" : _"out",
        "load" : _"load",
        "link scope" : _"link scope",
        "transform" : _"dir transform",
        define : _"define directive",
        "block" : _"block",
        "ignore" : _"ignore language",
        "eval" : _"dir eval",
        "if" : _"dir if",
        "flag" : _"dir flag",
        "version" : _"dir version",
        "npminfo" : _"dir npminfo",
    }



Directives get a single argument object which gets the link, the href, and
 the text after the colon. 
 
### Dealing with directive pipes

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

        cur = colon.restore(cur);

        if (start) {
            if ( start[0] === "#") {
                start = start.slice(1).replace(/-/g, " ");
            }

            start = start.trim().toLowerCase();

            if (start[0] === ":") {
                //console.log(start);
                start = doc.stripSwitch(cur) + start;
                //console.log(start);
            }

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

        blockhead = name;

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

        if (str) {
            str = str + '"';
            gcd.once("text ready:" + emitname, handler);
            
            block = doc.stripSwitch(colon.restore(start));

            doc.pipeParsing(str, 0, '"', emitname, block);

        } else {
            gcd.once("text ready:" + emitname + colon.v + "0", handler); 
        }

    }


### Dir Factory

This produces functions that can serve as directives with the pipe parsing
built in. It takes in an emitname function and a handler creator. 

This is designed around the state variable holding the state. This is the
easiest to have flexibility with the functions. So each of the provided
functions might modify and add to the state. Note that the state starts as the
arguments parsd from a directive link, but that things get added to it. 

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

        
    doc.pipeDirSetup(state.pipes, state.emitname, state.handler, 
        ( state.start ||  state.block) );

    var pipeEmitStart = "text ready:" + state.emitname + colon.v + "0";
    if (! state.value) {
        doc.retrieve(state.start, pipeEmitStart);
    } else {
        gcd.emit(pipeEmitStart, state.value || "" );
    }


#### Save

Here we write the save function using the factory function. 

    
    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()


    function (state) {
        state.emitname =  "for save:" + this.file + ":" + state.linkname;
    }


[handler factory]()

    function (state) {
        var doc = this;
        var gcd = this.gcd;
        var linkname = state.linkname;

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
        var linkname = state.linkname;
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


### Dir Store

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
        var gcd = this.gcd;
        var linkname = state.linkname;

        var f = function (data) {
             doc.store(linkname, data);
        };
        f._label = "storeDir;;" + linkname;

        state.handler = f;

    }
    
        

[other]() 

    function (state) {


        if (state.options) {
            state.block = state.start;
            state.start = '';
            state.value = state.options;
        }
    }

### Dir Transform

This is the directive for manipulating some text. The href hash tag has the
variable value to retrieve and then it gets sent into the pipes. The stuff
before the pipes is an options thing which is not currently used, but reserved
to be in line with other directives, available for the future, and just looks
a bit better (ha). 

`[](#... ": ..|..")` or transform:

    dirFactory(_":emitname", _":handler factory", _":other")

[emitname]()

We store the important name in args.name. 

    function (state) {
        state.name = this.colon.escape(state.start + ":" + state.input);
        state.emitname =  "for transform:" + this.file + ":" + state.name;
    }


[handler factory]()


    function (state) {
        var gcd = this.gcd;


        var f = function (data) {
            gcd.emit(state.emitname, data);
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
        var emitname = state.emitname

        gcd.emit("waiting for:transforming:" + name, 
            [emitname, name, doc.file, start]  );
    }



### Dir Log

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

This loads files into the folder and asscoiates the nickname with it in the
local doc.

All docs that are already loading or loaded will be present in the
folder.docs object. If not, then we need to load it. We will also need to
check for the nickname already existing in scopes. If it does exist, we emit an
error and do not load the file. 

We use the folder colon escape for the url since that is global to folders
while the nickname is strictly internal and uses the local colon escape.
Somehow I get the feelng I have made a mess of this escape stuff; it should
not have been so flexible.

`[alias](url "load:options")`


    function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var folder = doc.parent;
        var url = args.href.trim();
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
        var cmdname = state.linkname;
        var doc = this;
        var gcd = this.gcd;

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

### dir eval

Run any code you like. Now. 

The syntax is `[name](# "eval:)`  This will evaluate the code in the current
block. That's it. Nothing fancy. This gives immediate access to evaling. If
you need somthing involving other blocks, use the command eval and pipe in
input. It has access to doc due to scope of eval. This leads to whatever one
might need access to but keep in mind that it is being evaled during the
marked parsing stage. 


    function (args) {
        var doc = this;

        var block = doc.blocks[args.cur];


        try {
            eval(block);
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

### Dir if

The directive if checks for the flag and then calls the directive being
referenced if need be. 

    function (args) {
        
        var doc = this;
        var folder = doc.parent;
        var gcd = doc.gcd;
        
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

### Dir flag

This sets the flag on the folder which is `this.parent`.

`[flag name](# "flag:")`

    function (args) {
        this.parent.flags[args.link.trim()] = true;

    }

### Dir Version

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

### Dir npminfo

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
            var kind = el.slice(0, ind).trim();
            kind = types[kind];
            if (!kind) { doc.log("unrecognized type");return;}
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


## On action 

To smoothly integrate event-action workflows, we want to take a block, using
the first line for an on and action pairing. 

Then the rest of it will be in the function block of the action. 

The syntax is  `event --> action : context` on the first line and the rest
are to be used as the function body of the handler associated with the
action. The handler has signature data, evObj. 


    function (code) {
        var lines = code.split("\n");
    
        var top = lines.shift().split("-->");
        var event = top[0].trim();
        var actcon = top[1].split(":");
        var action = actcon[0].trim();
        var context = (actcon[1] || "").trim();
        
        var ret = 'gcd.on("' + event + '", "' + action + 
            '"' + (context ? (', ' + context) : '') + ");\n\n";

       ret += 'gcd.action("' +  action + '", ';
       ret += 'function (data, evObj) {\n        var gcd = evObj.emitter;\n';
       ret += '        ' + lines.join('\n        ');
       ret += '\n    }\n);';
       
       return ret;
    }

[oa](# "define:")


## Tests

Let's create a testing environment. The idea is that we'll have a series of
documents in the tests folder that will have the convention `name -
description` at the top, then three dashed separator line to create a new
document to parse followed by its result. In more advanced tests, we will
introduce a syntax of input/output and related names. 

The log array should be cleared between tests. 

    /*global require, setTimeout, console*/
    /*jslint evil:true*/

    var fs = require('fs');
    var test = require('tape');
    var Litpro = require('./index.js');

    var testdata = {};

    var testrunner = _"testrunner";

    var equalizer = _"equalizer";

    var testfiles = [ 
       /**/
       "first.md",
        "eval.md",
        "sub.md",
        "async.md",
        "scope.md", 
        "switch.md",
        "codeblocks.md",
        "indents.md",
        "savepipe.md",  
        "log.md",
        "load.md",
        "asynceval.md",
        "compile.md",
        "define.md",
        "blockoff.md",
        "raw.md",
        "h5.md",
        "ignore.md",
        "direval.md",
        "erroreval.md",
        "scopeexists.md",
        "subindent.md",
        "linkquotes.md",
        "cycle.md",
        "backslash.md",
        "templating.md",
        "reports.md",
        "empty.md",
        "switchcmd.md",
        "templateexample.md",
        "pushpop.md",
        "if.md",
        "version.md",
        "store.md",
        "directivesubbing.md",
        "done.md"
    ];


    Litpro.commands.readfile = Litpro.prototype.wrapAsync(_"test async", "readfile");


    var i, n = testfiles.length;

    for (i =0; i < n; i += 1) {
        testrunner(testfiles[i]);
    }

### testrunner

This is a function that sets up and then runs the test. We need a function to
avoid the implicit closures if it was looped over code. Yay async!

The plan is: read in the file, split it on `---`, figure out what is to be
input vs output and link the tests to the outputs being saved, and then
process the inputs. 

    function (file) {
 
        var pieces, name, i, n, td, newline, piece,
            start, text, j, m, filename;

        text = fs.readFileSync('./tests/'+file, 'utf-8');
        pieces = text.split("\n---");
        
        name = file + ": " + pieces.shift().split('-')[0].trim();

        td = testdata[name] = {
            start : [],
            in : {},
            out : {},
            log : []
        };

        
        _":set up test data"


        var folder = new Litpro({
            "on" : [
                ["need document", "fetch document"],
                ["document fetched", "compile document"]
                ],
             "action" : [
                ["fetch document", _"test fetch document"],
                ["compile document", _"test compile document"]
              ]
        });
        var gcd = folder.gcd;
        
        var log = td.log; 

        // gcd.makeLog();

       // gcd.monitor('', function (evt, data) { console.log(evt, data); });

        test(name, function (t) {
            var outs, m, j, out;

            folder.log = function (text) {
                if (log.indexOf(text) !== -1) {
                    t.pass();
                } else {
                
                console.log(text);
                    t.fail(text);
                }
            };
            

            outs = Object.keys(td.out);
            m  = outs.length;
            
            t.plan(m+log.length);
            
            for (j = 0; j < m; j += 1) {
                out = outs[j];
                gcd.on("file ready:" + out, equalizer(t, td.out[out]) );
            }

            start = td.start;
            n = start.length; 
            for (i = 0; i < n; i += 1) {
                filename = start[i];
                if (!folder.docs.hasOwnProperty(filename) ) { 
                    folder.newdoc(filename, td.in[filename]);
                }
            }

          // setTimeout( function () { console.log(folder.reportwaits().join("\n")); }); 

         // setTimeout( function () {console.log(gcd.log.logs().join('\n')); console.log(folder.scopes)}, 100);
        });
          // setTimeout( function () {console.log("Scopes: ", folder.scopes,  "\nReports: " ,  folder.reports ,  "\nRecording: " , folder.recording)}, 100);

    }




[set up test data]() 

Here we put the tests into testdata either as an input or output. If there are
just two, we assume the first is input and the second is output. The default
names are in and out, respectively. So we should save the output to out. 

The start listing are the ones that get specifically processed. The in, which
includes the starts, are those that can be loaded from within the documents. 

We split the log portion (if present) on `\n!`. We will expect a test for
each log entry and we will verify by the called log function text being in the
array. That should cover most cases. 


     if (pieces.length === 2) {
        // \n---\n  will be assumed and the rest is to be used
        // the first is input, the second is output
       td.start.push("in");
       td.in.in = pieces[0].slice(1);
       td.out.out = pieces[1].slice(1).trim();
    } else {
        m = pieces.length;
        for (j = 0; j < m; j += 1) {
            piece = pieces[j];
            newline = piece.indexOf("\n");
            if (piece.slice(0,3) === "in:") {
                td.in[piece.slice(3, newline)] = piece.slice(newline + 1);
            } else if (piece.slice(0,4) === "out:") {
                td.out[piece.slice(4, newline)] = 
                    piece.slice(newline + 1).trim();
            } else if (piece.slice(0,6) === "start:") {
                td.start.push(piece.slice(6, newline));
                td.in[piece.slice(6, newline)] = piece.slice(newline + 1);
            } else if (piece.slice(0,4) === "log:" ) {
                td.log = piece.slice(newline + 1).split("\n!");
                td.log.pop();
                td.log[0] = td.log[0].slice(1);
            }
        }
    }

   
### Equalizer

This is just a little function constructor to close around the handler for the
output file name. 

    function (t, out) {
        return function (text, evObj) {
            var gcd = evObj.emitter;
            if (text !== out) {
                if ( (text[text.length-1] === "\n") && 
                    (out[out.length-1] !== "\n" ) ) {
                    out += "\n";
                } else {
                    console.log(text + "---\n" + out);
                }
            }
            t.equals(text, out);
        };
    }

### Test fetch document

This will fetch the document from the ins of the testdata. 

The emit will be of the form "need document:file location",
with data being the actual file location.

    function (rawname, evObj) {
        var gcd = evObj.emitter;
        var filename = evObj.pieces[0];
        
        if (td.in.hasOwnProperty(filename) ) {
            gcd.emit("document fetched:" + filename, td.in[rawname]);        
        } else {
            console.log("ERROR~File not found: " + filename);
            gcd.parent.createScope(filename);
            gcd.emit("error:file not found:"+ filename);

        }

    }

### Test compile document

This takes in the text of a file and compiles it. 

    function (text, evObj) {
        var gcd = evObj.emitter;
        var filename = evObj.pieces[0];
        var folder = gcd.parent;

        folder.newdoc(filename, text);

    }

### Test async

This is the example async function. It takes in filename and gives out the
text after a timeout. This is to simulate a readfile, but without actually
using the file structures. 

    function (input, args, cb) {
        var f = function () {
            if (args[0] === "stuff") {
                cb(null, "Hello world. I am cool.");
            } else if ( args[0] === "hello") {
                cb(null, "'Hello world.' + ' I am js.'");
            } else {
                cb(new Error("no such file")) ;
            }
        };
        setTimeout(f, 5);
    }



### Test list


Test list
+ first was basic concatenation
+ command piping 
+ arguments using compiled blocks
+ async 
+ variables, storing and retrieving, scopes. 
+ switch piping
+ indented code block, code fence, pre, code fence with ignore, saving with
  default
+ getting subbed multiline indented blocks correct
+ command piping (save)
+ multiple input, output documents
+ async eval
+ test backslashing and implement compiling
+ command definitions
+ block on/off to exclude blocks 
+ raw
+ heading levels 5 and 6
+ directives to change ignorable languages
+ eval as directive
+ feedback for things that have not been compiled
+ error catching for evals? 

- something to run over headings, such as test h5 headings. at least an
  example.  Decided not to do this. Maybe a litpro-tape module for
  implementing a test directive. I am not sure what a doc helper might do. I
  think the basic idea is simply that it is a convenience to have common
  headings without interfering and that we have a little bit of help against
  name changes in the path syntax without that path syntax going nuts beyond
  reason. I like the independent sections not depending on it, but doc and
  test are a different matter. 


[off](# "block:")

## README


 # literate-programming-lib   [![Build Status](https://travis-ci.org/jostylr/literate-programming-lib.png)](https://travis-ci.org/jostylr/literate-programming-lib)

Write your code anywhere and in any order with as much explanation as you
like. literate-programming will weave it all together to produce your project.

This is a modificaiton of and an implementation of 
[Knuth's Literate Programming](http://www-cs-faculty.stanford.edu/~uno/lp.html)
technique. It is
perhaps most in line with [noweb](http://tex.loria.fr/litte/ieee.pdf). 

It uses markdown as the basic document format with the code to be weaved
together being markdown code blocks.  GitHub flavored code fences can also be used 
to demarcate code blocks. In particular, [commonmark](http://commonmark.org/)
is the spec that the parsing of the markdown is used. Anything considered code
by it will be considered code by literate programming. 

This processing does not care what language(s) your are programming in. But it
may skew towards more useful for the web stack. 

This is the core library that is used as a module. See 
[-cli](https://github.com/jostylr/literate-programming-cli)  for the command
line client. The [full](https://github.com/jostylr/literate-programming)
version has a variety of useful standard
plugins ("batteries included").

 ## Installation

This requires [node.js](http://nodejs.org) and [npm](https://npmjs.org/) to be
installed. See [nvm](https://github.com/creationix/nvm) for a recommend
installation of node; it allows one to toggle between different versions. This
has been tested on node.js .10, .12, and io.js.  It is basic javascript and
should work pretty much on any javascript engine. 

Then issue the command:

    npm install literate-programming-lib

Since this is the library module, typically you use the client version install
and do not install the lib directly. If you are hacking with modules, then you
already know that you will want this in the package.json file. 

 ## Using as a module

You can use `Folder = require('literate-programming-lib');` to get 
a constructor that will create what I think of as a folder.
The folder will handle all the documents and scopes and etc.  

To actually use this library (as opposed to the command line client), 
you need to establish how it fetches documents and tell
it how to save documents. An example is below. If you just want to compile
some documents, use the command line client and ignore this. Just saying the
following is not pretty. At least, not yet!

The thing to keep in mind is
that this library is strutured around events 
using my [event-when](https://github.com/jostylr/event-when) library. The
variable gcd is the event emitter (dispatcher if you will).

    
    var fs = require('fs');
    var Folder = require('literate-programming-lib');
    var folder = new Folder();
    var gcd = folder.gcd;
    var colon = folder.colon;
   
    gcd.on("need document", function (rawname) {
        var safename = colon.escape(rawname);
        fs.readfile(rawname, {encoding:'utf8'},  function (err, text) {
            if (err) {
                gcd.emit("error:file not found:" + safename);
            } else {
                folder.newdoc(safename, text);
            }
        });
    });

    gcd.on("file ready", function(text, evObj) {
        var filename = evObj.pieces[0]; 
        fs.writefile(filename, text);
    });
   
    gcd.emit("need document:first.md");

This last line should start the whole chain of compilation with first.md being read in
and then any of its files being called, etc., and then any files to save will
get saved. 

The reason the lib does not have this natively is that I separated it out
specifically to avoid requiring file system access. Instead you can use any kind of
function that provides text, or whatever. It should be fine to also use
`folder.newdoc` directly on each bit of text as needed; everything will
patiently wait until the right stuff is ready. I think. 

Note that live code can be run from a literate program as well. So be
careful!

 ## Example

Let's give a quick example of what a sample text might look like. 

    # Welcome

    So you want to make a literate program? Let's have a program that outputs
    all numbers between 1 to 10.

    Let's save it in file count.js

    [count.js](#Structure "save:")

    ## Structure 

    We have some intial setup. Then we will generate the array of numbers. We
    end with outputting the numbers. 

        var numarr = [], start=1, end = 11, step = 1;

        _"Loop"

        _"Output"

    ## Output 

    At this point, we have the array of numbers. Now we can join them with a
    comma and output that to the console.

        console.log("The numbers are: ", numarr.join(", ") );

    ## Loop

    Set the loop up and push the numbers onto it. 

        var i;
        for (i = start; i < end; i += step) {
            numarr.push(i);
        }

A full example of a literate program is lp.md in this repository. It compiles
to this library. 


 ## Document syntax

A literate program is a markdown document with some special conventions. 

The basic idea is that each header line (regardless of level, either atx # or
seText underline ) demarcates a full block. Code blocks within a full block
are the bits that are woven together. 

 ### Code Block

Each code block can contain whatever kind of code, but there is a primary special
syntax.  

`_"Block name"` This tells the compiler to compile the block with "Block
   name" and then replace the `_"Block name"` with that code.

Note the the allowed quotes are double, single, and backtick. Matching types
are expected. And yes, it is useful to have three different types. 

The full syntax is something of the form 
`_"scope name::block name:minor block name | cmd arg 1, arg 2 | cmd2 |cmd3 ..."`
where the scope name allows us to refer to other documents (or artificial
common scopes) and the commands run the output of one to the input of the
other, also taking in arguments which could they themselves be block
substitutions. 

Note that one can also backslash escape the underscore. To have multiple
escapes (to allow for multiple compiling), one can use `\#_"` where the number
gets decremented by one on each compile and, when it is compiled with a 0 there,
the sub finally gets run.

A block of the form `_":first"` would look for a minor block, i.e., a block
that has been created by a switch directive. See next section. 

 ### Directive

A directive is a command that interacts with external input/output. Just about
every literate program has at least one save directive that will save some
compiled block to a file. 

The syntax for the save directive is 

    [file.ext](#name-the-heading "save: encoding | pipe commands")  

where 

* `file.ext` is the name of the file to save to
* `name-the-heading` is the heading of the block whose compiled version is being saved. 
Spaces in the heading get converted to dashes for id linking purposes.  Colons can be used
to reference other scopes and/or minor blocks. In particular, `#:jack` will
refernce the `jack` minor in the current heading block where the save
directive is located.
* `save:` is there to say this is the directive to save a file
* `encoding` is any valid encoding of
  [iconv-lite](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings).
  This is relevant more in the command line module, but is here as the save
  directive is here. 
* `pipe commands` optional commands to process the text before saving. See
  next section. 


For other directives, what the various parts mean depends, but it is always 

    [some](#stuff "dir: whatever")  

where the `dir` should be replaced with a directive name. If dir is absent,
but the colon is there, then this demarcates a minor block start.   

 ### Pipes

One can also use pipes to pipe the compiled text through a command to do
something to it. For example, `_"Some JS code | jshint"`  will take the code
in block `some JS code` and pipe it into the jshint command which can be a 
thin wrapper for the jshint module and report errors to the console.
That command would then return the text in an untouched fashion.  We can also use 
pipe commands to modify the text. 

Commands can be used in block substitutions, minor block directive switches, and
other directives that are setup to use them such as the save and out directive:  
`[code.js](#some-js-code "save: | jstidy)` will tidy up the code
before storing it in the file `code.js`. 

If you want your own directive to process pipes, see the [save directive](https://github.com/jostylr/literate-programming-lib/blob/master/lp.md#save)  in
lp.md. Pay particular attention to the "process" and "deal with start" minor
blocks. The functionality of pipe parsing is in the `doc.pipeParsing` command,
but there events that need to be respected in the setup. 

Commands take arguments separated by commas and commands end with pipes or the
block naming quote. One can also use a named code block as an argument, using
any of the quote marks (same or different as surroung block name). To
escape commas, quotes, pipes, underscores, spaces (spaces get trimmed from the
beginning and ending of an argument), newlines, one can use a backslash, which
also escapes itself. Note that the commonmark parser will escape all
backslash-punctuation combinations outside of code blocks. So you may need a
double backslash in directive command pipings. 

You can also use `\n` to puta newline in line or `\u...` where the ... is a
unicode codepoint per javascript spec implemented by [string.fromcodepoint](https://github.com/mathiasbynens/String.fromCodePoint).    


 ### Minor Block

Finally, you can use distinct code blocks within a full block. If you simply
have multiple code blocks with none of the switching syntax below, then they
will get concatenated into a single code block. 

You can also switch to have what I call minor blocks within a main heading. This is mainly
used for small bits that are just pushed out of the way for convenience. A
full heading change is more appropriate for something that merits separate attention. 

To create a minor block, one can either use a link of the form `[code name]()` or 
`[code name](#whatever ":|cmd ...")` Note this is a bit of a break from
earlier versions in which a link on its own line would create a minor block. Now it is
purely on the form and not on placement. 


Example: Let's say in heading block `### Loopy` we have `[outer loop]()` 
Then it will create a code block that can be referenced by
`_"Loopy:outer loop"`.

Note: If the switch syntax is `[](#... ":|...")` then this just transforms
whatever is point to in href using the pipe commands. That is, it is not a
switch, but fills in a gap for main blocks not having pipe switch syntax. The
key is the empty link text.

 #### Templating

One use of minor blocks is as a templating mechanism.

    ## Top

    After the first compile, the numbers will be decremented, but the blocks
    will not be evaluated.
    
        \1_":first"

        \2_":second"
        
        \1_":final"


    This is now a template. We could use it as

    [happy.txt](# "save:| compile basic, great")
    [sad.txt](# "save:| compile basic, grumpy")


    # Basic

    [first]()
        
        Greetings and Salutations

    [final]()

        Sincerely,
        Jack

    # Great

    [second]()

        You are great.

    # Grumpy

    [second]()

        You are grumpy.

This would produce two text files 


happy.txt: 

    Greetings and Salutations

    You are great.

    Sincerely,
    Jack

sad.txt: 

    
    Greetings and Salutations

    You are grumpy.
    

    Sincerely,
    Jack

    
Note that you need to be careful about feeding in the escaped commands into
other parsers. For example, I was using Jade to generate HTML structure and
then using this templating to inject content (using markdown). Well, Jade
escapes quotes and this was causing troubles. So I used backticks to delimit
the block name instead of quotes and it worked fine. Be flexible.


 ## Nifty parts of writing literate programming

* You can have your code in any order you wish. 
* You can separate out flow control from the processing. For example,

        if (condition) {
            _"Truth"
        } else {
            _"Beauty"
        }
    
    The above lets you write the if/else statement with its logic and put the
    code in the code blocks `truth` and `beauty`. This can help keep one's
    code to within a single screenful per notion. 
* You can write code in the currently live document that has no effect, put in
  ideas in the future, etc.
* You can "paste" multiple blocks of code using the same block name. This is
  like DRY, but the code does get repeated for the computer. You can also
  substitute in various values  in the substitution process so that code
  blocks that are almost the same but with different names can come from the
  same root structure. 
* You can put distracting data checks/sanitation/transformations into another
  block and focus on the algorithm without the use of functions (which can be
  distracting). 
* You can process the blocks in any fashion you want. So for example, to
  create a JSON object, one could use a simpler setup appropriate for the
  particular data and then transform it into JSON. It's all good. 
* This brings DSL and grunt power, written in the same place as your code. It
  is really about coding up an entire project. 

I also like to use it to compile an entire project from a single file, pulling
in other literate program files as needed. That is, one can have a
command-and-control literate program file and a bunch of separate files for
separate concerns. But note that you need not split the project into any
pre-defined ways. For example, if designing a web interface, you can organize
the files by widgets, mixing in HTML, CSS, and JS in a single file whose
purpose is clear. Then the central file can pull it all in to a single web
page (or many) as well as save the CSS and JS to their own files as per the
reommendation, lessing the CSS, tanspiling ES6, linting, and minifying all as
desired. Or you could just write each output file separate in its own litpro
document.

It's all good. You decide the order and grouping. The structure of your litpro
documents is up to you and is **independent** of the needed structures of the
output. 

 ## Built in directives

There are a variety of directives that come built in.
    
* **Save** `[filename](#start "save:options|commands")` Save the text from start
  into file filename. The options can be used in different ways, but in the
  command client it is an encoding string for saving the file; the default
  encoding is utf8.
* **Store** `[name](#start "store:value|...")`  If the value is present, then
  it is sent through the pipes. If there is no
  value, then the `#start` location is used for the value and that gets piped.
  The name is used to store the value. 
* **Transform** `[](#start "transform:|...)` or `[](#start ":|...")`.
  This takes the value that start points to and transforms it using the pipe
  commands. Note one can store the transformed values using the store command
  (not directive).   
* **Load** `[alias](url "load:options")` This loads the file, found at the url
  (file name probably) and stores it in the alias scope as well as under the
  url name. We recommend using a short alias and not relying on the filename
  path since the alias is what will be used repeatedly to reference the blocks
  in the loaded file. Options are open, but for the command line client it is
  the encoding string with default utf8. Note there are no pipes since there
  is no block to act on it.
* **Define** `[command name](#start "define: async/sync/raw|cmd")` This allows one
  to define commands in a lit pro document. Very handy. Order is irrelevant;
  anything requiring a command will wait for it to be defined. This is
  convenient, but also a bit more of a bother for debugging. Anyway, the start
  is where we find the text for the body of the command. The post colon, pre
  pipe area expects one of three options which is explained below in plugins.
  The default is sync which if you return the text you want to pass along from
  the command, then it is all good. Start with that. You can also pipe your
  command definition through pipe commands before finally installing the
  function as a live function. Lots of power, lots of headaches :) The
  signature of a command is `function (input, args, name)` where the input is
  the text being piped in, the args are the arguments array (all text) of the
  command, and name is the name to be emitted when done. For async, name is a
  callback function that should be called when done. For sync, you probably
  need not worry about a name. The doc that is calling the command is the
  `this`. 
* **Block**s on/off `[off](# "block:")` Stops recording code blocks. This is
  good when writing a bunch of explanatory code text that you do not want
  compiled. You can turn it back on with the `[on](# "block:")` directive.
  Directives and headings are still actively being run and used. These can be
  nested. Think "block comment" sections. Good for turning off troublesome
  sections. 
* **Eval** `[?](# "eval:)` Whatever block the eval finds itself, it will eval. It
  will eval it only up to the point where it is placed. This is an immediate
  action and can be quite useful for interventions. The eval will have access
  to the doc object which gives one access to just about everything else. This
  is one of those things that make running a literate progamming insecure. The
  return value is nonexistent and the program will not usually wait for any async
  actions to complete. 
* **Ignore** `[language](# "ignore:")` This ignores the `language` code blocks.
  For example, by convention, you could use code fence blocks with language js
  for compiled code and ignore those with javascript. So you can have example
  code that will not be seen and still get your syntax highlighting and
  convenience. Note that this only works with code fences, obviously. As soon
  as this is seen, it will be used and applied there after. 
* **Out**  `[outname](#start "save:|commands")` Sends the text from start
  to the console, using outname as a label.
* **New scope** `[scope name](# "new scope:")` This creates a new scope (stuff
  before a double colon). You can use it to store variables in a different
  scope. Not terribly needed, but it was easy to expose the underlying
  functionality. 
* **Link Scope** `[alias name](# "link scope:scopename")` This creates an alias for
  an existing scope. This can be useful if you want to use one name and toggle
  between them. For example, you could use the alias `v` for `dev` or `deploy`
  and then have `v::title` be used with just switching what `v` points to
  depending on needs. A bit of a stretch, I admit. 
* **Log** `[match string](# "log:")` This is a bit digging into the system. You
  can monitor the events being emitted by using what you want to match for. 
  For example, you could put in a block name (all lower cased) and monitor all
  events for that. This gets sent to `doc.log` which by default prints to
  `console.log`. If you use `\:` in the match string, this becomes the triple
  colon separator that we use for techinical reasons for `block:minor` name syntax. 
  This directive's code gives a bit of insight as to how to get
  more out of the system.
* **If** `[...](... "if: flag; directive:...")` If flag holds true (think build
  flag), then the driective is executed with the arguments as given. A couple
  of great uses are conditional evaling which allows for a great deal of
  flexibility and conditional block on/off which may be useful if there is
  extensive debugging commands involved. 
* **Flag** `[flag name](# "flag:")` This sets the named flag to true. Note
  there is no way to turn a flag off easily. 
* **Version** `[name](# "version: number ; tagline")` This gives the name and version of
  the program. Note the semicolon separator.
  Saves `g::docname`, `g::docversion`, `g::tagline`.
* **npminfo** `[author name](github/gituser "npminfo: author email; deps: ;
  dev: " )` This takes in a string for some basic author information and
  dependencies used. To add on or modify how it handles the deps, dev, etc.,
  modify the `types` object on `Folder.directives.npminfo`.
  Saves `g::authorname`, `g::gituser`, `g::authoremail`, `g::npm
  dependencies`, `g::npm dev dependencies`.

 ## Built in commands

Note commands need to be one word. 

* **Eval** `code1, code2,...`  The arguments are concatenated together. Then they
  are evaluated in the context with the `text` variable having the incoming
  text and its value after evaling the arguments will be what is returned.
  This should make for quick hacking on text. The doc variable is also
  available for inpsecting all sorts of stuff, like the current state of the
  blocks. If you want to evaluate the incoming text and use the result as
  text, then the line `text = eval(text)` as the first argument should work.
* **Async** (async eval) `code1, code2, ...` Same deal as eval, except this code
  expects a callback function to be called. It is in the variable callback. So
  you can read a file and have its callback call the callback to send the text
  along its merry way. 
* **Compile** This compiles a block of text as if it was in the document
  originally. The compiled text will be the output. The arguments give the
  names of blocknames that are used if short-hand minor blocks are
  encountered. This is useful for templating. 
* **Sub** `key1, val1, key2, val2, ...`  This replaces `key#` in the text with
  `val#`. The replacement is sorted based on the length of the key value. This
  is to help with SUBTITLE being replaced before TITLE, for example, while
  allowing one to write it in an order that makes reading make sense. A little
  unorthodox. We'll see if I regret it. 
* **Store** `variable name`  This stores the incoming text into the variable name.
  This is good for stashing something in mid computation. For example, 
  `...|store temp | sub THIS, that | store awe | _"temp"` will stash the
  incoming text into temp, then substitute out THIS for that, then store that
  into awe, and finally restore back to the state of temp. Be careful that the
  variable temp could get overwritten if there are any async operations
  hanging about. Best to have unique names. See push and pop commands for a
  better way to do this. 
* **Log** This will output a concatenated string to doc.log (default console.log)
  with the incoming text and the arguments. This is a good way to see what is
  going on in the middle of a transformation.
* **Raw** `start, end` This will look for start in the raw text of the file and
  end in the file and return everything in between. The start and end are
  considered stand-alone lines. 
* **Trim** This trims the incoming text, both leading and trailing whitespace.
  Useful in some tests of mine. 
* **Cat**  This will concatenate the incoming text and the arguments together
  using the first argument as the separator. Note one can use `\n` as arg1
  and it should give you a newline (use `\\n` if in a directive due to parser
  escaping backslashes!). If there is just one argument, then it is
  concatenated with the incoming text as is. No separator can be as easy as 
  `|cat ,1,2,...`.
* **Push** Simply pushes the current state of the incoming text on the stack
  for this pipe process.
* **Pop** Replaces the incoming text with popping out the last unpopped pushed
  on text.
* **If** `flag, cmd, arg1, arg2, ....` If the flag is present (think build
  flag), then the command will execute with the given input text and
  arguments. Otherwise, the input text is passed on.
* **When** `name1, name2, ...` This takes in the event names and waits for
  them to be emitted by done or manually with a
  `doc.parent.done.gcd.once(name, "done")`. That would probably be used in
  directives. The idea of this setup is to wait to execute a cli command for
  when everything is setup. It passes through the incoming text. 
* **Done** `name` This is a command to emit the done event for name. It just
  passes through the incoming text. The idea is that it would be, say, a
  filename of somehting that got saved. 

 ## h5 and h6

So this design treats h5 and h6 headings differently. They become subheadings
of h1-4 headings. So for example,  if we have `# top` and then `##### doc` and
`###### something` then the sections would be recorded as `top, top/doc,
top/doc/something` and we have a path syntax such as `../` which would yield
`top/doc` if placed in `top/doc/something`. Ideally, this should work as you
imagine. See `tests/h5.md` for the test examples.


 ## Plugins

This is a big topic which I will only touch on here. You can define commands
in the text of a literate program, and we will discuss this a bit here, but
mostly, both commands and directives get defined in module plugins or the `lprc.js`
file if need be. 

 ### Defining Commands

The define directive allows one to create commands within a document. This is
a good place to start getting used to how things work. 

A command has the function signature `function (input, args, name)-> void`
where the input is the incoming text (we are piping along when evaluating
commands), args are the arguments that are comma separated after the command
name, and the name is the name of the event that needs to be emitted with the
outgoing text. The function context is the `doc` example.

A minimal example is 

    function ( input, args, name) {
        this.gcd.emit(name, input);
    }

We simply emit the name with the incoming text as data. We usually use `doc`
for the `this` variable. This is the `raw` option in the define directive. 

The default is `sync` and is very easy. 

    function ( input, args, name) {
        return input;
    }

That is, we just return the text we want to return. In general, the name is
not needed though it may provide context clues. 

The third option is an `async` command. For those familiar with node
conventions, this is easy and natural. 

    function (input, args, callback, name) {
        callback(null, input);
    }

The callback takes in an error as first argument and, if no error, the text to
output. One should be able to use this as a function callback to pass into
other callback async setups in node. 

So that's the flow. Obviously, you are free to do what you like with the text
inside. You can access the document as `this` and from there get to the event
emitter `gcd` and the parent, `folder`, leading to other docs. The scopes are
available as well. Synchronous is the easiest, but asynchronous control flow
is just as good and is needed for reading files, network requests, external
process executions, etc. 

 ### Plugin convention.

I recommend the following npm module conventions for plugins for
literate-programming. 

1. litpro-... is the name. So all plugins would be namespaced to litpro.
   Clear, but short. 
2. Set `module.exports = function(Folder, other)` The first argument is the
   Folder object which construts folders which constructs documents. By
   accessing Folder, one can add a lot of functionality. This access is
   granted in the command line client before any `folder` is created. 

   The other argument depends on context, but for the command line client it
   is the parsed in arguments object. It can be useful for a number of
   purposes, but one should limit its use as it narrows the context of the
   use. 
3. Define commands and, less, directives. Commands are for transforming text,
   directives are for doing document flow maipulations. Other hacks on
   `Folder` should be even less rare than adding directives. 
4. Commands and directives are globally defined. 
5. `Folder.commands[cmd name] = function (input, args, name)...` is how to add a
   command function. You can use `Folder.sync(cmdname, cmdfun)` and
   `Folder.async` to install sync and async functions directly in the same
   fashion as used by the define directive.
6. `Folder.directives[directive name] = function (args)` is how to install a
   directive. There are no helper functions for directives. These are more for
   controlling the flow of the compiling in the large. The arg keys are read
   off from `[link](href "directive:input")`. Also provided is the current
   block name which is given by the key `cur`. 
7. If you want to do stuff after folder and its event emitter, gcd, is
   created, then you can modify Folder.postInit to be a function that does
   whatever you want on a folder instance. Think of it as a secondary
   constructor function.
8. The Folder has a plugins object where one can stash whatever under the
   plugin's name. This is largely for options and alternatives. The folder and
   doc object have prototyped objects on this as well which allows one to
   choose the scope of applicability of objects. But beware that subobjects
   are not prototyped (unless setup in that way; you may want to implement
   that by Object.creating what is there, if anything). Think of it as deciding
   where options should live when creating them. 

 ### Structure of Doc and Folder

To really hack the doc compiling, one should inspect the structure of Folder,
folder, and doc.  The Folder is a constructor and it has a variety of
properties on it that are global to all folders. But it also has several
prototype properties that get inherited by the folder instances. Some of those
get inherited by the docs as well. For each folder, there is also a gcd object
which is the event emitter, which comes from the, ahem, magnificient event-when
library (I wrote it with this use in mind). In many ways, hacking on gcd will
manipulate the flow of the compiling. 

I wrote the folder instance to maintain flexibility, but typically (so far at
least), one folder instance per run is typical. Still, there might be a use
for it in say have a development and production compile separate but running
simultaneously?


 #### Folder
 
These are the properties of Folder that may be of interest.

* commands. This is an object that is prototyped onto the instance of a
  folder. Changing this adds commands to all created folder instances. 
* directives. This holds the directives. Otherwise same as commands.
* reporter. This holds the functions that report out problems. See
  reporters below. This is not prototyped and is shared across instances.
* postInit. This does modification of the instance. Default is a noop. 
* sync, async. These install sync and async commands, respectively. 
* plugins. This is a space to stash stuff for plugins. Use the plugin sans
  litpr as the key. Then put there whatever is of use. The idea is if you
  require something like jshint and then want default options, you can put
  that there. Then in a lprc file, someone can override those options it will
  be applied across the project.


 #### folder

Each instance of folder comes with its own instances of:

* docs. Holds all the documents.
* scopes. Holds all the scopes which are the stuff before the double colon. It
  includes the blocks from the compiled docs but also any created scopes.
* reports. This holds all the reports of stuff waiting. As stuff stops
  waiting, the reports go away. Ideally, this should be empty when all is
  done.
* stack. This is for the push and pop of text piping. 
* maker. Just an internal bit that is probably of no interest to anyone.
* gcd. This is the event-emitter shared between docs, but not folders. Default
  actions are added during the instantiation, largely related to the parsing
  which sets up later. If you want to log what goes on, you may want to look
  at the event-when docs (makeLog is a good place to start).
* flags. This holds what flags are present. 

and shares via the prototype

* parse. This parses the text of docs using commonmark spec
* newdoc. This creates a new document. Kind of a constructor, but simply
  called as a function. it calls the constructor Doc.
* colon. We replace colons with a unicode triple colon for emitting purposes
  of block names (event-when uses colon as separators too). This contains the
  escape (does replacement), restore (undoes it), and v which is the unicode
  tripe colon. If the v is replaced entirely, everything should hopefully work
  just fine with a new separator.
* createScope. Creating a scope. 
* join. What is used to concatenate code blocks under same block heading.
  Default is "\n"
* log. What to do with logging. Defaults to console.log.
* indicator. An internal use to allow escaping of whitespace in command
  arguments that would otherwisebe trimmed. 
* wrapSync, wrapAsync. These wrap functions up for command sync, async, but do
  not install them. Not sure why not install them. 
* subnameTransform. A function that deals with shorthand minor substitutions
  that avoid using the main block heading. This can be overwritten if you want
  some custom behavior. 
* reportwaits. This is a function that produces the reports of what is still
  waiting. Very useful for debugging. Default is to use reporters and send it
  to log. 
* Doc. This is the constructor for documents. 


and uses Object.create to kind of share 

* commands
* directives
* plugins

and direct copying from

* reporters

 #### doc

Each file leads to a doc which is stored in the folder. Each doc has a variety
of stuff going on. 

Unique to each instance

* file. The actual path to the file. It is treated as unique and there is a
  scope dedicated to it. Don't mess with it. It is also how docs are keyed in
  the folder.docs object.
* text. The actual text of the file.
* blockOff. This tracks whether to take in code blocks as usual. See blocks
  directive. If 0, code blocks are queued up. If greater than 1, code blocks
  are ignored. 
* levels. This tracks the level of the heading that is currently being used.
  See h5/h6 description
* blocks. Each heading gets its own key in the blocks and the raw code blocks
  are put here.
* heading, curname. These are part of the block parsing. curname is the full
  name while heading excludes minor block names.
* vars. This is where the variables live. As each code block is compiled,
  its result gets stored here. But one can also add any bit of var name and
  text to this. 
* parent. This is the folder that contains this doc.


Inherited from folder

* commands, modifications affect all
* directives, modifications affect all
* scopes, modifications affect all
* gcd, modifications affect all. Be careful to scope added events to files,
  etc. 
* plugins, modifications affect all
* maker, Object.created
* colon, Object.created
* join, overwriting will only affect doc
* log, overwriting will only affect doc
* subnameTransform, overwriting will only affect doc
* indicator, overwriting will only affect doc
* wrapSync, wrapAsync, overwriting will only affect doc

Prototyped on Doc. Almost all are internal and are of little to no interest.

* pipeParsing. This parses the pipes. This may be useful if you want to do
  something like in the save or define directives. Check them out in the
  source if you want to see how to use it. 
* blockCompiling. This is what the compile command taps into. See how it is
  done there. 
* getscope. Looks up a scope and does appropriate async waiting for an
  existing scope if need be.
* retrieve. retrieves variable.
* createLinkedScope. Creates a link to a scope and notifies all.
* indent. This is the default indenting function for subbing in multi-line
  blocks. The default idea is to indent up to the indent of the line that
  contains the block sub; further existing indentation in sublines is
  respected on top of that. 
* getIndent. Figuring out the indent
* substituteParsing
* regexs. Some regular expressions that are used in the parsing of the code
  blocks.
* backslash. The backslash function applied to command arguments.
* whitespaceEscape. Handling whitespace escaping in conjunction with
  backslash. Putting the whitespace back.
* store. stores a variable.

 #### Reporting

A key feature of any programming environment is debugging. It is my hope that
this version has some better debugging information. The key to this is the
reporting function of what is waiting around. 

The wait it works is that when an event of the form `waiting for:type:...` is
emitted with data `[evt, reportname, ...]` then reporters gets a key of the
event string wthout the `waiting for:`, and when the `evt` is emitted, it is
removed. 

If it is still waiting around when all is done, then it gets reported. The
reportname is used to look up which reporter is used. Then that reporter takes
in the remaining arguments and produces a string that will be part of the
final report that gets printed out. 


 ## LICENSE

[MIT-LICENSE](https://github.com/jostylr/literate-programming-lib/blob/master/LICENSE-MIT)
!----

## TODO

Check problematic syntax for erroring and reporting. 

Implement dead simple ways to setup a directive with pipes. Done. Document
them, add store directive options as described in
new doc version. 

Make pipes escapable in options; write a general escape kind of setup.

Implement better argument parsing. What something like `md tex($..$, $$..$$),
log|` to work out. That is, make it so that one can have comma'd arguments.
Quotes and brackets would switch it to a different mode where it only cares
about finding the end, ignoring other stuff in there except maybe
subsitutions.  Also, maybe allowing `tex(_"tex delim")`. That is, having
subsitutions anywhere in the arguments. 



add to docs:  we have long functions or we have short functions. Long
functions are hard to understand cause they are long. Short functions are
fine, except the boilerplate to set them up gets a bit much. So we use long
functions, generally, using lit pro blocks to act as if we have short
functions without the boilerplate. 


!----

[on](# "block:")


## lprc

This is compiled by litpro and uses the following lprc.js file

    module.exports = function(Folder, args) {

        if (args.file.length === 0) {
            args.file = ["lp.md"];
        }
         args.build = ".";
         args.src = ".";

        require('litpro-jshint')(Folder, args);

    };


## NPM package

The requisite npm package file. 



    {
      "name": "_`g::docname`",
      "description": "_`g::tagline`",
      "version": "_`g::docversion`",
      "homepage": "https://github.com/_`g::gituser`/_`g::docname`",
      "author": {
        "name": "_`g::authorname`",
        "email": "_`g::authoremail`"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/_`g::gituser`/_`g::docname`.git"
      },
      "bugs": {
        "url": "https://github.com/_`g::gituser`/_`g::docname`/issues"
      },
      "licenses": [
        {
          "type": "MIT",
          "url": "https://github.com/_`g::gituser`/_`g::docname`/blob/master/LICENSE-MIT"
        }
      ],
      "main": "index.js",
      "engines": {
        "node": ">=0.10"
      },
      "dependencies":{
        _"g::npm dependencies"
      },
      "devDependencies" : {
        _"g::npm dev dependencies"
      },
      "scripts" : { 
        "test" : "node ./test.js"
      },
      "keywords": ["literate programming"]
    }


## gitignore

    node_modules
    temp
    /.checksum
    /build

## npmignore


    tests
    test.js
    travis.yml
    ghpages
    node_modules
    *.md


## Travis

A travis.yml file for continuous test integration!

    language: node_js
    node_js:
      - "0.10"
      - "iojs"
      - "0.12"


## LICENSE MIT


    The MIT License (MIT)
    Copyright (c) _"g::year" _"g::authorname"

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.





by [James Taylor](https://github.com/jostylr "npminfo: jostylr@gmail.com ; 
    deps: event-when 1.0.0, commonmark 0.17.1, string.fromcodepoint 0.2.1;
    dev: tape 3.5.0, litpro-jshint 0.1.0")
