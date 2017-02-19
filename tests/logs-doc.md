logs, warn, error -- testing out the doc commands
---start:in
# Eval logs

Let's do some evaling

    doc.warn("what", "just a little something", 5);
    doc.warn("great", "just a little more");
    doc.log("message", 2, 'arg1', 'arg2');
    doc.log("whatever", "jshint", 9, 11);
    doc.logs.out.big = "hey, hey";
    ret = "bye";

[out](# "save: | evil")

---out:out
bye
---reports:
DOC: in
===
## 2

* MESSAGE: message
* DETAILS:

    * arg1
    * arg2
* * *
## WARN

* KIND: what
* DESCRIPTION: just a little something
* DETAILS:

    * 5
* * *

* KIND: great
* DESCRIPTION: just a little more
* * *
## OUT
### big
`````
hey, hey
`````
* * *
## JSHINT

* MESSAGE: whatever
* DETAILS:

    * 9
    * 11
