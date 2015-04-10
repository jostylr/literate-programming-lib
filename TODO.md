Check problematic syntax for erroring and reporting. 

Implement some kind of mechanism for an async call to register done. Not
entirely sure what yet and then a command that can execute after that. The
idea is something like having to pull in files and compiling them and then
doing something with that. 

Implement better argument parsing. What something like `md tex($..$, $$..$$),
log|` to work out. That is, make it so that one can have comma'd arguments.
Quotes and brackets would switch it to a different mode where it only cares
about finding the end, ignoring other stuff in there except maybe
subsitutions.  Also, maybe allowing `tex(_"tex delim")`. That is, having
subsitutions anywhere in the arguments. 

Process this with itself. It is time.