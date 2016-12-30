This defines the augmentation of the array object. 

    {
        trim : _"trim",
        splitsep : _"splitsep",
        ".mapc" : _"mapc",
        pluck : _"pluck",
        put : _"put",
        get : _"get",
        set : _"set"
    }

## Trim

Trims all the entries in the array. It also converts them all to strings if
not already a string. 

    function () {
        var old = this;
        var ret = old.map(function (el) {
            if (typeof el === "undefined") {
                return '';
            } else if (el.hasOwnProperty("trim")) {
                return el.trim();
            } else {
                return el.toString().trim();
            }
        });
        return old._augments.self(ret);
    }


## splitsep

This goes over each element of the array and splits the text on the separator
element. The default is `\n---\n`. It returns a new array.

    function (sep) {
        var old = this;
        sep = sep || '\n---\n';
        var ret = old.map(function (el) {
            return el.split(sep);
        });
        return old._augments.self(ret);
    }


## Mapc

This is maps commands to each element of an array. 

`.mapc cmd, arg1, arg2, ...`

    function(arr, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var c = doc.colon.v;

        var cmd = args[0];
        var ename = name + c + ".mapc" + c + cmd; 
        args = args.slice(1);

        gcd.flatArrWhen("mapping setup:" + ename, "need augmenting:" + ename).silence();
        gcd.on("need augmenting:"+ ename, function (data) {
            data = arr._augments.self( data ); 
            gcd.emit("text ready:" + name, data);
        });
        arr.forEach(function (el, ind) {
            var mname = ename + c + ind; 
            gcd.when("text ready:" + mname, "need augmenting:" + ename );
            doc.cmdworker(cmd, el, args, mname);
        });

        gcd.emit("mapping setup:"+ename);

    }

## Get

    function (key) {
        key = parseInt(key, 10);
        if (key < 0) {
            key = this.length + key;
        }
        return this[key];
    }

## Set

    function (key, val) {
        key = parseInt(key, 10);
        if (key < 0) {
            key = this.length + key;
        }
        this[key] = val;
        return this;
    }

## Pluck

This takes in a common key for elements in an array and returns a new array
with that. 

    function (key) {
        var arr = this;
        var ret = arr.map(function (el) {
            return el[key]; 
        });
        ret = arr._augments.self(ret);
        return ret;
    }

## Put

This is the reverse of pluck in which an array is incoming and is to be used
as values to place in the relevant key spot for each.  


    function (key, full) {
        var vals = this;
        full.forEach(function (el, ind) {
            el[key] = vals[ind];
        });
        return full;
    }


    
---

#### ignored pluck

!! Ignore this. Maybe later. Not feeling the use case for the complexity

This is a bit complicated. It assumes that this is an array and we want to
extract elements of that array. 

Multiple arguments lead to concatenating arrays. That is `.pluck 0, 2` will lead `[[a, c], [m, o]]` where the original is say `[[a, b, c], [m, n, o]]`. 

We support `1..3` for slicing between 1 and 3; `3..1` reverses it.

Negative numbers count from the end of the array.

A formula such as `2n+1` as in the css nth selector syntax works as well. 

There are several arrays: args are the arguments to make an array, 
arr is the input array -- its length will not change, but it will get
changed to lower levels, and val which should be an array and is what values
are getting plucked out -- there is one val for each entry of arr. 

    function () {
        var input = this;
        var args = Array.prototype.slice.call(arguments);
        _":regs"
        var ner = _":number maker"; 
        _":one argument"

    ( 
        var arr = input.slice();
        args.forEach(function (el) {
            arr = arr.map(function (val) {
                _":pluck out a new array"
            });
        });
        arr = input._augments.self(arr);
        return arr;
    }

[one argument]() 

If there is only one argument and the argument matches a single number, then
we extract the value and it reduces the array. Anything else is simply
thinning the array.  

    if (args.lengt === 1) {
        if ( (match = args[0].match(numreg) ) {
            ret = input.map( function (el) {
                var n = el.length;
                var num = ner(match[1], n);
                return el[num];
            });
        } else if ( ({

        }
                (match = el.match(numreg) ) ) {
                return [val[ner(match[1], n)]]; 
            }


[pluck out a new array]() 

This does all the work of getting the elements. 

    var n = val.length, i, cur, ret;
    var match, mul, con, left, right;
    var parts = el.split(";");
    var ret;
    parts = parts.map(function (el) {
        _":get array bits"
    });
    ret = [].concat(parts);
    if (ret.length === 1) {
        
    }


[get array bits]()

    if ( (match = el.match(slicereg) ) ) {
        left = ner(match[1], n);
        right =  ner(match[2], n);
        if ( left >= right) {
            return val.slice(left, right);
        } else {
            return val.slice(right, left).reverse();
        }   
    } else if ( (match = el.match(formreg) ) ) {
        _":formula" 
    } else if ( (match = el.match(numreg) ) ) {
        // return array so concat does not flatten an array value
        return [val[ner(match[1], n)]]; 
    } else {
        return [];
    }


[regs]()

This is where we parse numbers, dots, and formulas. 

    var slicereg =  /^(-?\d+)\.\.(-?\d+)$/;
    var formreg = /^(-?\d+)\s*n\s*\+\s*(-?\d+)$/;
    var numreg = /^(-?\d+)$/;

[number maker]()

    function (num, n) {
        num = parseInt(num, 10);
        if (num < 0) {
            num = n + num + 1;
        }
        return num;
    }


[formula]()

This formula starts at the constant (negatives interpreted from the end) and
then adds the increment times the multiplier to get the next one in sequence.
Negative multiplier goes down, naturally. 

    ret = [];
    mul = parseInt(match[1], 10);
    con = ner(match[2], n); 
    i = 0;
    cur = con;
    while ((cur >= 0) && ( cur < n) ) {
        ret[i] = val[cur];
        i += 1;
        cur = mul*i + con;
    }
    return ret;

