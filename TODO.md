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