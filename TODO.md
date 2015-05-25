
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


