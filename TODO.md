Investigate quotes in titles. It looks like marked might escape single quotes
though backticks work. 

For the waiting, I think it should be possible to get the actual snippet it
pertains to. It would also be good to detect recursive cycles and report them,
e.g., a section that points to itself. 


Biggest thing is to report dead-ends. That is, variables (blocks) that are
requested but never delivered. 


Create and test ways to report problems (blocks not being compiled, things not
being saved, etc.) This is both direct error reporting as well as logging, but
also just a simple list of the things that did not complete. 

Make sure missing blocks don't cause problems. Also make sure referencing each
other is not a problem. Shouldn't be other than they never get compiled. But
we need a warning of such things (at least not compiling, ideally also looking
at dependencies). Along with this, make sure an empty file is fine. 


Implement command line module, and some basic litpro-modules

Add in an opt-out for file saving or a rerouting... Add to Version the ability
to set various boolean flags, such as dev, deploy, ..., add an environment
directive to set those things. 

More docs.

Have some more preview/testing options. Maybe an abort on failed test/jshint
kind of stuff and/or a diff viewer. npm diff seems popular. 


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