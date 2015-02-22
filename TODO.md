Wondering about the use of numbering the backslashes. That is `\5` could mean
5 backslashes and it would then become `\4` on the next iteration. It is neat,
but not sure if it is needed. 


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