backslash -- backslash testing
---
# Backslashing

This tests the backslashing numbering scheme. 

[sub test]()

    _"oops"
    _"oops | compile"
    _"oops | compile | compile"

    _"woops | compile jack, jean"

[out](# "save:")

## Woops

    \_":this"

    \2_":this"

## jack

[this]()

    hi

## jean

[this]()

    bye


## Oops

    \2_"awesome | sub oo, \2_"self" "

## awesome

    shoo

## self

    irt

---
\1_"awesome | sub oo, \1_"self" "
\0_"awesome | sub oo, \0_"self" "
shirt

hi

bye
