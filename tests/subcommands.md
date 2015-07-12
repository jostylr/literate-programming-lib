subCommands -- testing our subcommands
---

    _"echo"

    _"join"

    _"json"

    _"act"

    _"eval"

    _"set"

    _"prop"

    _"primitives"

[out](# "save:")


## echo

    _"|join echo(' :: ', `first up`), e("Cool, beans."), e(koo\"like)"

## join

    _"|cat join(e(" -- "), a(this, that), the other)"

## json

    _"|cat json( merge( o({"a" : 2, "c" : "j"}), 
        kv(b, merge(arr(3, 4), arr(t, f)), c, k ) ) )"

## act

    _"|join :, args(act(arr (4, 5, 6), slice, n(1) ) )"

## eval

    _"|join :, eval(_":code", arr(n(1, 2, 3, 4, 5))), 
        eval(`ret = 70;`)"



[code]()

    ret = args[0].reduce(function (prev, cur) {
        return prev + cur;
    });

## set

This is going to see if the get and sets work

    _"| cat 5, gSet(o({"a": [1, 2, 3]}))  |
        join :=:, set(kv(cool, gGet(a))), 
            args(eval( `ret = args[0].concat(args[1]);`,
                     get(cool, cool)))"
 
## prop

    _"|join :, property(doc(), colon, v ), property(doc(), cmdName)"

## primitives

    _"|join :, arr(true(), t(), skip(5), false(), f(), null())"

---
first up :: Cool, beans. :: koo"like

this -- that -- the other

{"a":2,"c":"k","b":["3","4","t","f"]}

5:6

15:70

5:=:1:=:2:=:3:=:1:=:2:=:3

⫶:in:prop⫶0⫶3

true,true,false,false,
