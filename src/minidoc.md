This takes in an array and converts into an object whose keys would be
suitable variable names and useful for storing. 

`minidoc :title, :body`  will create an object from an array whose form 
`[a, [b, c], [d]]` will lead to `{title: a, b:c, body: d}`

    function (input, args, name) {
        var doc = this;
        var gcd = this.gcd;
        var ret = {}; 
        if (typeof input.forEach === "function" ) {
            input.forEach( function (el) {
                if (Array.isArray(el) ) {
                    if (el.length === 1) {
                        ret[args.shift()] = el[0];
                    } else {
                        ret[el[0].trim()] = el[1];
                    }
                } else {
                    ret[args.shift()] = el;
                }
            });
        } else {
            gcd.emit("error:incorect type:toDoc:" + name, [input, args]);
            return input;
        }
        // put empty bits for rest
        args.forEach(function (el) {
            ret[el] = '';
        });
        ret = doc.augment(ret, "minidoc");
        return ret;

    }

## Methods

The "." are intentional; they signify that this is a command method. 

    { 
        ".store" : _"store",
        ".apply" : _"apply",
        ".mapc" : _"mapc",
        clone : _"clone",
        ".compile" : _"compile",
        ".clear" : _"clear",
        set : _"set",
        get : _"get",
        keys : _"keys",
        toJSON : _"toJSON",
        toString : _"toString",
        forin : _"for in",
        strip : _"strip"
    }

### store

This assumes this is an object with the store property. It uses the first
argument as an optional prefix to each key as to where it should get stored.


`.store nav`

    function (input, args, name ) {
        var doc = this;
        var gcd = doc.gcd;
        var prefix = args[0] || '';
        try {
            input._augments.keys(input).forEach(function (el) {
                doc.store(doc.colon.escape(prefix + el), input[el]); 
            });

        } catch(e) {
            this.gcd.emit("error:minidoc:store" + name, [e, input, args]);
        }
        gcd.emit("text ready:" + name, input); 
    }

### clear

This undoes the storing. Mainly used for `.compile`. 

`.clear nav`

     function (input, args, name ) {
        var doc = this;
        var gcd = doc.gcd;
        var prefix = args[0] || '';
        try {
            input.keys().forEach(function (el) {
                doc.store(doc.colon.escape(prefix + el), null); 
            });
        } catch(e) {
            this.gcd.emit("error:minidoc:clear:" + name, [e, input, args]);
        }
        gcd.emit("text ready:" + name, input); 
    }
  


### mapc

This maps commands to each element of the object. This does not create a new
object; for that clone this first. 

`.mapc cmd, arg1, arg2, ...`

    function(obj, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var c = doc.colon.v;

        var cmd = args[0];
        var ename = name + c + ".mapc" + c + cmd; 
        args = args.slice(1);

        gcd.when("mapc setup:" + ename, "keying:" + ename).silence();
        gcd.on("keying:"+ ename, function (data) {
            data.forEach(function (el) {
                var key = el[0].slice(el[0].lastIndexOf(c) + 1);
                obj[key] = el[1];
            });
            gcd.emit("text ready:" + name, obj);
        });
        obj.keys().forEach(function (key) {
            var mname = ename + c + key; 
            gcd.when("text ready:" + mname, "keying:" + ename );
            doc.cmdworker(cmd, obj[key], args, mname);
        });

        gcd.emit("mapc setup:"+ename);

    }

### compile

This takes the object and compiles it. What it actually does is uses the
.store command to store the object using that name and then calls the compile
command using that name. Best not to tangle with multiple scopes??? 

    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;

        var section = colon.escape(args[0]);

        var template =  name +  colon.v + ".compile" +
            colon.v + "template";
        var store =  name +  colon.v + ".compile" +
            colon.v + "store";

        gcd.flatWhen( ["text ready:" + template, "text ready:" + store], 
            ".compile ready:" + name);

The first data entry is the template and we use the compile command. The name
is the name we have stored the object keys under. 

        gcd.once(".compile ready:" + name, function (data) { 
            doc.cmdworker("compile", data[0], [name], name);
            gcd.once("text ready:" + name, function () {
                doc.cmdworker(".clear", input, [name], name + 
                    colon.v + ".clear");
            });
        });
        
        doc.retrieve(section, "text ready:" + template);

Evoke the store command, storing the keys with the prefix of name. 

        doc.cmdworker(".store", input, [name], store ); 
    }

### apply

This applies the supplied command and arguments to the minidoc specified
property and stores the result. 

`.apply key, cmd, args`  


    function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var c = doc.colon.v;
        var key = args[0];
        var cmd = args[1];
        var ename = name + c + ".apply" + c + key + c + cmd ; 
        args = args.slice(2);
        gcd.once("text ready:" + ename, function (data) {
            input[key] = data;
            gcd.emit("text ready:" + name, input);
        });
        doc.cmdworker(cmd, input[key], args, ename);
    }


### clone

This clones an object. Most operations will act on it directly. 


    function () {
        var input = this;
        var clone = {};
        input.keys().forEach(function (el) {
            clone[el] = input[el]; 
        });
        clone = input._augments.self(clone); 
        return clone;
    }

### Get

    function (key) {
        return this[key];
    }

### Set

    function (key, val) {
        this[key] = val;
        return this;
    }

### keys

Returns an augmented array of the keys.

bf stands for boolean or function

    function (bf) {
        var aug = this._augments;
        var keys = aug.keys(this);
        if (bf === true) {
            keys.sort();
        } else if (typeof bf === "function") {
            keys.sort(bf);
        }
        return keys;
    }

### toString

This implements a toString method. Its arguments include the key and value
separators. The default is colon and newline with no wrapping. One can provide
wrapping functions. 

    function (keysep, valsep, fkey, fval) {
        var obj = this;
        keysep =  keysep || ':';
        valsep = valsep || '\n';
        fkey = fkey || function (key) {return key;};
        fval = fval || function (val) {return val;};
        var keys = obj.keys();
        var str = '';
        keys.forEach(function (el) {
            str += fkey(el) + keysep + fval(obj[el]) + valsep;
        });
        return str;

    }

## toJSON

    function () {
        var obj = this;
        var keys = obj.keys();
        var newobj = {};
        keys.forEach(function (el) {
            newobj[el] = obj[el];
        });
        return JSON.stringify(newobj);

    }
   
## for in

This does a forEach for the object, ignoring the augment keys. 

The function takes in a function to act in the first argument, a pass-in
object or value as second argument,  and has an
optional sort object (true will sort by default order, nothing means whatever
ordering it happens to be in ) for the third argument. 

This can function as a foreach, a map, or a reduce. A defined val will get
passed whenever the return value is not defined. If neither are defined, then
the self object becomes the third object in the call. 

If, at the end, the return value of f is undefined, then the object is passed
along as is. 

    function (f, val, s) {
        var self = this;
        var keys = self.keys(s);
        var ret;
        keys.forEach(function (el) {
            if ( (typeof ret) !== "undefined") {
                ret = f(el, self[el], ret, self);
            } else if (typeof val !== "undefined") {
                ret = f(el, self[el], val, self);
            } else {
                ret = f(el, self[el], self);
            }
        });
        if (typeof ret !== "undefined") {
            return ret;
        } else {
            return self;
        }
    }



## strip

This reveals the strip function. 

    function () {
        var self = this;
        self._augments.strip(self);
    }

