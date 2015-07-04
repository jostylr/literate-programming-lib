/*global require, module */
/*jslint evil:true*/

var EvW = require('event-when');
var commonmark = require('commonmark');
require('string.fromcodepoint');


var apply = function (instance, obj) {
    var meth, i, n;

    for (meth in obj) {
        n = obj[meth].length;
        for (i = 0; i < n; i += 1) {
            instance[meth].apply(instance, obj[meth][i]);
        }

    }
};


var Folder = function (actions) {
    actions = actions || Folder.actions;

    var gcd = this.gcd = new EvW();
    //.when will preserve initial, not emitted order
    gcd.initialOrdering = true; 
    
    this.docs = {};
    this.scopes = { g:{} };
    
    this.commands = Object.create(Folder.commands);
    this.directives = Object.create(Folder.directives);
    this.reports = {};
    this.recording = {};
    this.stack = {};
    this.reporters = Folder.reporters;
    this.plugins = Object.create(Folder.plugins);
    this.flags = {};
    this.Folder = Folder;

    this.done = {
        gcd : new EvW(),
        cache : {}
    };
    this.done.gcd.action("done", function (data, evObj) {
        var folder = this;
        folder.done.cache[evObj.ev] = true;
    }, this);
    
    gcd.parent = this;

    gcd.on("block needs compiling", "compiling block");
    
    gcd.action("compiling block", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[1];
            var blockname = evObj.pieces[0];
            var doc = gcd.parent.docs[file]; 
            var block = doc.blocks[blockname];
            doc.blockCompiling(block, file, blockname);
        }
    );
    
    
    gcd.on("heading found", "add block");
    
    gcd.action("add block", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            var text = data.trim().toLowerCase();
            var curname = doc.heading = doc.curname = text;
            doc.levels[0] = text;
            doc.levels[1] = '';
            doc.levels[2] = '';
            if ( ! doc.blocks.hasOwnProperty(curname) ) {
                doc.blocks[curname] = '';
            }
        }
    );
    
    gcd.on("heading found:5", "add slashed block");
    
    gcd.action("add slashed block", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            var text = data.trim().toLowerCase();
            doc.levels[1] = text;
            doc.levels[2] = '';
            var curname = doc.heading = doc.curname = doc.levels[0]+'/'+text;
            if ( ! doc.blocks.hasOwnProperty(curname) ) {
                doc.blocks[curname] = '';
            }
            evObj.stop = true;
        }
    );
    
    gcd.on("heading found:6", "add double slashed block");
    
    gcd.action("add double slashed block", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            var text = data.trim().toLowerCase();
            doc.levels[2] = text;
            var curname = doc.heading = doc.curname = doc.levels[0]+'/'+doc.levels[1]+'/'+text;
            if ( ! doc.blocks.hasOwnProperty(curname) ) {
                doc.blocks[curname] = '';
            }
            evObj.stop = true;
        }
    );
    
    gcd.on("switch found", "create minor block");
    
    gcd.action("create minor block", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            var colon = doc.colon;
            var text = data[0].trim().toLowerCase();
            
            var subEmit, textEmit, doneEmit;
            
            var curname = doc.curname = doc.heading+colon.v+text;
            if ( ! doc.blocks.hasOwnProperty(curname) ) {
                doc.blocks[curname] = '';
            }
            
            
            var title = data[1];
            var fname = evObj.pieces[0] + ":" + curname;
            doneEmit = "text ready:" + fname; 
            var pipename;
            if (title) { // need piping
                title = title.trim()+'"';
                pipename = fname + colon.v + "sp";
                textEmit = "text ready:" + pipename;
                subEmit = "switch chain done:" + pipename; 
                
                gcd.when(textEmit, subEmit);
            
                gcd.once(subEmit, function (data) {
                    var text = data[data.length-1][1] || '';
                    doc.store(curname, text);
                    gcd.emit(doneEmit, text);
                });
                
                gcd.flatWhen("minor ready:" + fname, textEmit);
            
                doc.pipeParsing(title, 0, '"' , pipename, doc.heading,
                  subEmit, textEmit ); 
            } else { //just go
                gcd.once("minor ready:" + fname, function (text) {
                    doc.store(curname, text);
                });
                gcd.flatWhen("minor ready:" + fname, "text ready:" + fname);
            
            }
        }
    );
    
    gcd.on("code block found", "add code block");
    
    gcd.action("add code block", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            if (doc.blockOff > 0) { return;}
            if (doc.blocks[doc.curname]) {  
                doc.blocks[doc.curname] +=  doc.join + data;
            } else {
                doc.blocks[doc.curname] = data;
            }
        }
    );
    
    gcd.on("code block found:ignore", "ignore code block");
    
    gcd.action("ignore code block", function (data, evObj) {
            var gcd = evObj.emitter;
            evObj.stop = true;
        }
    );
    
    gcd.on("directive found", "process directives");
    
    gcd.action("process directives", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            var fun;
            var directive = evObj.pieces[1];
            if (directive && (fun = doc.directives[directive] ) ) {
                fun.call(doc, data);
            }
        }
    );
    
    gcd.on("parsing done", "list blocks to compile");
    
    gcd.action("list blocks to compile", function (data, evObj) {
            var gcd = evObj.emitter;
            var file = evObj.pieces[0];
            var doc = gcd.parent.docs[file];
            var blocks = doc.blocks;
            var name;
            for (name in blocks) {
                gcd.emit("block needs compiling:" + file + ":" + name); 
            }
        }
    );
    
    gcd.on("waiting for", "wait reporting");
    
    gcd.action("wait reporting", function (data, evObj) {
            var gcd = evObj.emitter;
             
            var reports = gcd.parent.reports; 
            
            var evt = data[0];
            var msg = evObj.pieces.slice(0,-1).reverse().join(":");
            
            
            reports[msg] = data.slice(1);
            gcd.once(evt, function () {
                delete reports[msg];
            });
        }
    );

    if (actions) {
        apply(gcd, actions);
    }

    Folder.postInit(this);

    return this;
};

Folder.prototype.parse = function (doc) {
    var gcd = doc.gcd;
    var file = doc.file;

    gcd.when("marked done:"+file, "parsing done:"+file);

    gcd.on("parsing done:"+file, function () {
        doc.parsed = true;
    });

    
    var reader = new commonmark.Parser();
    var parsed = reader.parse(doc.text); 

    var walker = parsed.walker();
    var event, node, entering, htext = false, ltext = false, lang, code;
    var ind, pipes, middle, title, href, directive; //for links

    while ((event = walker.next())) {
        node = event.node;
        entering = event.entering;

        switch (node.type) {
        case "Text" : 
            if (htext) {
                htext.push(node.literal);
            }
            if (ltext) {
                ltext.push(node.literal);
            }
        break;
        case "Link" : 
            if (entering) {
                ltext = [];
            } else {
                href = node.destination;
                title = node.title;
                ltext = ltext.join('').trim();
                
                if (title) {
                    title = title.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
                }   
                if ((!href) && (!title)) {
                    gcd.emit("switch found:"+file, [ltext, ""]);
                } else if (title[0] === ":") {
                    if ( (ltext[0] === "|") || ( ltext.length === 0) ) {
                        gcd.emit("directive found:transform:" + file, 
                            {   link : ltext.slice(1),
                                input : title.slice(1),
                                href: href, 
                                cur: doc.curname, 
                                directive : "transform"
                            }
                        );
                    } else {
                        ind = 0;
                        pipes = title.indexOf("|");
                        if (pipes === -1) {
                            middle = title.slice(ind+1).trim(); 
                            pipes = '';
                        } else {
                            middle = title.slice(ind+1, pipes).trim();
                            pipes = title.slice(pipes+1).trim();
                        }
                        if (middle) {
                            ltext += "." + middle.toLowerCase();    
                        }
                        gcd.emit("switch found:" + file, [ltext,pipes]);
                    }
                } else if ( (ind = title.indexOf(":")) !== -1) {
                    directive =  title.slice(0,ind).trim().toLowerCase(); 
                    gcd.emit("directive found:" + 
                        directive +  ":" + file, 
                        {   link : ltext,
                            input : title.slice(ind+1),
                            href: href, 
                            cur: doc.curname, 
                            directive : directive 
                        }
                    );
                }
                ltext = false;
            }
        break;
        case "CodeBlock" :
            lang = node.info;
            code = node.literal || '';
            if (code[code.length -1] === "\n") {
                code = code.slice(0,-1);
            }
            if (lang) {
                gcd.emit("code block found:"+lang+":"+file, code);
            } else {
                gcd.emit("code block found:"+ file, code);
            }
        break;
        case "Header" :
            if (entering) {
                htext = [];
            } else {
                gcd.emit("heading found:"+node.level+":"+file, htext.join(""));
                htext = false;
            }
        break;
        }

       // console.log(node.type, node.literal || '', node.destination|| '', node.title|| '', node.info|| '', node.level|| '', node.sourcepos, event.entering);
    }

    gcd.emit("marked done:" + file);
};

Folder.prototype.newdoc = function (name, text, actions) {
    var parent = this;

    var doc = new parent.Doc(name, text, parent, actions);
    
    try {
        parent.parse(doc);
    } catch (e) {
        doc.log("Markdown parsing error. Last heading seen: " + 
            doc.curname);       
    }

    return doc;

};

Folder.prototype.colon = {   v : "\u2AF6",
    escape : function (text) {
         return text.replace(/:/g,  "\u2AF6");
    },
    restore : function (text) {
        return text.replace( /[\u2AF6]/g, ":");
    }
};

Folder.prototype.createScope = function (name) {
    var folder = this;
    var gcd = folder.gcd;
    var scopes = folder.scopes;
    var colon = folder.colon;

    name = colon.escape(name);

    if (! scopes.hasOwnProperty(name) ) {
        scopes[name] = {};
        gcd.emit("scope created:" + name);
        gcd.emit("scope exists:" + name);
    } else if (typeof scopes[name] === "string") {
        gcd.emit("error:conflict in scope naming:" + name);
        scopes[name] = {};
    }

    return scopes[name];
};

Folder.prototype.join = "\n";

Folder.prototype.log = function (text) { console.log(text); };

Folder.prototype.indicator = "\u2AF6\u2AF6\u2AF6";

var sync  = Folder.prototype.wrapSync = function (fun, label) {
        var temp;
        if (typeof fun === "string") {
            temp = fun;
            fun = label;
            label = fun;
        }

    var f = function (input, args, name, command) {
        var doc = this;
        var gcd = doc.gcd;
        
        try {
            var out = fun.call(doc, input, args, name);
            gcd.emit("text ready:" + name, out); 
        } catch (e) {
            doc.log(e);
            gcd.emit("error:command execution:" + name, 
                [e, input, args, command]); 
        }
    };

    if (label) {
        f._label = label;
    }

    return f;
};
Folder.sync = function (name, fun) {
    Folder.commands[name] = sync(name, fun);
};

var async = Folder.prototype.wrapAsync = function (fun, label) {
        var temp;
        if (typeof fun === "string") {
            temp = fun;
            fun = label;
            label = fun;
        }
    var f = function (input, args, name, command) {
        
        var doc = this;
        var gcd = doc.gcd;

        var callback = function (err, data) {
            if (err) {
                doc.log(err);
                gcd.emit("error:command execution:" + name, 
                    [err, input, args, command]);
            } else {
                gcd.emit("text ready:" + name, data);
            }
        };

        fun.call(doc, input, args, callback, name);
    };
    if (label)  {
        f._label = label;
    } 
    
    return f;
};
Folder.async = function (name, fun) {
    Folder.commands[name] = async(name, fun);
};

var dirFactory = Folder.prototype.dirFactory = function (namefactory, handlerfactory, other) {

    return function (state) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        
        state.linkname = colon.escape(state.link);
        var temp;
        
        state.start =  doc.getBlock(state.href, state.cur);
        
        temp = doc.midPipes(state.input);
        state.options = temp[0];
        state.pipes = temp[1];
        
        namefactory.call(doc, state);
        
        handlerfactory.call(doc, state);

        other.call(doc, state);

        doc.pipeDirSetup(state.pipes, state.emitname, state.handler, 
            ( state.start ||  state.block) );
        
        var pipeEmitStart = "text ready:" + state.emitname + colon.v + "sp";
        if (! state.value) {
            doc.retrieve(state.start, pipeEmitStart);
        } else {
            gcd.emit(pipeEmitStart, state.value || "" );
        }
    };
    

};

// communication between folders, say for caching read in files
Folder.fcd = new EvW(); 


Folder.prototype.subnameTransform = function (subname, lname, mainblock) {
    var colind, first, second, main;
    var doc = this;
    var colon = doc.colon;

    if (subname[0] === ":") {
        if (mainblock) {
            //console.log(mainblock)
        } else {
            colind = lname.indexOf(":");
            mainblock = lname.slice(colind+1, lname.indexOf(colon.v, colind));
        }
        if (subname === ":") {
            subname = mainblock;
        } else {
            subname = mainblock + subname;
        }
        return subname;
    } 

    if (subname.slice(0, 6) === "../../" ) {
        //in a/b/c asking for a
        if (mainblock) {
            //console.log(mainblock)
        } else {
            colind = lname.indexOf(":");
            mainblock = lname.slice(colind+1, lname.indexOf(colon.v, colind));
        }
        main = mainblock.slice(0, mainblock.indexOf("/")); 
        if ((subname.length > 6) && (subname[6] !== ":") ) {
            subname =  main + "/" + subname.slice(6);
        } else {
            subname = main + subname.slice(6);
        }
    } else if (subname.slice(0,2) === "./" ) {
        // in a/b asking for a/b/c using ./c
        if (mainblock) {
            //console.log(mainblock)
        } else {
            colind = lname.indexOf(":");
            mainblock = lname.slice(colind+1, lname.indexOf(colon.v, colind));
        }
        if (subname[2] === ":" ) {
            subname = mainblock + subname.slice(2);
        } else {
            subname = mainblock + "/" + subname.slice(2);     
        }
    } else if (subname.slice(0,3) === "../") {
        //either in a/b or in a/b/c and asking for a or a/b, respectively
        if (mainblock) {
            //console.log(mainblock)
        } else {
            colind = lname.indexOf(":");
            mainblock = lname.slice(colind+1, lname.indexOf(colon.v, colind));
        }
        first = mainblock.indexOf("/");
        second = mainblock.indexOf("/", first+1);
    
        if (second !== -1) {
            // a/b/c case
            main = mainblock.slice(0, second);
        } else {
            main = mainblock.slice(0, first);
        }
    
        if ((subname.length > 3) && (subname[3] !== ":") ) {
            subname = main + "/" + subname.slice(3);
        } else {
            subname = main + subname.slice(3);
        }
    
    }
   

    return subname;

};

Folder.postInit = function () {}; //a hook for plugin this modification
Folder.plugins = {};
Folder.plugins.npminfo = { 
    deps : {   val : function (arr) {return arr.join(",\n");},
        element : function (str) {
            var pieces;
            
            if (str) {
                pieces = str.trim().split(/\s+/);
                if (pieces.length === 2) {
                    return '"' + pieces[0].trim() + '"' + " : " + '"^' + 
                        pieces[1].trim() + '"';
                } 
            }
        },
        save : "npm dependencies" 
    },
    dev : {   val : function (arr) {return arr.join(",\n");},
        element : function (str) {
            var pieces;
            
            if (str) {
                pieces = str.trim().split(/\s+/);
                if (pieces.length === 2) {
                    return '"' + pieces[0].trim() + '"' + " : " + '"^' + 
                        pieces[1].trim() + '"';
                } 
            }
        },
        save : "npm dev dependencies"
    }
};

Folder.reporters = {
    save : function (args) {
        var name = this.recording[args[2]] || args[2];
        return "NOT SAVED: " + args[0] + " AS REQUESTED BY: " + args[1] + 
            " NEED: " + name;
    },
    out : function (args) {
        var name = this.recording[args[2]] || args[2];
        return "NOT REPORTED OUT: " + args[0] + " AS REQUESTED BY: " + args[1] + 
            "\nNEED: " + name;
    },
    "command defined" : function (args) {
        var name = this.recording[args[2]] || args[2];
        return "COMMAND NOT DEFINED: " + args[0] + " AS REQUESTED IN: " + args[1] + 
            "\nNEED: " + name;
    },
    "scope exists" : function (data) {
        if (data[3]) {
            return "NEED SCOPE: " + data[0] + " FOR RETRIEVING: " + data[2] + 
                " IN FILE: " + data[1]; 
        } else {
            return "NEED SCOPE: " + data[0] + " FOR SAVING: " + data[2] + 
                " IN FILE: " + data[1]; 
        }
    },
    "text" : function (data) {
        var hint = this.recording[data[0]];
        var parts = data[0].split(":").reverse();
        var block = parts[0].split(this.colon.v)[0];
        if (hint) {
            return "PROBLEM WITH: " + hint + " IN: " + block + 
                " FIlE: " + parts[1]; 
        } 
    
    },
    "minor" : function (data) {
        var hint = this.recording[data[0]];
        var parts = data[0].split(":").reverse();
        var block = parts[0].split(this.colon.v)[0];
        if (hint) {
            return "PROBLEM WITH: " + hint + " IN: " + block + 
                " FIlE: " + parts[1]; 
        } 
    
    },
    "retrieval" : function (data) {
        return "NEED VAR: " + data[1] + " FROM: " + data[0];
    },
    "cmd" : function (data) {
        var ind = data[1].lastIndexOf(this.colon.v);
        if (ind === -1) {
            ind = data[1].length;
        }
        var name = data[1].slice(0, ind);
        var hint = this.recording[name];
        return "NEED COMMAND: " + data[0] + " FOR: " + hint; 
    }

};


Folder.prototype.reportwaits = function () {
    var report = this.reports;
    var reporters = this.reporters;
    var arr, msg, data, temp;

    arr = [];
    
    for (msg in report) {
        data = report[msg];
        if (reporters.hasOwnProperty(data[0]) ) {
            temp = reporters[data[0]].call(this, data.slice(1) );
            if (temp) {
                arr.push(temp);
            } else { 
               // console.log(msg, data);
            }
        }
    }

    return arr; 
};

Folder.commands = {   eval : sync(function ( text, args ) {
    var doc = this;

    var code = args.join("\n");


    try {
        eval(code);
        return text.toString();
    } catch (e) {
        doc.gcd.emit("error:command:eval:", [e, code, text]);
        return e.name + ":" + e.message +"\n" + code + "\n\nACTING ON:\n" +
            text;
    }
}, "eval"),
    sub : function (str, args, name) {
        var doc = this;
        var gcd = this.gcd;
    
        var index = 0, al = args.length, k, keys, obj = {}, 
            i, j, old, newstr, indented;
    
        for (i = 0; i < al; i +=2) {
           obj[args[i]] = args[i+1]; 
        }
    
        keys = Object.keys(obj).sort(function (a, b) {
            if ( a.length > b.length) {
                return -1;
            } else if (a.length < b.length) {
                return 1;
            } else {
                return 0;
            } });
    
    
        k = keys.length;
        for (j = 0; j < k; j += 1) {
            index = 0;
            old = keys[j];
            newstr = obj.hasOwnProperty(keys[j]) ? obj[keys[j]] : '';
            while (index < str.length ) {
                    i = str.indexOf(old, index);
                
                    if (i === -1) {
                        break;
                    } else {
                        indented = doc.indent(newstr, doc.getIndent(str, i));
                        str = str.slice(0,i) + indented + str.slice(i+old.length);
                        index = i + indented.length;
                    }
            }
        }
    
        gcd.emit("text ready:" + name, str);
    },
    store: sync(function (input, args) {
        var doc = this;
    
        var vname = doc.colon.escape(args[0]);
    
        if (vname) {
            doc.store(vname, input);
        }
        return input; 
    }, "store"),
    log : sync(function (input, args) {
        var doc = this;
        if (args && args.length) {
            doc.log(input + "\n~~~\n" + args.join("\n~~~\n"));
        } else {
            doc.log(input);
        }
        return input;
    }, "log"),
    async : async(function (text, args, callback) {
        var doc = this;
    
        var code =  args.join("\n");
    
        try {
            eval(code);
        } catch (e) {
            doc.gcd.emit("error:command:async:", [e, code, text]);
            callback(null, e.name + ":" + e.message +"\n"  + code + 
             "\n\nACTING ON:\n" + text);
        }
    }, "async"),
    compile : function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var file = doc.file;
        var colon = doc.colon.v;
        var escape = doc.colon.escape;
        var i, n, start, nextname, oldname, firstname;
    
        var stripped = name.slice(name.indexOf(":")+1) + colon + "c";
    
    
        var hanMaker = function (file, nextname, start) {
            return function (text) {
                doc.blockCompiling(text, file, nextname, start);
            };
        };
    
    
        if (args.length === 0) {
            gcd.once("minor ready:" + name + colon + "c", function (text) {
                gcd.emit("text ready:" + name, text); 
            });
            doc.blockCompiling(input, file, stripped);
        } else {
            n = args.length;
            firstname = oldname = escape(stripped + colon + ( args[0] || '') + colon + 0);
            for (i = 1; i < n; i += 1) {
                start = args[i] || '';
                nextname = escape(stripped + colon + start + colon + i);
                gcd.once("minor ready:" + file + ":" + oldname, hanMaker(file,
                    nextname, start) );
                gcd.emit("waiting for:cmd compiling:" + nextname  + ":from:" + doc.file, 
                    ["minor ready:" + file + ":" + nextname, "compile", nextname, doc.file, start]);
                oldname = nextname;
            }
            start =  args[0] || '';
            gcd.once("minor ready:" + file + ":" + oldname, function (text) {
                gcd.emit("text ready:"  + name, text);
            });
            doc.blockCompiling(input, file, firstname, start);
        }
    },
    raw : sync(function (input, args) {
        var doc = this;
        var start, end, text;
        var gcd = doc.gcd;
    
        var file = doc.parent.docs[args[2]] || doc;
        
        if (file) {
            text = file.text;
            start = args[0].trim() + "\n";
            start = text.indexOf(start)+start.length;
            end = "\n" + args[1].trim();
            end = text.indexOf(args[1], start);
            return text.slice(start, end);
        } else {
            gcd.emit("error:raw:" + doc.file, args);
            return '';
        }
    
    
    }, "raw"),
    trim : sync(function (input) {
        return input.trim();
    }, "trim"),
    cat : sync(function (input, args) {
        var sep = '';
        if (args.length > 1) {
            sep = args[0];
            args = args.slice(1);
        }
        return (input ? input + sep : '') + args.join(sep) ;
    }, "cat"),
    push : sync(function (input, args, name) {
        var folder = this.parent;
        var stack = folder.stack;
        var cmdpipe = name.slice(0, name.lastIndexOf(folder.colon.v));
        if (stack.hasOwnProperty(cmdpipe)) {
            stack[cmdpipe].push(input);
        } else {
            stack[cmdpipe] = [input];
        }
        return input;
    }, "push"),
    pop : sync(function (input, args, name) {
        var gcd = this.gcd;
        var folder = this.parent;
        var stack = folder.stack;
        var cmdpipe = name.slice(0, name.lastIndexOf(folder.colon.v));
        var ret;
        if (stack.hasOwnProperty(cmdpipe)) {
            ret = stack[cmdpipe].pop();
            if (stack[cmdpipe].length === 0) {
                delete stack[cmdpipe];
            }
        } else {
            gcd.emit("error:pop found nothing to pop:"+name);
            ret = input;           
        }
        return ret;
    }, "pop"),
    "if" : function (input, args, name) {
        var doc = this;
        var gcd = doc.gcd;
        var flag = args[0];
    
        if (doc.parent.flags.hasOwnProperty(flag) ) {
            doc.commands[args[1]].call(doc, input, args.slice(2), name);
        } else {
            gcd.emit("text ready:" + name, input);
        }
        
    
    },
    "done" : function (input, args, name) {
        var gcd = this.gcd;
        this.parent.done.gcd.emit(args[0]);
        gcd.emit("text ready:" + name, input);
    },
    "when" : function (input, args, name) {
        var folder = this.parent;
        var gcd = this.gcd;
        var done = folder.done;
        var cache = done.cache;
        var when = [];
    
        var i, n = args.length;
        for (i = 0; i < n; i +=1) {
            if (! cache[args[i]]) {
                when.push(args[i]);
            }
        }
        if (when.length > 0) {
            done.gcd.once("ready to send:" + name, function () {
                gcd.emit("text ready:" + name, input);
            });
            done.gcd.when(when, "ready to send:" + name);
        } else {
            gcd.emit("text ready:" + name, input);
        }
    }
};

Folder.directives = {   
    "save" : dirFactory(function (state) {
        state.emitname =  "for save:" + this.file + ":" + state.linkname;
    }, function (state) {
        var doc = this;
        var gcd = this.gcd;
        var linkname = state.linkname;
    
        var f = function (data) {
            if (data[data.length-1] !== "\n") {
               data += "\n";
            }
            gcd.emit("file ready:" + linkname, data);
        };
        f._label = "save;;" + linkname;
    
        state.handler = f;
    
    }, function (state) {
        var file = this.file;
        var gcd = this.gcd;
        var linkname = state.linkname;
        var options = state.options;
        var start = state.start;
        // es6 var {linkname, options, start} = state; 
    
        gcd.scope(linkname, options);
    
        gcd.emit("waiting for:saving file:" + linkname + ":from:" + file, 
             ["file ready:" + linkname, "save", linkname, file, start]);
    
    }),
    "new scope" : function (args) {
        var doc = this;
        var scopename = args.link;
    
        doc.parent.createScope(scopename);
    
    },
    "store" : dirFactory(function (state) {
        var linkname = state.linkname;
    
        state.emitname =  "for store:" + this.file + ":" + linkname;
    }, function (state) {
        var doc = this;
        var gcd = this.gcd;
        var linkname = state.linkname;
    
        var f = function (data) {
             doc.store(linkname, data);
        };
        f._label = "storeDir;;" + linkname;
    
        state.handler = f;
    
    }, function (state) {
    
    
        if (state.options) {
            state.block = state.start;
            state.start = '';
            state.value = state.options;
        }
    }),
    "log" : function (args) {
        
        var doc = this;
        var gcd = doc.gcd;
    
        var str = args.link;
        var i;
        while ( (i = str.indexOf("\\:") ) !== -1 )  {
            str = str.slice(0, i) + doc.colon.v + str.slice(i+2);
        }
    
        str = str || doc.colon.escape(args.cur);
    
        gcd.monitor(str, function (ev, data) {
            doc.log("EVENT: " + ev + " DATA: " + data);
        });
    
    },
    "out" : dirFactory(function (state) {
        state.emitname = "for out:" + this.file + ":" + this.colon.escape(state.linkname);
    }, function (state) {
        var doc = this;
        var gcd = doc.gcd;
        var linkname = state.linkname;
        var emitname = state.emitname;
    
    
        var f = function (data) {
            gcd.emit(emitname, data);
            doc.log(linkname + ":\n" + data + "\n~~~\n");
        };
    
        f._label = "out;;" + linkname;
    
        state.handler = f;       
    
    }, function (state)  {
        var gcd = this.gcd;
        var linkname = state.linkname;
        var emitname = state.emitname;
        var start = state.start;
        var options = state.options;
        
        gcd.scope(linkname, options);
    
        gcd.emit("waiting for:dumping out:" + linkname, 
            [emitname, linkname, this.file, start]  );
    }),
    "load" : function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var folder = doc.parent;
        var url = args.href.trim();
        var options = args.input;
        var urlesc = folder.colon.escape(url);
        var nickname = doc.colon.escape(args.link.trim());
        
        gcd.scope(urlesc, options);
    
        if (nickname && (nickname !== urlesc) ) {
            doc.createLinkedScope(urlesc, nickname);
            if (!(folder.docs.hasOwnProperty(urlesc) ) ) {
                gcd.emit("waiting for:loading for:" + doc.file, 
                    "need document:" + urlesc);
                gcd.emit("need document:" + urlesc, url );
            }
        } else {
            if (!(folder.docs.hasOwnProperty(urlesc) ) ) {
                gcd.emit("waiting for:loading for:" + doc.file, 
                    "need document:" + urlesc);
                gcd.emit("need document:" + urlesc, url );
            }
        }
    
    },
    "link scope" : function (args) {
        var doc = this;
        var alias = args.link;
        var scopename = args.input;
    
        doc.createLinkedScope(scopename, alias); 
    
    },
    "transform" : dirFactory(function (state) {
        state.name = this.colon.escape(state.start + ":" + state.input);
        state.emitname =  "for transform:" + this.file + ":" + state.name;
    }, function (state) {
        var gcd = this.gcd;
    
    
        var f = function (data) {
            gcd.emit(state.emitname, data);
        };
        f._label =  "transform;;" + state.name;
        
        state.handler = f;
    }, function (state) {
        var doc = this;
        var gcd = this.gcd;
        var name = state.name;
        var start = state.start;
        var emitname = state.emitname;
    
        gcd.emit("waiting for:transforming:" + name, 
            [emitname, name, doc.file, start]  );
    }),
    define : dirFactory(function (state) {
        state.emitname =  "cmddefine:" + state.linkname;
    }, function (state) {
        var cmdname = state.linkname;
        var doc = this;
        var gcd = this.gcd;
    
        var han = function (block) {
            var f; 
            
            try {
                block = "f="+block;
                eval( block);
            } catch (e) {
                doc.gcd.emit("error:define:"+cmdname, [e, block]);
                doc.log(e.name + ":" + e.message +"\n" + block);
                return;
            }
    
            switch (state.options) {
                case "raw" :  f._label = cmdname;
                    doc.commands[cmdname] = f;
                break;
                case "async" : doc.commands[cmdname] = 
                    doc.wrapAsync(f, cmdname);
                break;
                default : doc.commands[cmdname] = 
                    doc.wrapSync(f, cmdname);
            }
    
            gcd.emit("command defined:" + cmdname);
        };
        han._label = "cmd define;;" + cmdname;
    
        state.handler = han;
    
    }, function (state) {
        var cmdname = state.linkname;
    
        var file = this.file;
        var gcd = this.gcd;
    
        gcd.emit("waiting for:command definition:" + cmdname, 
            ["command defined:"+cmdname, cmdname, file, state.start]  );
    
    }),
    "block" : function (args) {
        var doc = this;
        
        if (args.link === "off") {
            doc.blockOff += 1;
        } else if (args.link === "on") {
            if (doc.blockOff > 0 ) {
                doc.blockOff -= 1;
            }
        } else {
            doc.log("block directive found, but the toggle was not understood: " + 
                args.link + "  It should be either on or off");
        }
    
    },
    "ignore" : function (args) {
        var lang = args.link;
    
        var doc = this;
        var gcd = doc.gcd;
    
        gcd.on("code block found:" + lang, "ignore code block");
    
    },
    "eval" : function (args) {
        var doc = this;
    
        var block = doc.blocks[args.cur];
    
    
        try {
            eval(block);
        } catch (e) {
            doc.gcd.emit("error:dir eval:", [e, block]);
            doc.log(e.name + ":" + e.message +"\n" + block);
            return;
        }
        
    },
    "if" : function (args) {
        
        var doc = this;
        var folder = doc.parent;
        var gcd = doc.gcd;
        
        var title = args.input;
        var ind = title.indexOf(";");
        var flag = title.slice(0, ind).trim();
        var directive, semi, fun;
        
        if (folder.flags.hasOwnProperty(flag) ) {
            semi = title.indexOf(":", ind);
            directive = title.slice(ind+1, semi).trim();
            args.directive = directive;
            args.input = title.slice(semi+1).trim();
    
            if (directive && (fun = doc.directives[directive] ) ) {
                fun.call(doc, args);
            }
        }
    },
    "flag" : function (args) {
        this.parent.flags[args.link.trim()] = true;
    
    },
    "version" : function (args) {
        var doc = this;
        var colon = doc.colon;
    
        var ind = args.input.indexOf(";");
        if (ind === -1) { ind = args.input.length +1; }
    
        doc.store(colon.escape("g::docname"), 
            args.link.trim());
        doc.store(colon.escape("g::docversion"),
            args.input.slice(0, ind).trim());
        doc.store(colon.escape("g::tagline"), 
            (args.input.slice(ind+1).trim() || "Tagline needed" ) );
    
    },
    "npminfo" : function self (args) {
        var doc = this;
        var g = "g" + doc.colon.v + doc.colon.v;
    
        var types = doc.plugins.npminfo;
    
        doc.store(g+"authorname", args.link);
    
        var gituser = args.href.slice(args.href.lastIndexOf("/")+1).trim();
        doc.store(g+"gituser", gituser);
    
        var pieces = args.input.split(";");
    
        doc.store(g + "authoremail", (pieces.shift() || '').trim());
      
        pieces.forEach(function (el) {
            if (!el) {return;}
    
            var ret = [];
            
            var ind = el.indexOf(":");
            var kind = el.slice(0, ind).trim();
            kind = types[kind];
            if (!kind) { doc.log("unrecognized type");return;}
            var entries = el.slice(ind+1).split(",");
            entries.forEach(function(el) {
                if (!el) {return;}
                var bits = kind.element(el);
                if (bits) {
                    ret.push(bits);
                }
            });
            doc.store(g +  kind.save, kind.val(ret) );
        });
    
        doc.store(g + "year", ( new Date() ).getFullYear().toString() );
    },
};



var Doc = Folder.prototype.Doc = function (file, text, parent, actions) {
    this.parent = parent;
    var gcd = this.gcd = parent.gcd;

    this.file = file; // globally unique name for this doc

    parent.docs[file] = this;

    this.text = text;

    this.blockOff = 0;
    
    this.levels = {};
    this.blocks = {'' : ''}; //an empty initial block in case of headless
    this.heading = this.curname = '';
    this.levels[0] = text;
    this.levels[1] = '';
    this.levels[2] = '';

    
    this.vars = parent.createScope(file);

    this.commands = parent.commands;
    this.directives = parent.directives;
    this.colon = Object.create(parent.colon); 
    this.join = parent.join;
    this.log = this.parent.log;
    this.scopes = this.parent.scopes;
    this.subnameTransform = this.parent.subnameTransform;
    this.indicator = this.parent.indicator;
    this.wrapAsync = parent.wrapAsync;
    this.wrapSync = parent.wrapSync;
    this.dirFactory = parent.dirFactory;
    this.plugins = Object.create(parent.plugins);

    if (actions) {
        apply(gcd, actions);
    }

    return this;

};

var dp = Doc.prototype;

dp.retrieve = function (name, cb) {
    var doc = this;
    var gcd = doc.gcd;

    var scope = doc.getScope(name);


    var varname = scope[1];
    var file = scope[2];
    scope = scope[0];
    var f;
    if (scope) {
        if (scope.hasOwnProperty(varname) ) {
            if (typeof cb === "function") {
                cb(scope[varname]);
            } else if (typeof cb === "string") {
                gcd.emit(cb, scope[varname]);
            } else {
                gcd.emit("error:unrecognized callback type:" +
                    doc.file + ":" + name, (typeof cb) );
            }
            return ;
        } else {
            gcd.emit("waiting for:retrieval:" + doc.file, 
                ["text stored:" + file + ":" + varname, "retrieval", file, varname]);
            f = function () {
                doc.retrieve(name, cb);
            };
            f._label = "Retrieving:" + file + ":" + varname;
            gcd.once("text stored:" + file + ":" + varname, f);
            return ;
        }
    } else {
        gcd.emit("waiting for:retrieval:" + cb+ "need:" + name, 
            ["scope exists:" + file, "scope exists",  file, doc.file, varname,
            true]);
        f = function () {
            doc.retrieve(name, cb);
        };
        f._label = "Retrieving:" + doc.file + ":" + name;
        gcd.once("scope exists:" + file, f);
        return ;
    }
};

dp.getScope = function (name) {
    var ind, scope, alias, scopename, varname;
    var doc = this;
    var colon = doc.colon;
    var folder = doc.parent;

    if (  (ind = name.indexOf( colon.v + colon.v) ) !== -1 ) {
        alias = name.slice(0,ind);
        varname = name.slice(ind+2);
        scopename = doc.scopes[ alias ];
        if (typeof scopename === "string") {
            while ( typeof (scope = folder.scopes[scopename]) === "string") { 
                scopename = scope;   
            }
            if (scope) {
                return [scope, varname, scopename]; 
            } else { //this should never happen
                doc.gcd.emit("error:non-existent scope linked:" + 
                    alias, scopename);
            }
        } else if (scopename) { //object -- alias is scope's name
            return [scopename, varname, alias];
        } else { // not defined yet
            return [null, varname, alias];
        }
    } else { //doc's scope is being requested
        return [doc.vars, name, doc.file];
    }
};

dp.createLinkedScope = function (name, alias) {
    var doc = this;
    var gcd = doc.gcd;
    var folder = doc.parent;
    var scopes = folder.scopes;
    var colon = doc.colon;

    name = colon.escape(name);
    alias = colon.escape(alias);

    if (scopes.hasOwnProperty(alias) ) {
        if (scopes[alias] !== name ) {
            gcd.emit("error:conflict in scope naming:" +
                 doc.file, [alias, name] );
        } 
    } else {
        if ( scopes.hasOwnProperty(name) ) {
            folder.scopes[alias] = name;
            gcd.emit("scope linked:" + doc.file + ":" + alias, name);
            gcd.emit("scope exists:" + alias);
        } else {
            gcd.once("scope exists:" + name, function () {
                folder.scopes[alias] = name;
                gcd.emit("scope linked:" + doc.file + ":" + alias, name);
                gcd.emit("scope exists:" + alias);
            });
        }
    }


};
 
dp.indent = function (text, indent, gcd) {
    var line, ret;
    var i, n;
    
    n = indent;
    line = '';
    for (i = 0; i <n; i += 1) {
        line += ' ';
    }
    
    if (typeof text !== "string") {
        gcd.emit("error:indent does not see a text item", text);
        return ret;
    }

    ret = text.replace(/\n/g, "\n"+line);
    return ret;
};

dp.getIndent = function ( block, place ) {
    var first, backcount, indent, chr;
    first = place;
    backcount = place-1;
    indent = 0;
    while (true) {
        if ( (backcount < 0) || ( (chr = block[backcount]) === "\n" ) ) {
            indent = first - ( backcount + 1 ); 
            break;
        }
        if (chr.search(/\S/) === 0) {
            first = backcount;
        }
        backcount -= 1;
    }
    return indent;
};

dp.blockCompiling = function (block, file, bname, mainblock) {
    var doc = this;
    var gcd = doc.gcd;
    var colon = doc.colon;
    
    var  quote, place, lname, slashcount, numstr, chr, indent;
    var name = file + ":" + bname;
    var ind = 0;
    var start = 0; 
    var stitchfrag;
    var stitchend = "ready to stitch:" + name;
    gcd.when("block substitute parsing done:"+name, stitchend);
    var n = block.length;

    gcd.once(stitchend, function (data) {
        
        var text = '', insert, i, n = data.length;
        var indent = doc.indent;
    
        for (i = 1; i < n; i += 1) {
            insert = data[i][1];
            if ( (i+1 < n) && ( data[i+1][0].slice(0,6) === "indent") ) {
                text += indent(insert, data[i+1][1], gcd);
                i += 1; 
            } else {
                text += insert;
            }
        
        }         
    
        if (bname.indexOf(colon.v) !== -1) {
            gcd.emit("minor ready:" + name, text);
        } else {
            doc.store(bname, text);
            gcd.emit("text ready:" + name, text);
        }
    });
          
    var stitcher = function (start) {
        if (start < n) {
            stitchfrag = "stitch fragment:" + name + colon.v + start;
            gcd.when(stitchfrag, stitchend);
        }
    };

    stitcher(0);
    
    while (ind < n) {
        ind = block.indexOf("\u005F", ind);
        if (ind === -1) {
            gcd.emit(stitchfrag, block.slice(start) );
            break;
        } else {
            ind += 1;

            if (block[ind].match(/['"`]/)) {
                quote = block[ind];
            } else {
                continue;
            }
            
            place = ind-2;
            numstr = '0123456789';
            slashcount = '';
            chr = block[place];
            if (chr === '\\' ) { //escaped underscore; no escaping backslash!
                gcd.emit(stitchfrag, block.slice(start, place) + "\u005F" );
                start = ind;  
                stitcher(start);
                continue;
            } else if ( numstr.indexOf(chr) !== -1 ) {
                slashcount += chr;
                place -= 1;
                chr = block[place];
                while ( numstr.indexOf(chr) !== -1 ) {
                    slashcount += chr;
                    place -= 1;
                    chr = block[place];
                }
                if (chr === '\\') {
                    slashcount = parseInt(slashcount, 10);
                    if (slashcount > 0) {
                        slashcount -= 1;
            
                        gcd.emit(stitchfrag, block.slice(start, place) + "\\" +
                             slashcount + "\u005F");
            
                        stitcher(place); 
                        start = doc.findMatchQuote(block, quote, ind+1); //+1 to get past quote
                        // yes this is supposed to be reversed (from quote to quote,
                        // start is just beyond quote 
                        gcd.emit(stitchfrag, block.slice(ind, start)); 
                        
                        stitcher(start); 
                        ind = start;
                        continue;
                    } else {
                        gcd.emit(stitchfrag, block.slice(start, place));  
                        start = ind-1; // underscore
                        stitcher(start-2); //to point to where the escape sequence 
                    }
                }
            } 

            place = ind-1;
            if (start !== place ) { // \0 could have happened
                gcd.emit(stitchfrag, block.slice(start, place)); 
                start = place; // underscore
                stitcher(start);
            }
            lname = name + colon.v + start;
            gcd.flatWhen("text ready:" + lname, stitchfrag);  
            
            if (place > 0) {
                indent = doc.getIndent(block, place);
                if ( indent > 0 ) {
                    gcd.when("indent for prior:" + lname, stitchend);
                    gcd.emit("indent for prior:" + lname, doc.getIndent(block, place));
                }
            }
        
            start = doc.substituteParsing(block, ind+1, quote, lname,
                     mainblock);
           
            doc.parent.recording[lname] = block.slice(ind-1, start);
            
            stitcher(start);
            ind = start ;

        }
    }


    gcd.emit("block substitute parsing done:"+name);
};

dp.substituteParsing = function (text, ind, quote, lname, mainblock ) { 

    var doc = this;
    var gcd = doc.gcd;
    var colon = doc.colon;

    var match, subname, chr, subtext;
    var subreg = doc.regexs.subname[quote];

    var doneEmit = "text ready:" + lname; 
    var textEmit = doneEmit + colon.v + ind;
    var subEmit = "substitution chain done:" + lname; 

    gcd.when(textEmit, subEmit);

    gcd.once(subEmit, function (data) { 
        gcd.emit(doneEmit, data[data.length-1][1] || '');
    } );

    subreg.lastIndex = ind;
    
    match = subreg.exec(text);
    if (match) {
        ind = subreg.lastIndex;
        chr = match[2];
        subname = match[1].trim().toLowerCase();
        subname = doc.subnameTransform(subname, lname, mainblock);
        subname = colon.escape(subname);
        if (chr === "|") {
            ind = doc.pipeParsing(text, ind, quote, lname, mainblock, subEmit,
                textEmit );
        } else if (chr === quote) {
            // nothing to do; it should automatically work !!!
        } else {
            gcd.emit("failure in parsing:" + lname, ind);
            return ind;
        }
    } else {
        gcd.emit("failure in parsing:" + lname, ind);
        return ind;
    }
 

    if (subname === '') { // no incoming text, just commands acting
        gcd.emit(textEmit, '');
    } else {
        subtext = doc.retrieve(subname, textEmit);
    }

    return ind;

};

dp.pipeParsing = function (text, ind, quote, name, mainblock, toEmit, textEmit) {
    var doc = this;
    var gcd = doc.gcd;
    var colon = doc.colon;
   
    var incomingEmit = textEmit;

    var chr, argument, argnum, match, command, 
        comname, nextname, aname, result, start, orig=ind ;
    var n = text.length;
    var comnum = 0;
    var comreg = doc.regexs.command[quote];
    var argreg = doc.regexs.argument[quote];
    var wsreg = /\s*/g;


    while (ind < n) { // command processing loop

        comreg.lastIndex = ind;
        start = ind; 
        
        match = comreg.exec(text);
        if (match) {
            command = match[1].trim().toLowerCase();
            chr = match[2];
            ind = comreg.lastIndex;
            if (command === '') {
                command = "passthru";    
            }
            command = colon.escape(command);
            comname = name + colon.v + start;
            
            gcd.once("arguments ready:" + comname, 
                doc.argFinishingHandler(comname));
        
            gcd.when([incomingEmit, 
                      "command parsed:" + comname ],
                "arguments ready:"  + comname );
        
            gcd.when("text ready:" + comname, toEmit);
        
            incomingEmit = "text ready:" + comname;
        
            if (chr === quote) {
                ind -= 1; // it is set to just after the last position 
                gcd.emit("command parsed:" + comname, 
                    [doc.file, command, "text ready:" + comname ]);
                break;
            
            } else if (chr === "|") {
                // nothing to do; just done. 
            } else {
                ind = doc.argProcessing(text, ind, quote, comname, mainblock );
            }
        
        } else {
            gcd.emit("error:command parsing:" + name + colon.v + ind);
            return ind+1;
        }

        gcd.emit("command parsed:" + comname, 
            [doc.file, command, "text ready:" + comname ]);

        if (text[ind] === quote) {
            break;
        } else if (text[ind] === "|") {
            start = ind += 1;
        } else {
            gcd.emit("error:bad terminating character in command" + 
                name, [ind, text[ind]]);
        }

    }
    

    return ind+1;

};

dp.regexs = {

    command : {
        "'" : /\s*([^|'\s]*)(.)/g,
        '"' : /\s*([^|"\s]*)(.)/g,
        "`" : /\s*([^|`\s]*)(.)/g
    },
    argument : {
        "'" : /\s*([^,|\\']*)(.)/g,
        '"' : /\s*([^,|\\"]*)(.)/g,
        "`" : /\s*([^,|\\`]*)(.)/g
    },
    endarg : {
        "'" : /\s*([,|\\'])/g,
        '"' : /\s*([,|\\"])/g,
        "`" : /\s*([,|\\`])/g

    },
    subname : {
        "'" : /\s*([^|']*)(.)/g,
        '"' : /\s*([^|"]*)(.)/g,
        "`" : /\s*([^|`]*)(.)/g
    }


};

dp.store = function (name, text) {
    var doc = this;
    var gcd = doc.gcd;
    var scope = doc.getScope(name);

   
    var f;
    if (! scope[0]) {
        gcd.emit("waiting for:storing:" + doc.file + ":" + name,
            ["scope exists:" + scope[2], "scope exists",  scope[2],
            doc.file, scope[1] ]);
        f = function () {
            doc.store(name, text);
        };
        f._label = "Storing:" + doc.file + ":" + name;
        gcd.once("scope exists:" + scope[2], f);
        return;
    }

    var varname = scope[1];
    var file = scope[2];
    scope = scope[0];

    var old; 
    if (scope.hasOwnProperty(varname) ) {
        old = scope[varname];
        scope[varname] = text;
        gcd.emit("overwriting existing var:" + file + ":" + varname, 
        {oldtext:old, newtext: text} );
    } else {
        scope[varname] = text;
    }
    gcd.emit("text stored:" + file + ":" + varname, text);
};

dp.getBlock = function (start, cur) {
    var doc = this;
    var colon = doc.colon;

    cur = colon.restore(cur);

    if (start) {
        if ( start[0] === "#") {
            start = start.slice(1).replace(/-/g, " ");
        }

        start = start.trim().toLowerCase();

        if (start[0] === ":") {
            start = doc.stripSwitch(cur) + start;
        }

    } 
    if (!start) {
        start = cur;
    }

    return colon.escape(start);
};

dp.stripSwitch = function (name) {
    var ind, blockhead;

    blockhead = name;

    if ( (ind = name.indexOf("::")) !== -1)  {
        if (  (ind = name.indexOf(":", ind+2 )) !== -1 ) {
            blockhead = name.slice(0, ind);
        }
    } else if ( (ind = name.indexOf(":") ) !== -1) {
        blockhead = name.slice(0, ind);
    }

    return blockhead;

};

dp.midPipes = function (str) {
    var ind = str.indexOf("|");
    var options, pipes;

    ind = str.indexOf("|");
    if (ind === -1) {
        options = str.trim();
        pipes = "";
    } else {
        options = str.slice(0,ind).trim();
        pipes = str.slice(ind+1);
    }

    return [options, pipes];
};

dp.pipeDirSetup = function (str, emitname, handler, start) {
    var doc = this;
    var gcd = doc.gcd;
    var colon = doc.colon;
    var block;

    var subEmit, textEmit, doneEmit;

    if (str) {
        str = str + '"';
        doneEmit = "text ready:" + emitname;
        textEmit = "text ready:" + emitname + colon.v + "sp";
        subEmit = "pipe chain ready:" + emitname + colon.v + "sp";
        gcd.once(doneEmit, handler);
        
        gcd.when(textEmit, subEmit);
        
        gcd.once(subEmit, function (data) {
            var text = data[data.length-1][1] || '';
            gcd.emit(doneEmit, text);
        });
        

        block = doc.stripSwitch(colon.restore(start));

        doc.pipeParsing(str, 0, '"', emitname + colon.v + "sp", block,
            subEmit, textEmit);

    } else {
        gcd.once("text ready:" + emitname + colon.v + "sp", handler); 
    }

};

dp.findMatchQuote = function (text, quote, ind) {
    var char;
    var n = text.length;
    var level = 0;

    while ( ind < n) {
        char = text[ind];
        ind += 1;
        if (char === quote) {
            if ( level === 0)   {
                break;
            } else {
                level -= 1;
            }
        } else if (char === '\u005F') {
            if (text[ind] === quote) {
                level += 1;
                ind += 1;
            }

        } else if (char === "\\") {
            if ( text[ind] === quote) {
                ind += 1;  // skip over the quote
            }
        }
    }

    return ind;
};

dp.argHandlerMaker =     function (curname, gcd) {
        var f = function (data) {
            var ret = [data[1][1]]; //cmd name
            var args = data.slice(2);
            args.forEach(function (el) {
                ret.push(el[1]);
            });
            gcd.emit("arg command ready:" + curname, ret);
        };
        f._label = "arg command processing;;"+curname;
        return f;
    };

dp.argEscaping = function (text, ind ) {
    var chr, match, num;
    var uni = /[0-9A-F]+/g;
    var indicator = this.indicator;

    chr = text[ind];
    switch (chr) {
    case "|" : return ["|", ind+1];
    case '\u005F' : return ['\u005F', ind+1];
    case "\\" : return ["\\", ind+1];
    case "'" : return ["'", ind+1];
    case "`" : return ["`", ind+1];
    case '"' : return ['"', ind+1];
    case "n" : return [indicator + "\n" + indicator, ind+1];
    case "t" : return [indicator + "\t" + indicator, ind+1];
    case " " : return [indicator + " " + indicator, ind+1];
    case "," : return [",", ind+1];
    case "u" :  uni.lastIndex = ind;
    match = uni.exec(text);
    if (match) {
        num = parseInt(match[0], 16);
        try {
            chr = String.fromCodePoint(num);
            return [chr, uni.lastIndex];
        } catch (e)  {
            return ["\\", ind];
        }
    } else {
        return ["\\", ind];
    }
    break;
    default : return ["\\", ind];

    }
};

dp.argProcessing = function (text, ind, quote, topname, mainblock) {
    var doc = this;
    var gcd = doc.gcd;
    var n = text.length;
    var stack = [];
    var argstr = '';
    var name = [topname];
    var emitname = topname;
    var colon = doc.colon;
    var argstring = '';
    var curname;
    var err;
    var temp;
    var start = ind;
    var cp = "c\u0028";  // c parentheses
    var argdone = false;
   
    var handlerMaker = doc.argHandlerMaker;
    var escaping = doc.argEscaping; 

    var wsreg = /\S/g;

        wsreg.lastIndex = ind;
        if (wsreg.test(text) ) {
            start = ind = wsreg.lastIndex - 1;
        } else {
            ind = text.length;
            err = [start, ind];
            gcd.emit("error:" + topname, [err, "argument is just whitespace with no terminating"]);
            return;
        }

    name.push(ind);
     
    
    while ( ind < n ) {

        //console.log(ind, " : ", argstring, text[ind], " --- ", stack); 

        switch (text[ind]) {

            case "\u005F" :  // underscore
                if ( (start === ind) &&
                     ( "\"'`".indexOf(text[ind+1]) !== -1 ) ) {
                    curname = name.join(colon.v) + colon.v +  ind;
                    gcd.when("text ready:" + curname, "arguments ready:" + emitname);
                    temp =  doc.substituteParsing(text, ind+2, text[ind+1], curname, mainblock);
                    
                    if ( temp === text.length) {
                        //error
                        err = [curname];
                        gcd.emit("error:" + topname, [err, "substitution consumed rest of block"]);
                        return temp;
                    } else {
                        ind = temp;
                    }
                    
                    argstring = '';
                    argdone = true;
                        wsreg.lastIndex = ind;
                        if (wsreg.test(text) ) {
                            start = ind = wsreg.lastIndex - 1;
                        } else {
                            ind = text.length;
                            err = [start, ind];
                            gcd.emit("error:" + topname, [err, "argument is just whitespace with no terminating"]);
                            return;
                        }
                    continue;
                } else {
                    argstring += "\u005F";
                }
            break;
           
            case "," : 
                if ( (stack.length === 0 ) || (stack[0] === cp) ) {
                    if (argdone) {
                        if (argstring !== "") {
                            err = [argstring, start, ind];
                            gcd.emit("error:" + topname, [err, "stuff found after argument finsihed"]);
                            argstring = "";
                        }
                        argdone = false;
                        start = ind+1;
                        
                    } else { // simple string
                        curname = name.join(colon.v);
                        gcd.when("text ready:" + curname , "arguments ready:" + emitname);
                        gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                        argstring = "";
                        start = ind +1;
                    }
                    ind +=1;
                        wsreg.lastIndex = ind;
                        if (wsreg.test(text) ) {
                            start = ind = wsreg.lastIndex - 1;
                        } else {
                            ind = text.length;
                            err = [start, ind];
                            gcd.emit("error:" + topname, [err, "argument is just whitespace with no terminating"]);
                            return;
                        }
                    continue;
                } else {
                    argstring += ",";
                }
            break;
            
            case "\\" :  
                temp = doc.argEscaping(text, ind+1);
                argstring += temp[0];
                ind = temp[1];
            continue;

            case "|" :
                if (stack.length === 0) {
                    // make sure there is an argument
                    if (argstring.trim()) {
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finsihed"]);
                                argstring = "";
                            }
                            argdone = false;
                            start = ind+1;
                            
                        } else { // simple string
                            curname = name.join(colon.v);
                            gcd.when("text ready:" + curname , "arguments ready:" + emitname);
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            argstring = "";
                            start = ind +1;
                        }
                    }
                    return ind;
                    
                } else {
                    argstring += "|";
                }   
            break;


                case "[" : 
                    stack.unshift("[");
                    argstring += "[";
                break;
            
                case "]":
                    if (stack[0] === String.fromCharCode("]".charCodeAt(0)-1)) {
                        stack.shift();
                    }
                    argstring += "]" ;
                break;
            
                case "(" :
                   //make sure no whitespace to be a command
                   // also make sure either top level or in cp
                   if ( ( (stack.length ===0) || (stack[0] === cp) ) && 
                        (argstring.search(/^\S+\s*$/) !== -1) ) {
                       
                       stack.unshift(cp);
                       name.push(ind);
                       curname = name.join(colon.v);
                       gcd.once("arguments ready:" + curname, handlerMaker(curname, gcd));
                       gcd.when("arg command ready:" + curname, "arguments ready:" + emitname);
                       gcd.when(["arg command parsed:" + curname, "command is:" + curname], "arguments ready:" + curname);
                       gcd.emit("arg command is:" + curname, argstring);
                       argstring = '';
                       emitname = curname;
                   } else {
                       stack.unshift("(");
                       argstring += "(";
                   } 
                break;
                
                case ")" :
                    if (stack[0] === cp) {
                        stack.shift();
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finsihed"]);
                                argstring = "";
                            }
                            argdone = false;
                            start = ind+1;
                            
                        } else { // simple string
                            curname = name.join(colon.v);
                            gcd.when("text ready:" + curname , "arguments ready:" + emitname);
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            argstring = "";
                            start = ind +1;
                        }
                        gcd.emit("command parsed:" + emitname);
                        name.pop();
                        emitname = name.join(colon.v);
                    } else {
                        if (stack[0] === String.fromCharCode(")".charCodeAt(0)-1)) {
                            stack.shift();
                        }
                        argstring += ")" ;
                    }
                break;
            
                case "{" :
                    stack.unshift("{");
                    argstring += "{";
                break;
            
                case "}" :
                    if (stack[0] === String.fromCharCode("}".charCodeAt(0)-1)) {
                        stack.shift();
                    }
                    argstring += "}" ;
                break;

            case "'" :
                if ( (stack.length === 0) && (quote === "'") ) {
                    if (argstring.trim()) {
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finsihed"]);
                                argstring = "";
                            }
                            argdone = false;
                            start = ind+1;
                            
                        } else { // simple string
                            curname = name.join(colon.v);
                            gcd.when("text ready:" + curname , "arguments ready:" + emitname);
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            argstring = "";
                            start = ind +1;
                        }
                    }
                    return ind;
                } else {
                    // start after current place, get quote position
                    temp = text.indexOf("'", ind+1); 
                    if (temp === -1 ) { 
                        err = [start, ind, temp];
                        gcd.emit("error:" + topname, [err, "non-terminating quote"]);
                        argstring += "'";
                    } else {
                        argstring += text.slice(ind, temp);    
                        ind = temp;
                        continue;
                    }
                }
            break;
            case "\u0022" :
                if ( (stack.length === 0) && (quote === "\u0022") ) {
                    if (argstring.trim()) {
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finsihed"]);
                                argstring = "";
                            }
                            argdone = false;
                            start = ind+1;
                            
                        } else { // simple string
                            curname = name.join(colon.v);
                            gcd.when("text ready:" + curname , "arguments ready:" + emitname);
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            argstring = "";
                            start = ind +1;
                        }
                    }
                    return ind;
                } else {
                    // start after current place, get quote position
                    temp = text.indexOf("\u0022", ind+1); 
                    if (temp === -1 ) { 
                        err = [start, ind, temp];
                        gcd.emit("error:" + topname, [err, "non-terminating quote"]);
                        argstring += "\u0022";
                    } else {
                        argstring += text.slice(ind, temp);    
                        ind = temp;
                        continue;
                    }
                }
            break;

            case "`" :
                if ( (stack.length === 0) && (quote === "`") ) {
                    if (argstring.trim()) {
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finsihed"]);
                                argstring = "";
                            }
                            argdone = false;
                            start = ind+1;
                            
                        } else { // simple string
                            curname = name.join(colon.v);
                            gcd.when("text ready:" + curname , "arguments ready:" + emitname);
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            argstring = "";
                            start = ind +1;
                        }
                    }
                    return ind;
                } else {
                    // start after current place, get quote position
                    temp = text.indexOf("`", ind+1); 
                    if (temp === -1 ) { 
                        err = [start, ind, temp];
                        gcd.emit("error:" + topname, [err, "non-terminating quote"]);
                        argstring += "`";
                    } else {
                        argstring += text.slice(ind, temp);    
                        ind = temp;
                        continue;
                    }
                }
            break;
            default: 
                argstring += text[ind];
                


        }

        ind +=1;

    }
    
    return ind;

};

dp.argFinishingHandler = function (comname) {
    var doc = this;
    var gcd = this.gcd;

    var f = function (data) {
        var input, args, command, subs;
    
        input = data[0][1];
        command = data[1][1][1];
        args = data.slice(2).map(function (el) {
            return el[1];
        });
    
        var fun = doc.commands[command];
    
        if (fun) {
            fun.apply(doc, [input, args, comname, command]);
        } else {
            han = function () {
                fun = doc.commands[command];
                if (fun) {
                    fun.apply(doc, [input, args, comname, command]);
                } else { // wait some more
                    gcd.once("command defined:" + command, han);
                }
            };
            han._label = "delayed command:" + command + ":" + comname; 
            gcd.once("command defined:" +  command, han); 
        }
    
    
    };
    f._label = "waiting for arguments:" + comname; 
    return f;
};

dp.whitespaceEscape = function (text) {
    var indicator = this.indicator;
    var n = indicator.length, start, end, rep;
    while ( (start = text.indexOf(indicator) ) !== -1 ) {
        end = text.indexOf(indicator, start + n);
        rep = text.slice(start+n, end);
        if (rep === "n") {
            rep = "\n";
        }
        text = text.slice(0, start) + rep + text.slice(end+n);
    }
    return text;

};

module.exports = Folder;
