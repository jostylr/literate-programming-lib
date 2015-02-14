# [literate-programming-lib](# "version:0.9.0")

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
* [README.md](#readme "save:| clean raw") The standard README.
* [package.json](#npm-package "save: json  | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: | clean raw") A list of growing and shrinking items todo.
* [LICENSE](#license-mit "save: | clean raw") The MIT license as I think that is the standard in the node community. 
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
emitter 


    /*global require, module */
    /*jslint evil:true*/

    var EvW = require('event-when');
    var marked = require('marked');
    require('string.fromcodepoint');
   

    var apply = _"apply";

    var commands, directives;

    var Folder = _"folder constructor";

    Folder.prototype.parse = _"marked";

    Folder.prototype.newdoc = _"Make a new document";

    Folder.prototype.colon = _"colon";

    Folder.prototype.createScope = _"Create global scope";

    Folder.prototype.join = "\n";

    Folder.prototype.log = function (text) { console.log(text); };
    
    var sync = Folder.prototype.wrapSync = _"Command wrapper sync";

    var async = Folder.prototype.wrapAsync = _"Command wrapper async";

    Folder.prototype.commands = _"Commands";
    Folder.prototype.directives = _"Directives";


    var Doc = _"doc constructor";

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

    function (actions) {

        var gcd = this.gcd = new EvW();
        this.docs = {};
        this.scopes = {};

        
        this.maker = _"maker";

        gcd.parent = this;

        _":handlers"

        if (actions) {
            apply(gcd, actions);
        }

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
        
        this.levels = {};
        this.blocks = {};
        this.scopes = {};
        this.vars = parent.createScope(file);

        this.commands = Object.create(parent.commands);
        this.directives = Object.create(parent.directives);
        this.maker = Object.create(parent.maker);
        this.colon = Object.create(parent.colon); 
        this.join = parent.join;
        this.log = this.parent.log;
        this.scopes = this.parent.scopes;
    
        if (actions) {
            apply(gcd, actions);
        }

        return this;

    }


[prototype]()


    Doc.prototype.retrieve = _"variable retrieval";

    Doc.prototype.getScope = _"get scope";

    Doc.prototype.createLinkedScope = _"create linked scope";
     
    Doc.prototype.indent = _"indent";

    Doc.prototype.blockCompiling = _"block compiling";
    
    Doc.prototype.substituteParsing = _"Substitute parsing";

    Doc.prototype.pipeParsing = _"Parsing commands";

    Doc.prototype.regexs = _"Command regexs";

    Doc.prototype.backslash = _"Backslash";

    Doc.prototype.wrapSync = Folder.prototype.wrapSync;

    Doc.prototype.wrapAsync = Folder.prototype.wrapAsync;

    Doc.prototype.store = _"Store";

    




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
            doc.maker['emit text ready']( pipename + colon.v + "0", 
                gcd));
        gcd.once("text ready:" + pipename, 
            doc.maker.store(curname, doc, fname));
    } else { //just go
        gcd.once("minor ready:" + fname, 
            doc.maker['store emit'](curname, doc, fname));
    }


[code]()

Code blocks are concatenated into the current one. The language is ignored for
this.

If no language is provided, we just call it none. Hopefully there is no
language called none?! 

We join them by adding doc.join character; this is default a newline. 

    code block found --> add code block
    _":heading vars"
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

So this is a quick sketch of the kinds of events and actions that get taken in
the course of compiling. A tilder means it is not literal but rather a
variable name. 

* Document compiling starts with a `need parsing:~filename, text`


* `text ready` is for when a text is ready for being used. Each level of use
  had a name and when the text is ready it gets emitted. The emitted data
  should either by text itself or a .when wrapped up [[ev, data]] setup.  

* filename:blockname;loc;comnum;argnum(;comnum;argnum...)




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

        var doc = new Doc(name, text, parent, actions);
        
        try {
            parent.parse(doc);
        } catch (e) {
            console.log(doc);       
        }

        return doc;

    }

## marked

Here we model the flow of parsing of the text. We use the parser marked but
have overwrite its output. Or rather, we output events.

We wrap it all in a function using a closure for the file and gcd variables
for emitting purposes. 

We have a .when for being done with parsing. Any kind of async in the
rendering (directives!) can be waited for with a `.when(..., "parsing
done:"+file);`

    function (doc) {

        var gcd = doc.gcd;
        var file = doc.file;
    
        gcd.when("marked done:"+file, "parsing done:"+file);

        gcd.on("parsing done:"+file, function () {
            doc.parsed = true;
        });
        
        var renderer = new marked.Renderer(); 

        renderer.heading = _":heading";
        renderer.code = _":code";
        renderer.link = _":link";   
        
        marked(doc.text, {renderer:renderer});

        gcd.emit("marked done:" + file);


    }

[heading]()

Headings create blocks. We emit an event to say we found one.

    function (text, level) {
        gcd.emit("heading found:"+level+":"+file,text);
        return text;
    }
    
[code]()

We emit found code blocks with optional language. These should be stored and
concatenated as need be. 

    function (code, lang) {
        if (lang) {
            gcd.emit("code block found:"+lang+":"+file,code);
        } else {
            gcd.emit("code block found:"+ file, code);
        }
        return code;
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

    function (href, title, text) {
        var ind;
        var pipes, middle;
        if ((!href) && (!title)) {
            gcd.emit("switch found:"+file, [text, ""]);
        } else if (title[0] === ":") {
            ind = 0;
            _":before pipe"
            if (middle) {
                text += "." + middle.toLowerCase();    
            }
            gcd.emit("switch found:" + file, [text,pipes]);
        } else if ( (ind = title.indexOf(":")) !== -1) {
            gcd.emit("directive found:" + 
               title.slice(0,ind).trim().toLowerCase() + ":" + file, 
                { link : text,
                 input : title.slice(ind+1),
                 href: href, 
                 cur: doc.curname});
        }
        return text;
    }

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

To exclude a block from the compiling phase, use the directive `exclude block`
at the end of the heading block. 

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

    function (block, file, bname) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        
        var found, quote, place, qfrag, lname, 
            backcount, indent, first, chr, slashcount;
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
                found = ind;
                ind += 1;

                _":check for quote"
                
                _":check for escaped" 

                _":we are a go"
            

                last = ind = doc.substituteParsing(block, ind+1, quote, lname);
                
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

So we need to see if there are backslashes before the underscore. We first
decide if there are any and how many. If there are, then we need to cut a
fragment off pre slashes. Next, we figure out if the underscore is escaped and
replace any backslashes that have been escaped. With one slash, we continue
the loop ignoring all that has been.  We subtract 2 from ind since we already
incremented for smooth continuity. 

     place = ind-2;
     slashcount = 0;
     while (block[place] === '\\') {
        slashcount += 1;
        place -= 1;
     }
     if (slashcount) {
        _":deal with escapes"
     }

[deal with escapes]() 

Here we are in the case of escapes. It is not particularly efficient but should rarely
happen. We definitely split here at this point.

If underscore is escaped, then we cut up to ind (remember it is added 1
already). This cuts to the underscore. 

    qfrag = ''; 
    while (slashcount > 1) {
        qfrag += "\\";
        slashcount -= 2;
    }

    frags[loc] = block.slice(last,place+1)+qfrag + 
       ( ( slashcount === 1) ? "\u005F" : "" ) ;
    loc += 1;
    if (slashcount === 1) {
        last = ind; // will start next frag after escaped underscore.
        continue;
    } else {
        last = ind-1; // probably overwritten before used
    }

Gonna need some testing here.


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
        doc.maker['location filled'](lname, loc, doc, frags, indents));
    gcd.when("location filled:" + lname, 
        "ready to stitch:" + name
    );
    if (place > 0) {
        _":figure out indent"
    } else {
       indents[loc] = [0,0];
    }
    loc += 1;


[stitching]()

Here we stitch it all together. Seems simple, but if this is a minor block,
then we need to run the commands if applicable after the stitching. 

    if (bname.indexOf(colon.v) !== -1) {
        gcd.once("ready to stitch:" + name, 
            doc.maker['stitch emit'](name, frags, gcd));
    } else {
        gcd.once("ready to stitch:"+name,
            doc.maker['stitch store emit'](bname, name, frags, doc));
    }


[figure out indent]()

What is the indent? We need to find out where the first new line is and the
first non-blank character. If the underscore is first, then we have an indent
for all lines in the end; otherwise we will indent only at the end. 

The if checks if we are already at the beginning of the string; if not, we
look at the character. first is first non-blank character. 

Our goal is to line up the later lines with the first non blank character
(though usually they will have their own indent that they carry with them). 

    first = place;
    backcount = place-1;
    indent = [0,0];
    while (true) {
        if ( (backcount < 0) || ( (chr = block[backcount]) === "\n" ) ) {
            indent = first - ( backcount + 1 ); 
            if (first === place) { // indent both
                indent = [indent, indent];
            } else {
                indent = [0, indent];
            }
            break;
        }
        if (chr.search(/\S/) === 0) {
            first = backcount;
        }
        backcount -= 1;
    }
    indents[loc] = indent;

### Indent

We need a simple indenting function. It takes a text to indent and a
two-element array giving the leading indent and the rest.

Note: Dropped the beginning indent since the leading text should just go
wherever the substitute is located (duh). It is the other lines whose
indentation needs to be managed. 

    function (text, indent) {
        var line, ret;
        var i, n;
        
        /*
        var beg;
        n = indent[0];
        beg = '';
        for (i = 0; i < n; i += 1) {
            beg += ' ';
        }
        */
        
        n = indent[1];
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

    function (text, ind, quote, lname ) { 

        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        var file = doc.file;

        var match, colind, mainblock, subname, chr, subtext;
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
    _":fix colon subname"
    subname = colon.escape(subname);
    if (chr === "|") {
        ind = doc.pipeParsing(text, ind, quote, lname);
    } else if (chr === quote) { 
        //index already points at after quote so do not increment
        gcd.once("text ready:" + lname + colon.v + "0",
            doc.maker['emit text ready'](lname, gcd));
    } else {
        gcd.emit("failure in parsing:" + lname, ind);
        return ind;
    }

[fix colon subname]()

A convenient shorthand is to lead with a colon to mean a minor block. We need
to put the big blockname in for that. 

So the name variable should start with a file name with a colon after it and
then from there to a triple colon should be the major block name on record. 

Directives may be a bit dodgy on this point. 

    if (subname[0] === ":") {
        colind = lname.indexOf(":");
        mainblock = lname.slice(colind+1, lname.indexOf(colon.v, colind));
        subname = mainblock+subname;
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

    function (text, ind, quote, name) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
       

        var chr, argument, argnum, match, command, 
            comname, nextname, aname, result ;
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
        doc.maker['emit text ready'](name, gcd));
    _":com parse"

[com parse]()

This is split off for convenience. 

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
        if (text[ind] === "\u005F") {
            _":deal with substitute text"
        }
        // no substitute, just an argument. 
        argument = '';
        argreg.lastIndex = ind;
        while (ind < n) {
            _":get full argument"
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
that, we try to chunk

    if (['"', "'", "`"].indexOf(text[ind+1]) !== -1) {

        ind = doc.substituteParsing(text, ind+2, text[ind+1], aname);
        continue;
    }

[get full argument]()

Here we are mainly dealing with looking for a backslash. If it is stopped
without a backslash then we quit the loop and deal it with it elsewhere.

For the backslash, we look at the next character and see if we have anything
we can do. 

    match = argreg.exec(text);
    if (match) {
        ind = argreg.lastIndex;
        argument += match[1];
        chr = match[2];
        if (chr === "\\") {
           result = doc.backslash(text, ind+1);
           ind = result[1];
           argument += result[0];
           continue;
        } else {
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

    gcd.emit("failure in parsing:" + name, ind);
    return ind+1;
 

### Backslash

The backslash is a function on the doc prototype that can be overwritten if
need be. 

It takes in a text and an index to examine. This default function escapes
backslashes, underscores, pipes, quotes and

* u leads to unicode sucking up. This uses fromCodePoint
* \n will be converted to a space
* n converted to a new line. 

If none of those are present a backslash is returned. 

We return an object with the post end index in ind and the string to replace
as chr.

    function (text, ind) {
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
        case "n" : return ["\n", ind+1];
        case "\n" : return [" ", ind+1];
        case "`" : return ["|", ind+1];
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


### Command Regexs

We have an object that has the different flavors of gobbling regexs that we
need. The problem was the variable quote. I want to have statically compiled
regexs and so just stick them in an object and recall them based on quote.
With just one variable changing over three times, not a big deal. 

For commands, these are non-whitespace character strings that do not include
the given quote. The regex ignores the initial whitespace returning the word
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
        gcd.once("command added:" + doc.file + ":" +  command, han);
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
`input, arg1, ... argn --> output`  Basically, we throw the arguments into the
form of interest and upon output, we emit it. Doc is the context of the sync. 

We catch any errors and emit an error event. This prevents further processing
of this block as the text ready event does not further. It just stops
executing. 

    function (fun, label) {
        var f = function (input, args, name, command) {
            var doc = this;
            var gcd = doc.gcd;
            
            try {
                var out = fun.call(doc, input, args);
                gcd.emit("text ready:" + name, out); 
            } catch (e) {
                console.log(e);
                gcd.emit("error:command execution:" + name, 
                    [e, input, args, command]); 
            }
        };

        if (label) {
            f._label = label;
        }

        return f;
    }




### Command wrapper async

Here we wrap callback functionated async functions. We assume the function
call will be of `input, arg1, ..., argn, callback` and the callback will
receive `err, data` where data is the text to emit. 

    function (fun, label) {
        var f = function (input, args, name, command) {
            
            var doc = this;
            var gcd = doc.gcd;

            var callback = function (err, data) {
                if (err) {
                    console.log(err);
                    gcd.emit("error:command execution:" + name, 
                        [err, input, args, command]);
                } else {
                    gcd.emit("text ready:" + name, data);
                }
            };

            fun.call(doc, input, args, callback);
        };
        if (label)  {
            f._label = label;
        } 
        
        return f;
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

        name = scope[1];
        var file = scope[2];
        scope = scope[0];


        var old; 
        if (scope.hasOwnProperty(name) ) {
            old = scope[name];
            scope[name] = text;
            gcd.emit("overwriting existing var:" + file + ":" + name, 
            {oldtext:old, newtext: text} );
        } else {
            scope[name] = text;
        }
        
        gcd.emit("text stored:" + file + ":" + name, text);
    }

[non-existent]()

This deals with the situation that the scope is not yet in a state for
existence. Essentially, it sets up a listener that will store and emit once
the scope exists. 

Scope is of the form `[null, varname, alias]`

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

    f = function () {
        doc.retrieve(name, cb);
    };
    f._label = "Retrieving:" + doc.file + ":" + name;
    gcd.once("scope linked:" + doc.file + ":" + file, f); 

[no var]() 

In this bit, we have no variable defined yet. So we need to listen for it. We
will get triggered

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

    {   'emit text ready' : function (name, gcd) {
                var f = function (text) {
                    gcd.emit( "text ready:" + name, text);
                };
                f._label = "emit text ready;;" + name;
                return f;
            },
        'store' : function (name, doc, fname) {
                var f = function (text) {
                    doc.store(name, text);
                };
                f._label = "store;;" + (fname ||  name);
                return f;
            },
        'store emit' : function (name, doc, fname) {
                var f = function (text) {
                    doc.store(name, text);
                    doc.gcd.emit("text ready:" + (fname || name), text);
                };
                f._label = "store emit;;" +  (fname || name);
                return f;
            },
        'location filled' : function (lname, loc, doc, frags, indents ) {
                var f = function (subtext) {
                    var gcd = doc.gcd;
                    subtext = doc.indent(subtext, indents[loc]);
                    frags[loc] = subtext;
                    gcd.emit("location filled:" +  lname );
                };
                f._label = "location filled;;" + lname;
                return f;
            },
        'stitch emit' : function (name, frags, gcd) {
                var f = function () {
                    gcd.emit("minor ready:" + name, frags.join(""));
                };
                f._label = "stitch emit;;" + name;
                return f;
            },
       'stitch store emit' : function (bname, name, frags, doc) {
                var f = function () {
                    var text = frags.join("");
                    doc.store(bname, text);
                    doc.gcd.emit("text ready:"+name, text);
                };
                f._label = "stitch store emit;;" + name;
                return f;
            }
    }


## Commands

Here we have some commands and directives that are of common use

    {   eval : sync(_"eval", "eval"),
        sub : _"sub",
        store: sync(_"store command", "store"),
        log : sync(_"cmd log", "log")
    }

### Eval

This implements the command `eval`. This evaluates the code as JavaScript. 


    function ( input, args, name ) {
        var doc = this;
        return eval(input).toString();
    }


[del]()

    var gcd = this.gcd;


        try {
         gcd.emit("text ready:" + name, eval(input)+"" );
        } catch (e) {
            gcd.emit("error:command execution:" +  name, 
                [e, input, "eval"]);
        }
    }

### Sub

This is the sub command which allows us to do substitutions. It takes in the
feeder text and replaces any occurrence of the given symbol with the
arguments. In particular, the template is `input --> * , a, b, c` will
replace in the input of `*1` with `a`, `*2` with `b`, etc., 

We will do the replacement using indeOf and splicing due to potentiald
conflicts with .replace (the $ replacements and the lack of global aspect if
given a string).


    function (str, args, name) {
        var gcd = this.gcd;

        var index = 0, m = str.length, al = args.length,
            i, j, old, newstr;


        if ( (!args[0]) ) {
            gcd.emit("error:sub has insufficient arguments:" + name);
        }


        if (al === 2) {
            old = args[0];
            newstr = args[1] || '';
            while ( index < m ) { 
                _":replace"
            }
        } else {

We count down to ensure that we have larger numbers matched first, i.e.,
eliminate `*11` before `*1`. 

            for (j = al-1; j >= 0; j -= 1) {
                index = 0;
                old = args[0] + j;
                newstr = args[j] || '';
                while (index < m) {
                    _":replace"
                }
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
            str = str.slice(0,i) + newstr + str.slice(i+old.length);
            index = i+newstr.length;
        }

### Store Command

This is a thin wrapper of the store function. 

    function (input, args) {
        var doc = this;
        var gcd = doc.gcd;

        var vname = doc.colon.escape(args[0]);

        if (vname) {
            doc.store(vname, input);
            gcd.emit("text ready:" + doc.file + ":" + vname);
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

        var file = doc.parent.files[args[2]] || doc;
        
        if (file) {

        } else {
            gcd.emit("error:raw:" + doc.file);
        }


    }


### RawClean

Same as raw, except it also cleans it up a bit. Namely, it removes things that
would have been interpreted poorly. 

## Directives

The most basic directive is saving the text. 

For now, just simple saving, but we can implement the pipe parsing a bit later
for saving as well. 

    {   save : _"save",
        newscope : _"new scope",
        store : _"dir store",
        log : _"dir log",
        out : _"out",
        load: _"load",
        linkscope : _"link scope"
    }


 Directives get a single argument object which gets the link, the href, and
 the text after the colon. 
 

### Save

We save it in vars of the document with the name in the link. The href tells
us where to begin. The 

add in pipes, add in variable checking if stored, other document parsing,
... 

    function (args) {
        var ind; 
        var doc = this;
        var colon = doc.colon;
        var gcd = doc.gcd;
        var file = doc.file;
        var savename = args.link;
        var title = args.input;
        _":deal with start"
        
        var emitname = "for save:" + doc.file + ":" + 
            doc.colon.escape(savename);

        var f = function (data) {
            // doc.store(savename, data);
            gcd.emit("file ready:" + savename, data);
        };
        f._label = "save;;" + savename;
        
        if (title) {
            title = title + '"';
            gcd.once("text ready:" + emitname, f);
            
            doc.pipeParsing(title, 0, '"', emitname);

        } else {
           gcd.once("text ready:" + emitname + colon.v + "0", f); 
        }
        
        doc.retrieve(start, "text ready:" + emitname + colon.v + "0");

    }

[deal with start]()

This is dealing with where to start, getting the text. It first comes from the
href, then anything between the first colon and the pipe. 

To get something from another context, one can simply put it after the first
colon


After the `:` and before the first `|`, that text is trimmed and then added to
the href post `#`. Also, if the name comes out to nothing, then we use the current
block being parsed.  


    var start = args.href.slice(1).replace(/-/g, " ").
        trim().toLowerCase();
    ind = title.indexOf("|");
    if (ind === -1) {
        start += title.trim();
    } else {
        start += title.slice(0,ind).trim();
        title = title.slice(ind+1);
    }
    
    if (!start) {
        start = args.cur;
    }

    start = doc.colon.escape(start);

### Out

This is the same as save, except it just ouputs it to the console via doc.log. 

Note I copied the save codew which is rather poor form. It would be good to
abstract this out a bit. Need to just pass along the f and the name of out or
save, etc. 

    function (args) {
        var ind; 
        var doc = this;
        var colon = doc.colon;
        var gcd = doc.gcd;
        var file = doc.file;
        var outname = args.link;
        var title = args.input;
        _":deal with start"
        
        var emitname = "for out:" + doc.file + ":" + 
            doc.colon.escape(outname);

        var f = function (data) {
            doc.log(outname + ":\n" + data + "\n~~~\n");
        };
        f._label = "out;;" + outname;
        
        if (title) {
            title = title + '"';
            gcd.once("text ready:" + emitname, f);
            
            doc.pipeParsing(title, 0, '"', emitname);

        } else {
           gcd.once("text ready:" + emitname + colon.v + "0", f); 
        }
        
        doc.retrieve(start, "text ready:" + emitname + colon.v + "0");

    }

[deal with start]()

This is dealing with where to start, getting the text. It first comes from the
href, then anything between the first colon and the pipe. 

To get something from another context, one can simply put it after the first
colon


After the `:` and before the first `|`, that text is trimmed and then added to
the href post `#`. Also, if the name comes out to nothing, then we use the current
block being parsed.  


    var start = args.href.slice(1).replace(/-/g, " ").
        trim().toLowerCase();
    ind = title.indexOf("|");
    if (ind === -1) {
        start += title.trim();
    } else {
        start += title.slice(0,ind).trim();
        title = title.slice(ind+1);
    }
    
    if (!start) {
        start = args.cur;
    }

    start = doc.colon.escape(start);


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
`[alias](# "linkscope:scopename")`

    function (args) {
        var doc = this;
        var alias = args.link;
        var scopename = args.input;

        doc.createLinkedScope(alias, scopename); 

    }


### Dir Store

This is the directive for storing some text. 
    

    function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var file = doc.file;
        var value = args.input;
        var name = doc.colon.escape(args.link);

        doc.store(name, value);

    }

### Exclude

This excludes the named (or current) section from being compiled. The form is
`[name](#whatever "exclude:")` 


    function (args) {

        var doc = this;
        var gcd = doc.gcd;
        var file = doc.file;

        var name = args.link || args.cur;
        name = doc.colon.escape(name);

        gcd.on("block needs compiling:" + file + ":" + name,
            function (data, evObj) {
                evObj.stop = true;
            });
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

`[local name](url "load:")[


    function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var folder = doc.parent;
        var requester = doc.file;
        var url = args.input.trim() || args.href.trim();
        var urlesc = folder.colon.escape(url);
        var nickname = doc.colon.escape(args.link.trim());
        
        if (doc.scopes.hasOwnProperty(nickname) ) {
            gcd.emit("error:scope name already exists:" + 
                doc.colon.escape(nickname) );
        } else {
            doc.scopes[nickname] = urlesc;
            if (!(folder.docs.hasOwnProperty(urlesc) ) ) {
                gcd.emit("need document:" + urlesc, url );
            }
        }

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

[oa](#on-action "define: command | | now")


## Tests

Let's create a testing environment. The idea is that we'll have a series of
documents in the tests folder that will have the convention `name -
description` at the top, then three dashed separator line to create a new
document to parse followed by its result. In more advanced tests, we will
introduce a syntax of input/output and related names. 

The log array should be cleared between tests. 

    /*global require, setTimeout*/
    /*jslint evil:true*/

    var fs = require('fs');
    var test = require('tape');
    var Litpro = require('./index.js');

    var testdata = {}, log = [];

    var testrunner = _"testrunner";

    var equalizer = _"equalizer";

    var testfiles = [ 
       /* */
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
        "load.md"
    ];

    var lp = Litpro.prototype;

    lp.commands.readfile = lp.wrapAsync(_"test async", "readfile");


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

        //gcd.makeLog();

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

           //setTimeout( function () {console.log(gcd.log.logs().join('\n')); console.log(folder.scopes)}, 100);
        });
           //setTimeout( function () {console.log(folder.scopes)}, 100);
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
        return function (text) {
            //console.log(text + "\n---\n" + out);
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

* directives
* command, directive definitions
* asynchronous commands, directives
* tests for each of the core commands, directives. 
* directives to change ignorable languages
* raw, raw clean
* heading levels 5 and 6
* multiple input, output documents




## README


literate-programming   
 ====================

Write your code anywhere and in any order with as much explanation as you
like. literate-programming will weave it all together to produce your project.

This is a modificaiton of and an implementation of 
[Knuth's Literate Programming](http://www-cs-faculty.stanford.edu/~uno/lp.html)
technique. It is
perhaps most in line with [noweb](http://tex.loria.fr/litte/ieee.pdf). 

It uses markdown as the basic document format with the code to be weaved
together being delimited by each line having 4 spaces as is typical for
markdown. Note that it requires spaces but not tabs. This allows one to use
tabs for non lit pro code blocks as well as paragraphs within lists. GitHub
flavored code fences can also be used to demarcate code blocks. 
     var text = data.trim().toLowerCase(); 

It can handle any programming language, but has some standard commands useful
for creating HTML, CSS, and JavaScript. 

 ## Installation

This requires [node.js](http://nodejs.org) and [npm](https://npmjs.org/) to be
installed. Then issue the command:

    npm install -g literate-programming

 ## Using

From the command line:

    literate-programming <file.md>

This will process the literate program in `file.md` and produce whatever
output files are specified in the literate program. 

Use `literate-programming -h`  for command flag usage, including specifying
the root output directory.

It can also be used as an executable program; see
[primes.md](https://github.com/jostylr/literate-programming/blob/master/examples/primes.md)
for an example program of this kind.   

 ## Example

Let's give a quick example. Here is the text of sample.md

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


And it can be run from the command line using `node count.js`

There are more
[examples](https://github.com/jostylr/literate-programming/tree/master/examples),
but for a non-trivial example, see the 
[literate program](https://github.com/jostylr/literate-programming/blob/master/lp.md)
that compiles to literate-programming.


 ## Document syntax

A literate program is a markdown document with some special conventions. 

The basic idea is that each header line (regardless of level, either atx # or
seText underline ) demarcates a full block. Code blocks within a full block
are the bits that are woven together. 

 ### Code Block

Each code block can contain whatever kind of code, but there are three special
syntaxes: 

1. `_"Block name"` This tells the compiler to compile the block with "Block
   name" and then replace the _"Block name" with that code.
2. ``_`javascript code` ``  One can execute arbitrary javascript code within
   the backticks, but the parser limits what can be in there to one line. 
3. `MACROS` all caps are for constants or macro functions that insert their
   output in place of the caps. Note that if you have `MACRO(_"something")`
   then the current version does not parse `_"something"` as a code block.
   This will hopefully get fixed along with being able to use code blocks in
   commands. This applies even if `MACRO` does not match so it is a bug, not a
   feature :(  To fix this, put a space between `MACRO` and the parenthesis. 

For both 1 and 3, if there is no match, then the text is unchanged. One can
have more than one underscore for 1 and 2; this delays the substitution until
another loop. It allows for the mixing of various markup languages and
different processing points in the life cycle of compilation. See
[logs.md](https://github.com/jostylr/literate-programming/blob/master/examples/logs.md)
for an example. 

 ### Directive

A directive is a command that interacts with external input/output. Just about
every literate program has at least one save directive that will save some
compiled block to a file. 

The syntax for the save directive is 

    [file.ext](#name-the-heading "save: named code block | pipe commands")  

where file.ext is the name of the file to save to,  name-the-heading is the
heading of the block whose compiled version is being saved (spaces in the
heading get converted to dashes for id linking purposes), `save:` is the
directive to save a file, `named code block` is the (generally not needed)
name of the code block within the heading block, and the pipe commands are
optional as well for further processing of the text before saving. 

For other directives, what the various parts mean depends, but it is always 

    [some](#stuff "dir: whatever")  

where the `dir` should be replaced with a directive name. 

 ### Pipes

One can also use pipes to pipe the compiled text through a command to do
something to it. For example, `_"Some JS code | jshint"`  will take the code
in block `some JS code` and pipe it into jshint to check for errors; it will
report the errors to the console. We can also use pipe commands in a save
directive:  `FILE "Some JS code" code.js | jstidy` will tidy up the code
before storing it in the file `code.js`.

 ### Named Code Block

Finally, you can use distinct code blocks within a full block. 

Start a line with link syntax that does not match a directive. Then it will
create a new code block with the following data `[code name](#link "type |
pipes")`. All parts are optional. The link is not used and can be anything. The
minimum is  `[](#)`  to make a new (unnamed) code block. 

Example: Let's say in heading block Loopy we have `[outer loop](# "js")` at the
start of a line. Then it will create a code block that can be referenced by
_"Loopy:outer loop".

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
  ideas in the future, etc. Only those on a compile path will be seen. 
* You can "paste" multiple blocks of code using the same block name. This is
  like DRY, but the code does get repeated for the computer. You can also
  substitute in various values  in the substitution process so that code
  blocks that are almost the same but with different names can come from the
  same root structure. 
* You can put distracting data checks/sanitation/transformations into another
  block and focus on the algorithm without the use of functions (which can be
  distracting). 
* You can use JavaScript to script out the compilation of documents, a hybrid
  of static and dynamic. 

I also like to use it to compile an entire project from a single file, pulling
in other literate program files as needed. That is, one can have a
command-and-control literate program file and a bunch of separate files for
separate concerns. But note that you need not split the project into any
pre-defined ways. For example, if designing a web interface, you can organize
the files by widgets, mixing in HTML, CSS, and JS in a single file whose
purpose is clear. Then the central file can pull it all in to a single web
page (or many).

 ## LICENSE

[MIT-LICENSE](https://github.com/jostylr/literate-programming/blob/master/LICENSE)



## TODO

Biggest non test stuff would be retrieving vars in other docs and in the
future -- make sure robust. And the reporting mechanisms.

Sub command could be next. It could take 2 arguments: the thing to replace and
the thing to replace it with. Or it could take multiple arguments with the
first one being the symbol and the others replacing the numbered versions,
i.e.,  `sub *, a, b, c`  would take `*1 g *2 h *1 i *3` to `a g b h a i c`.
That seems relatively straightforward. Also, unlike old * syntax, we can now
do piping of subs in the commmand and so instead of having it converted to
markdown in the template, we convert it to html in the subbing and just expect
html throughout. 

Tests:  Async command, loading of documents, saving multiple files, implement
and test pipes within save command, saving vars (command and directive --
allow commands in directive), namespacing vars, 

Create and test ways to report problems (blocks not being compiled, things not
being saved, etc.) This is both direct error reporting as well as logging, but
also just a simple list of the things that did not complete. 

Make sure missing blocks don't cause problems. Also make sure referencing each
other is not a problem. Shouldn't be other than they never get compiled. But
we need a warning of such things (at least not compiling, ideally also looking
at dependencies). Along with this, make sure an empty file is fine. 

Figure out a way to link into original text. Applications: having a bit that
is implemented in a raw way (easy to get raw text of code blocks maybe
sufficient), also ! tracking where more ! at beginning of line indicates more
severe issue.


Implement command line module, and some basic litpro-modules

Add in an opt-out for file saving or a rerouting... Add to Version the ability
to set various boolean flags, such as dev, deploy, ..., add an environment
directive to set those things. 

Implement a literate program testing example. Also a dev, deploy version.
Realized one could have a lit pro that is just a shell for files, etc.,
calling in the big thing. 

More docs.

Have some more preview/testing options. Maybe an abort on failed test/jshint
kind of stuff and/or a diff viewer. npm diff seems popular. 



Using  VARS to write down the variables being used at the top of the block.
Then use _"Substitute parsing:vars" to list out the variables.

    var [insert string of comma separated variables]; // name of block 

 ## IDE

An in-browser version is planned. The intent is to have it be an IDE for the
literate program. 

For IDE, implement: https://github.com/mleibman/SlickGrid

For diff saving: http://prettydiff.com/diffview.js  from
http://stackoverflow.com/questions/3053587/javascript-based-diff-utility

For scroll syncing https://github.com/sakabako/scrollMonitor

Note that code mirror will be the editor. A bit on the new multi-view of
documents:  http://marijnhaverbeke.nl/blog/codemirror-shared-documents.html

explore using node to run stuff between browser/lit pro/python:r:tex:sage...


## NPM package

The requisite npm package file. 

[](# "json") 

    {
      "name": "DOCNAME",
      "description": "A literate programming compile script. Write your program in markdown.",
      "version": "DOCVERSION",
      "homepage": "https://github.com/jostylr/literate-programming",
      "author": {
        "name": "James Taylor",
        "email": "jostylr@gmail.com"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/jostylr/literate-programming.git"
      },
      "bugs": {
        "url": "https://github.com/jostylr/literate-programming/issues"
      },
      "licenses": [
        {
          "type": "MIT",
          "url": "https://github.com/jostylr/literate-programming/blob/master/LICENSE-MIT"
        }
      ],
      "main": "lib/literate-programming.js",
      "engines": {
        "node": ">0.10"
      },
      "dependencies": {
        "event-when": "^0.7.1",
        "marked": "^0.3.2",
        "string.fromcodepoint": "^0.2.1"
      },
      "devDependencies" : {
        "tape": "^3.0.3"
      },
      "scripts" : { 
        "test" : "node ./test/test.js"
      },
      "keywords": ["literate programming"],
      "bin": {
        "literate-programming" : "bin/literate-programming.js"
      }
    }


## gitignore

    node_modules
    temp

## npmignore


    archive
    test
    travis.yml
    examples
    ghpages
    fixed_examples
    temp
    node_modules
    *.md
    mon.sh


## Travis

A travis.yml file for continuous test integration!

    language: node_js
    node_js:
      - "0.10"



## LICENSE MIT


The MIT License (MIT)
Copyright (c) 2014 James Taylor

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


## Change Log

