funify - checking the use of function defining
---
## Object

We will do a reduce here

    jack : 2
    ka : 7
    jilli : 3

[out](# "save: | objectify | .forin _'f', n(0), t() ")

## Function

This takes the length of the key and multiplies it by the value and we sum
over that. 
   
    function (key, prop, val) {
        return val + ( key.length * parseInt(prop,10) );
    }

[f](# "store: | funify ")
---
37