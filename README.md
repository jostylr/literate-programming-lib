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
to demarcate code blocks. 

It does not care what language(s) your are programming in. 

This is the core library that is used as a module. See ... for the command
line client and the full version which has a variety of useful standard
plugins.

## Installation

This requires [node.js](http://nodejs.org) and [npm](https://npmjs.org/) to be
installed. Then issue the command:

    npm install literate-programming-lib

## Using

You can use `Folder = require('literate-programming-lib');`.



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