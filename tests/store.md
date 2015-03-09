storing -- testing the storing directive
---
# Storing

This tests the directive for storing. 

    Jack runs up
    Jack runs down

[](# "transform: |sub Jack, Jill | store subbed")

[](# ": |sub Jack, Jane | store janed")

[generic:great](# "store:dude")

## Cat

    _"storing"

    _"subbed"

    _"generic:great"

    _"janed"

[out](# "save:")
---
Jack runs up
Jack runs down

Jill runs up
Jill runs down

dude

Jane runs up
Jane runs down
