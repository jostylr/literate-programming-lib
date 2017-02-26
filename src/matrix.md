This creates a two dimension array from the text. 


    var Matrix = _"constructor";

    Matrix.prototype = _"prototype";

    Folder.Matrix = Matrix;

    Folder.sync("matrixify", _":fun");

[fun]() 

    function (input, args) {
        return new Matrix(input, args);
    }

## Constructor

Note that pushing the row array into the result is correct; we want an array
of arrays.

We escape it by slicing out the escape character if the next is an escaped
character. 

    function (code, args) {
        var rowsep, colsep, esc, doTrim, i, start, row, seps, char;
        if (typeit(code, 'string')) {
            _":string"
        } else if (typeit(code, 'array')) {
            this.mat = code;
        }

        return this;
    }

[string]()

If it is a string passed in, then we parse it and create.
 
    rowsep = args[0] || this.rowsep;
    colsep = args[1] || this.colsep;
    esc = args[2] || this.esc;
    doTrim = ( typeof args[3] !== "undefined") ? args[3] : this.doTrim;
    
    i = 0;
    start = 0;
    row = [];
    this.mat = [row];
    seps = [rowsep, esc, colsep];
    while (i < code.length) {
        char = code[i];
        if (char === rowsep) {
            row.push(code.slice(start, i));
            start = i + 1;
            row = [];
            this.mat.push(row);
        } else if (char === colsep) {
            row.push(code.slice(start, i));
            start = i + 1;
        } else if (char === esc) {
            char = code[i+1];
            if (seps.indexOf(char) !== -1) {
                code = code.slice(0,i) + char +
                    code.slice(i+1);
            }
        }
        i += 1;
    }
    row.push(code.slice(start));
    if (doTrim) {
        this.trim();
    }

## Doc

    * **matrixify** This takes in some text and splits into a two dimensional
      array using the passed in separators. The first separator divides the
      columns, the second divides the rows. The result is an array each of
      whose entries are the rows. There is also an escape character. The
      defaults are commas, newlines, and backslashes, respectively. The escpae
      character escapes the separators and itself, nothing else. There is also
      a boolean for whether to trim entries; that is true by default. Pass in
      `f()` in the fourth argument if not desired. All the characters should
      be just that, of length 1. 

      This returns a matrix (prototyped) that has the properties:
      * `transpose` This returns a new matrix with flipped rows and columns.
      * `trim` This trims the entries in the matrix, returning the original.
      * `num` This converts every entry into a number, when possible. 
      * `clone` This creates a copy. 
      * `traverse` This runs through the matrix, applying a function to each
        entry, the arguments being `element, inner index, outer index, the
        row object, the matrix`. 

## Prototype 

This is where we create various matrix prototype properties.

     {
        rowsep : "\n",
        colsep : ",", 
        esc : "\\",
        doTrim : true,
        transpose : _"mat transpose",
        traverse : _"mat traverse",
        trim : _"mat trim",
        clone :  "_mat clone",
        num : _"mat num",
        scale : _"mat scale"
    }

## Mat transpose

This flips the matrix, a two-d array. It returns a new object since we have a
mess unless it is square. 

    function () {
        var old = this.mat;
        var ret = new Matrix('', []);
        var result = ret.mat;
        var oldcols = old.reduce(function (n, el) {
            return Math.max(n, el.length);
        }, 0);
        var i;
        for (i=0; i < oldcols; i += 1) {
            result[i] = [];
        }
        var oldrows = old.length, j;
        for (i = 0; i < oldcols; i+= 1) {
            for (j=0; j< oldrows ; j += 1) {
                result[i][j] = old[j][i];
            }
        }
        return ret; 
    }

## Mat traverse

This takes in a function that should act on each entry. If it returns a value,
then it replaces that value. 

    function (fun) {
        var mat = this;
        if ( (typeof fun) !== "function" ) {
            //this is an error, not sure who to tell
            return;
        }
        mat.mat.forEach(function (row, rind) {
            row = row.forEach(function (el, ind) {
                var val = fun(el, ind, rind, row, mat.mat);
                if (typeof val !== "undefined") {
                    row[ind] = val;
                }
            });
        });
        return this;
    }

## Mat  trim

This guards against things that might not have trim, hopefully in a way that
is not bad for large matrices. 

    function () {
         var trim = function (el) {
            if (typeof el.trim === "function") {
                return el.trim();
            } else {
                return;
            }
        };
        this.traverse(trim);
        return this;
    }

### Mat  clone

    function () {
        var ret = new Matrix('', []);
        var clone = ret.mat;
        var currow = 0;
        cloning = function (el, ind, rind) {
            if (rind === currow) {
                clone[rind][ind] = el;
            } else if (rind === (currow +1) {
                clone.push([]);
                currow = rind;
                clone[rind][ind] = el;
            } else {
                //error!
            }
        };
        this.traverse(cloning);
        return ret;
    }

### Mat num

This converts everything into a number or NaN.

    function () {
        var fun = function (el) {
            return parseFloat(el);
        };
        this.traverse(fun);
        return this;
    }

### Mat scale

This converts everything into a number or NaN.

    function (scalar) {
        var fun = function (el) {
            return el*scalar;
        };
        this.traverse(fun);
        return this;
    }



