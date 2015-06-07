
Check problematic syntax for erroring and reporting. Make sure there are tests
for every bit of syntax. 



Implement better argument parsing. What something like `md tex($..$, $$..$$)`,
Quotes and brackets would switch it to a different mode where it only cares
about finding the end, ignoring other stuff in there except maybe
subsitutions.  Also, maybe allowing `tex(_"tex delim")`. That is, having
subsitutions anywhere in the arguments. 



