literate-programming-lib   [![Build Status](https://travis-ci.org/jostylr/literate-programming-lib.png)](https://travis-ci.org/jostylr/literate-programming-lib)
====================

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
* **Store** `[name](# "store:value")`  This stores the value into name. Think of
  this as a constant declaration at the beginning of a file. You can use it
  for common bits of static text. If you need more dynamism, consider the
  store command instead. 
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
  end in the file and return everything in between. Be careful that the raw
  command itself does not get caught up. For example, if you want to cut
  between !@ and @!,  then you could use the very ugly
  `|raw _"|cat ,!, @", _"|cat ,@,!"`
  or have a function that produces the separators, etc. Point is, be aware of
  the issue. This should hopefully not be needed to often.  
* **Trim** `This trims the incoming text, both leading and trailing whitespace.
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

## LICENSE

[MIT-LICENSE](https://github.com/jostylr/literate-programming/blob/master/LICENSE)