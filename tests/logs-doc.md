logs, warn, error -- testing out the doc commands
---
Let's do some evaling

    doc.warn("what", "just a little something", 5);
    doc.warn("great", "just a little more");
    doc.log = doc.parent.constructor.prototype.log;
    doc.log("message", 2, 'arg1', 'arg2');
    doc.log("whatever", "jshint", 9, 11);
    doc.logs.out.big = "hey, hey";
    ret = doc.parent.reportOut();
    console.log(ret);

[out](# "save: | evil")

---
DOC: in
===
## 0
===

===
## 2
===
message

===
## error
===

===
## warn
===
what
just a little something
~~~
5
===
great
just a little more
~~~

===
## out
===
big
~~~
hey, hey
~~~

===
## jshint
===
whatever
