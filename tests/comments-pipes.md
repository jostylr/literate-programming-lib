Comments Pipes -- comments in pipes
---

We would like comments in pipes. 

    _"| echo Awesome 
    | # what is up 
    | sub Awe, Dud
    | #dude replacing awe with dud"

[out](# "save: | # just making a mess 
    | sub some, ley
    | # dudley yea, did dudley
    | # ec('what | is this , _`whatever`  , ')
    | eval ec(`var what = Object.keys(doc.comments).
        sort().
        map( (key) => key + ' : ' + doc.comments[key] ).
        join('\n');
        text = text + '\n' + what;`)
    ")

---
Dudley
dude : Dudsome
dudley yea : Dudley 
