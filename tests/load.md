load - loading multiple files
---start:first
# Loading

We want to have multiple files accessing each other's stuff. 

[s](second "load:")

[t](# "load:third")

[out](# "save:")


    This is a great setup

    _"s::cool"

    _"t::rickets | sub !, c"

    _"t::last:sound"

## Sound

    chirp
---in:second

# Cool

Nice and simple

    cool

---in:third

# Rickets

    !rickety _"first::sound" _"s::cool"


## Last

[sound]()

    crush

---out:out
This is a great setup

cool

crickety chirp cool

crush
