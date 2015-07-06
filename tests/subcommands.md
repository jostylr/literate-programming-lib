subCommands -- testing our subcommands
---

    _"echo"

    _"join"

    _"json"

    _"act"

    _"eval"

[out](# "save:")


## echo

    _"|cat echo(' :: ', discarded), e("Cool, beans."), e(koo\"like)"

## join

    _"|cat join(e(" -- "), a(this, that), the other)"

## json

    _"|cat json( merge( o({"a" : 2, "c" : "j"}), 
        kv(b, merge(arr(3, 4), arr(t, f)), c, k ) ) )"

## act

    _"|cat :, args(act(arr (4, 5, 6), slice, n(1) ) )"

## eval

    _"|cat eval(_":code", arr(n(1, 2, 3, 4, 5)))"



[code]()

    ret = args[0].reduce(function (prev, cur) {
        return prev + cur;
    });


* `set` The presumption is that an object is passed in whose key:values should
  be added to the command state. 
  `gSet` does this in a way that other commands in the pipe chain can
  see it. 
* `get` This retrieves the value for the given key argument. `gGet` does the
  same for the pipe chain. Multiple keys can be given and each associated
  value will be
  returned as distinct arguments. 
* `arguments` This expects an array and each element becomes a separate
  argument that the command will see. E.g., `cmd arguments(arr(3, 4))` is
  equivalent to `cmd 3, 4`. This is useful for constructing the args
  elsewhere. In particular, `args(obj(_"returns json of an array"))` will
  result in the array from the subsitution becoming the arguments to pass in.  
* `n` or `#` or `number` This converts the argument(s) to numbers, using js Number function.
* `eval` will evaluate the argument and use the magic `ret` variable as the value to
  return. This can also see doc (and doc.cmdName) and args has the arguments post code.
  Recommend using backticks for quoting the eval; it will check for
  that automatically (just backticks, can do echo for the others if needed).
* `log` This logs the argument and passes them along as arguments. 

---
Cool, beans. :: koo"like

this -- that -- the other

{"a":2,"c":"k","b":["3","4","t","f"]}

5:6

15
