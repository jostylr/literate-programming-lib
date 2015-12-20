
Need better error reporting for not saved fie due to a command in the pipeline
not completing. Compile is a prime target for needing something more. 

Think about the subcommand argument prepping needing to be done in each
command -- raw commands will not have that feature unless purposefully put in. 

Check problematic syntax for erroring and reporting. Make sure there are tests
for every bit of syntax. 

Implement ability to switch syntax (say replace quotes with hash symbols). 

Go over docs (subcommands in particular)

h5 directive that does the push kind of thing. 

check for lack of initial heading problems (mainblock remove header). 

