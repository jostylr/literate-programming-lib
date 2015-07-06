subCommands -- testing our subcommands
---

    _"echo"

[out](# "save:")

# echo

    _"|cat echo(' :: '), e("Cool, beans."), e(koo\"like)"


* `e` or `echo`  This expects a quote-delimited string to be passed in and
  will strip the quotes. This is useful as the appearance of a quote will mask
  all other mechanics. So `e("a, b and _this")` will produce a literal
  argument of `a, b, and _this`. 
* `j` or `join` The first entry is the joiner separator and it joins the rest
  of the arguments. For arrays, they are flattened with the separator as well
  (just one level -- then it gets messy and wrong, probably). 
* `a` or `arr` or `array` This creates an array of the arguments.
* `o` or `obj` or `object` This presumes that a JSON stringed object is ready
  to be made into an object.
* `merge` Merge arrays or objects, depending on what is there.
* `kv` or `key-value` This produces an object based on the assumption that a
  `key, value` pairing are the arguments. The key should be text. multipl
  pairs welcome.  
* `act` This allows one to do `obj, method, args` to apply a method to an
  object with the slot 2 and above being arguments. For example, one could do
  `act( arr(3, 4, 5), slice, 2, 5)` to slice the array.
* `json` This will convert an object to to JSON representation.
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
