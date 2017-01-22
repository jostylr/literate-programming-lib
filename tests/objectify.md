objectify - testing the objectify method
---
# Basic

    _":object | objectify | .get this is great "
    _":object | objectify | .toString !, &"
    _":object | objectify | .toJSON"


[out](# "save:")

[object]()

    5: jack
    jack :jane
    this is great : whatever
---
whatever
5!jack&jack!jane&this is great!whatever&
{"5":"jack","jack":"jane","this is great":"whatever"}
