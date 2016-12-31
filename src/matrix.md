This creates a two dimension array from the text. 

    Folder.plugins.matrixify = {
        row : "\n",
        col : ",", 
        esc : "\\",
        trim : true
    };

    Folder.sync("matrixify", _":fun");

[fun]() 

Note that pushing the row array into the result is correct; we want an array
of arrays.

We escape it by slicing out the escape character if the next is an escaped
character. 

    function (code, args) {
        var plug = this.plugins.matrixify;
        var rowsep = args[0] || plug.row;
        var colsep = args[1] || plug.col;
        var escsep = args[2] || plug.esc;
        var trim = ( typeof args[3] !== "undefined") ? args[3] : plug.trim;
        var i = 0;
        var start = 0;
        var row = [];
        var result = [row];
        var seps = [rowsep, escsep, colsep];
        var char;
        while (i < code.length) {
            char = code[i];
            if (char === rowsep) {
                row.push(code.slice(start, i));
                start = i + 1;
                row = [];
                result.push(row);
            } else if (char === colsep) {
                row.push(code.slice(start, i));
                start = i + 1;
            } else if (char === escsep) {
                char = code[i+1];
                if (seps.indexOf(char) !== -1) {
                    code = code.slice(0,i) + char +
                        code.slice(i+1);
                }
            }
            i += 1;
        }
        row.push(code.slice(start));
        result = this.augment(result, "mat");
        if (trim) {
            result = result.trim();
        }
        return result;
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

      This returns an augmented object, a matrix that has the properties:
      * `transpose` This returns a new matrix with flipped rows and columns.
      * `trim` This trims the entries in the matrix, returning the original.
      * `num` This converts every entry into a number, when possible. 
      * `clone` This creates a copy. 
      * `traverse` This runs through the matrix, applying a function to each
        entry, the arguments being `element, inner index, outer index, the
        row object, the matrix`. 

## Methods 

This is where we create various matrix augmented properties.

     {
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
        var mat = this;
        var result = [];
        var oldcols = mat.reduce(function (n, el) {
            return Math.max(n, el.length);
        }, 0);
        var i;
        for (i=0; i < oldcols; i += 1) {
            result[i] = [];
        }
        var oldrows = mat.length, j;
        for (i = 0; i < oldcols; i+= 1) {
            for (j=0; j< oldrows ; j += 1) {
                result[i][j] = mat[j][i];
            }
        }
        return this._augments.self(result);
    }

## Mat traverse

This takes in a function that should act on each entry. If it returns a value,
then it replaces that value. 

    function (fun) {
        var mat = this;
        if ( (typeof fun) !== "function" ) {
            //this is an error, not sue who to tell
            return;
        }
        this.forEach(function (row, rind) {
            row = row.forEach(function (el, ind) {
                var val = fun(el, ind, rind, row, mat);
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
        var clone = [[]];
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
        return this;
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



