Compose -- testing simple composition
---
# Composing

Need to test composing.

    _"stuff | split \n-!-\n "

    _"stuff | longsplit \n-!-\n, arr(;, some, more) "

[out](# "save: ")

[longsplit](# "compose: split $0 | join @1")

[split](# "compose: .split $0 | augment arr | .trim | .join 5 ")


## stuff

    this is
    -!-
    great
    -!-
    Does it 
    work
    -!-
    Yes
---
this is5great5Does it 
work5Yes

this is5great5Does it 
work5Yes;some;more
