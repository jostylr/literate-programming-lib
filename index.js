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
        this.docs = {};
        this.scopes = {};
        
        this.commands = Object.create(Folder.commands);
        this.directives = Object.create(Folder.directives);
        this.reports = {};
        this.recording = {};
        this.reporters = Folder.reporters;
        
        this.maker = {   'emit text ready' : function (doc, name) {
                        var gcd = doc.gcd;
            
                        var evt =  "text ready:" + name;
                        gcd.emit("waiting for:text:"  + name, 
                            [evt, "text", name]);
                        var f = function (text) {
                            gcd.emit(evt, text);
                        };
                        f._label = "emit text ready;;" + name;
                        return f;
                    },
                'store' : function (doc, name, fname) {
                        
                        var f = function (text) {
                            doc.store(name, text);
                        };
                        f._label = "store;;" + (fname ||  name);
                        return f;
                    },
                'store emit' : function (doc, name, fname) {
                        fname = fname || name;
                        var gcd = doc.gcd;
            
                        var evt = "text ready:" + fname;
                        gcd.emit("waiting for:text:"  + fname, 
                            [evt, "text", fname]);
                        var f = function (text) {
                            doc.store(name, text);
                            gcd.emit(evt, text);
                        };
                        f._label = "store emit;;" +  fname;
                        return f;
                    },
                'location filled' : function (doc, lname, loc, frags, indents ) {
                        var gcd = doc.gcd;
            
                        var evt = "location filled:" + lname;
                        gcd.emit("waiting for:location:"  + lname,
                            [evt, "location", lname]);
            
                        var f = function (subtext) {
                            subtext = doc.indent(subtext, indents[loc]);
                            frags[loc] = subtext;
                            gcd.emit(evt);
                        };
                        f._label = "location filled;;" + lname;
                        return f;
                    },
                'stitch emit' : function (doc, name, frags) {
                        var gcd = doc.gcd;
            
                        var evt = "minor ready:" + name;
                        gcd.emit("waiting for:minor:" + name,
                            [evt, "minor", name]);
            
                        var f = function () {
                            gcd.emit(evt, frags.join(""));
                        };
                        f._label = "stitch emit;;" + name;
                        return f;
                    },
               'stitch store emit' : function (doc, bname, name, frags) {
                        var gcd = doc.gcd;
            
                        var evt = "text ready:" + name;
                        gcd.emit("waiting for:text:"  + name,
                            [evt, "text", name]);
            
                        var f = function () {
                            var text = frags.join("");
                            doc.store(bname, text);
                            gcd.emit(evt, text);
                        };
                        f._label = "stitch store emit;;" + name;
                        return f;
                    }
            };
    
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
        
        gcd.on("arguments ready", "run command");
        
        gcd.action("run command", function (data, evObj) {
                var gcd = evObj.emitter;
                var doc, input, name, cur, command, min = [Infinity,-1], han;
                var args = [];
                
                var i, j, k, m, n=data.length;
                for (i = 0; i < n; i += 1) {
                    cur = data[i];
                    if (data[i][0].indexOf("command parsed") === 0 ) {
                        doc = gcd.parent.docs[data[i][1][0]];
                        command = data[i][1][1];
                        name = data[i][1][2];
                    } else { // should only be text ready
                        j = i;
                        if ( ( m = data[i][0].length ) < min[0] ) {
                            j = min[1];
                            min = [m, i];
                        }
                        if (j !== -1) {
                            k = data[j][0].match(/([0-9]+)$/);
                            if (k) {
                                args[k[1]] = data[j][1];
                            }
                        }
                    }
                }
                
                input = data[min[1]][1];
                
                var fun = doc.commands[command];
                
                if (fun) {
                    fun.apply(doc, [input, args, name, command]);
                } else {
                    gcd.emit("waiting for:command:" + command, 
                        ["command defined:" + command, "cmd", command, name]);
                    han = function () {
                        fun = doc.commands[command];
                        if (fun) {
                            fun.apply(doc, [input, args, name, command]);
                        } else {
                            gcd.emit("error:commmand defined but not:" + doc.file +
                                ":" + command);
                        }
                    };
                    han._label = "delayed command:" + command + ":" + name; 
                    gcd.once("command defined:" +  command, han);
                }
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
                doc.blocks[curname] = doc.blocks[curname] || '';
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
                doc.blocks[curname] = doc.blocks[curname] || '';
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
                doc.blocks[curname] = doc.blocks[curname] || '';
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
                
                var curname = doc.curname = doc.heading+colon.v+text;
                doc.blocks[curname] = doc.blocks[curname] || '';
                
                var title = data[1];
                var fname = evObj.pieces[0] + ":" + curname;
                var pipename;
                if (title) { // need piping
                    title = title.trim()+'"';
                    pipename = fname + colon.v + "sp";
                    doc.pipeParsing(title, 0, '"' , pipename);
                    
                    gcd.once("minor ready:" + fname, 
                        doc.maker['emit text ready'](doc, pipename + colon.v + "0" ));
                    gcd.once("text ready:" + pipename, 
                        doc.maker.store(doc, curname, fname));
                } else { //just go
                    gcd.once("minor ready:" + fname, 
                        doc.maker['store emit'](doc, curname, fname));
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
        var ind, pipes, middle, title, href; //for links
    
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
                    ltext = ltext.join('');
                    
                    if (title) {
                        title = title.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
                    }   
                    if ((!href) && (!title)) {
                        gcd.emit("switch found:"+file, [ltext, ""]);
                    } else if (title[0] === ":") {
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
                    } else if ( (ind = title.indexOf(":")) !== -1) {
                        gcd.emit("directive found:" + 
                           title.slice(0,ind).trim().toLowerCase() + ":" + file, 
                            { link : ltext,
                             input : title.slice(ind+1),
                             href: href, 
                             cur: doc.curname});
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
    
        var doc = new Doc(name, text, parent, actions);
        
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

var sync = Folder.prototype.wrapSync = function (fun, label) {
        var f = function (input, args, name, command) {
            var doc = this;
            var gcd = doc.gcd;
            
            try {
                var out = fun.call(doc, input, args);
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

var async = Folder.prototype.wrapAsync = function (fun, label) {
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
    
            fun.call(doc, input, args, callback);
        };
        if (label)  {
            f._label = label;
        } 
        
        return f;
    };

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
            subname = mainblock + subname;
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

Folder.commands = {   eval : sync(function ( input, args ) {
        var doc = this;
    
        input += "\n" + args.join("\n");
    
        try {
            return eval(input).toString();
        } catch (e) {
            doc.gcd.emit("error:command:eval:", [e, input]);
            return e.name + ":" + e.message +"\n" + input;
        }
    }, "eval"),
        sub : function (str, args, name) {
                var doc = this;
                var gcd = this.gcd;
            
                var index = 0, m = str.length, al = args.length,
                    i, j, old, newstr, indented;
            
                if ( (!args[0]) ) {
                    gcd.emit("error:sub has insufficient arguments:" + name);
                }
            
                if (al === 2) {
                    old = args[0];
                    newstr = args[1] || '';
                    while ( index < m ) { 
                            i = str.indexOf(old, index);
                        
                            if (i === -1) {
                                break;
                            } else {
                                indented = doc.indent(newstr, doc.getIndent(str, i));
                                str = str.slice(0,i) + indented + str.slice(i+old.length);
                                index = i + indented.length;
                            }
                    }
                } else {
            
                    for (j = al-1; j >= 0; j -= 1) {
                        index = 0;
                        old = args[0] + j;
                        newstr = args[j] || '';
                        while (index < m) {
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
        async : async(function (input, args, callback) {
                var doc = this;
            
                input += "\n" + args.join("\n");
            
                try {
                    eval(input);
                } catch (e) {
                    doc.gcd.emit("error:command:async:", [e, input]);
                    callback(null, e.name + ":" + e.message +"\n" + input);
                }
            }, "async"),
        compile : function (input, args, name) {
                var doc = this;
                var gcd = doc.gcd;
                var file = doc.file;
                var colon = doc.colon.v;
                var escape = doc.colon.escape;
                var i, n, start, nextname, oldname, firstname;
            
                var stripped = name.slice(name.indexOf(":")+1);
            
                var hanMaker = function (file, nextname, start) {
                        return function (text) {
                            doc.blockCompiling(text, file, nextname, start);
                        };
                    };
            
                if (args.length === 0) {
                    gcd.once("minor ready:" + name, function (text) {
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
            }, "cat")
    };
Folder.directives = {   save : function (args) {
        var doc = this;
        var colon = doc.colon;
        var gcd = doc.gcd;
        var savename = doc.colon.escape(args.link);
        var title = args.input;
    
        var options, start, blockhead, ind;
        if ( args.href[0] === "#") {
            start = args.href.slice(1).replace(/-/g, " ");
        } else {
            start = args.href;
        }
        start = start.trim().toLowerCase();
        
        ind = title.indexOf("|");
        if (ind === -1) {
            options = title.trim();
            title = "";
        } else {
            options = title.slice(0,ind).trim();
            title = title.slice(ind+1);
        }
        
        if (!start) {
            start = args.cur;
        }
        
        blockhead = doc.colon.restore(start);
        
        if ( (ind = blockhead.indexOf("::")) !== -1)  {
            if (  (ind = blockhead.indexOf(":", ind+2 )) !== -1 ) {
                blockhead = blockhead.slice(0, ind);
            }
        } else if ( (ind = blockhead.indexOf(":") ) !== -1) {
            blockhead = blockhead.slice(0, ind);
        }
        
        start = doc.colon.escape(start);
    
        var emitname = "for save:" + doc.file + ":" + savename;
    
        gcd.scope(savename, options);
        
    
        gcd.emit("waiting for:saving file:" + savename + ":from:" + doc.file, 
             ["file ready:" + savename, "save", savename, doc.file, start]);
    
         var f = function (data) {
             // doc.store(savename, data);
             gcd.emit("file ready:" + savename, data);
         };
         f._label = "save;;" + savename;
        
          if (title) {
              title = title + '"';
              gcd.once("text ready:" + emitname, f);
             
              doc.pipeParsing(title, 0, '"', emitname, blockhead);
         
          } else {
             gcd.once("text ready:" + emitname + colon.v + "0", f); 
          }
          
          doc.retrieve(start, "text ready:" + emitname + colon.v + "0");
    
    },
        newscope : function (args) {
                var doc = this;
                var scopename = args.link;
            
                doc.parent.createScope(scopename);
            
            },
        store : function (args) {
                var doc = this;
                var value = args.input;
                var name = doc.colon.escape(args.link);
            
                doc.store(name, value);
            
            },
        log : function (args) {
                
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
        out : function (args) {
                var doc = this;
                var colon = doc.colon;
                var gcd = doc.gcd;
                var outname = args.link;
                var title = args.input;
                
                var options, start, blockhead, ind;
                if ( args.href[0] === "#") {
                    start = args.href.slice(1).replace(/-/g, " ");
                } else {
                    start = args.href;
                }
                start = start.trim().toLowerCase();
                
                ind = title.indexOf("|");
                if (ind === -1) {
                    options = title.trim();
                    title = "";
                } else {
                    options = title.slice(0,ind).trim();
                    title = title.slice(ind+1);
                }
                
                if (!start) {
                    start = args.cur;
                }
                
                blockhead = doc.colon.restore(start);
                
                if ( (ind = blockhead.indexOf("::")) !== -1)  {
                    if (  (ind = blockhead.indexOf(":", ind+2 )) !== -1 ) {
                        blockhead = blockhead.slice(0, ind);
                    }
                } else if ( (ind = blockhead.indexOf(":") ) !== -1) {
                    blockhead = blockhead.slice(0, ind);
                }
                
                start = doc.colon.escape(start);
                
                var emitname = "for out:" + doc.file + ":" + 
                    doc.colon.escape(outname);
            
                gcd.scope(outname, options);
            
                gcd.emit("waiting for:dumping out:" + outname, 
                    [emitname, outname, doc.file, start]  );
            
                var f = function (data) {
                    gcd.emit(emitname, data);
                    doc.log(outname + ":\n" + data + "\n~~~\n");
                };
                f._label = "out;;" + outname;
                
                 if (title) {
                     title = title + '"';
                     gcd.once("text ready:" + emitname, f);
                    
                     doc.pipeParsing(title, 0, '"', emitname, blockhead);
                
                 } else {
                    gcd.once("text ready:" + emitname + colon.v + "0", f); 
                 }
                 
                 doc.retrieve(start, "text ready:" + emitname + colon.v + "0");
            
            },
        load: function (args) {
                var doc = this;
                var gcd = doc.gcd;
                var folder = doc.parent;
                var url = args.href.trim();
                var options = args.input;
                var urlesc = folder.colon.escape(url);
                var nickname = doc.colon.escape(args.link.trim());
                
                gcd.scope(urlesc, options);
            
                if (nickname) {
                    if (doc.scopes.hasOwnProperty(nickname) ) {
                        gcd.emit("error:scope name already exists:" + 
                            doc.colon.escape(nickname) );
                    } else {
                        doc.scopes[nickname] = urlesc;
                        if (!(folder.docs.hasOwnProperty(urlesc) ) ) {
                            gcd.emit("waiting for:loading for:" + doc.file, 
                                "need document:" + urlesc);
                            gcd.emit("need document:" + urlesc, url );
                        }
                    }
                } else {
                    if (!(folder.docs.hasOwnProperty(urlesc) ) ) {
                        gcd.emit("waiting for:loading for:" + doc.file, 
                            "need document:" + urlesc);
                        gcd.emit("need document:" + urlesc, url );
                    }
                }
            
            },
        linkscope : function (args) {
                var doc = this;
                var alias = args.link;
                var scopename = args.input;
            
                doc.createLinkedScope(alias, scopename); 
            
            },
        define : function (args) {
                var ind; 
                var doc = this;
                var colon = doc.colon;
                var gcd = doc.gcd;
                var cmdname = args.link;
                var title = args.input;
                var wrapper; 
              
                var start = args.href.slice(1).replace(/-/g, " ").
                    trim().toLowerCase();
                ind = title.indexOf("|");
                if (ind === -1) {
                    wrapper = title.trim();
                    title = '';
                } else {
                    wrapper = title.slice(0,ind).trim();
                    title = title.slice(ind+1);
                }
                
                if (!start) {
                    start = args.cur;
                }
                
                var blockhead = doc.colon.restore(start);
                
                if ( (ind = blockhead.indexOf("::")) !== -1)  {
                    if (  (ind = blockhead.indexOf(":", ind+2 )) !== -1 ) {
                        blockhead = blockhead.slice(0, ind);
                    }
                } else if ( (ind = blockhead.indexOf(":") ) !== -1) {
                    blockhead = blockhead.slice(0, ind);
                }
                
                start = doc.colon.escape(start);
            
                gcd.emit("waiting for:command definition:" + cmdname, 
                    ["command defined:"+cmdname, cmdname, doc.file, start]  );
            
               
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
            
                    switch (wrapper) {
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
               
                if (title) {
                    title = title + '"';
                    gcd.once("text ready:" + cmdname, han);
                    
                    doc.pipeParsing(title, 0, '"', cmdname, blockhead);
            
                } else {
                   gcd.once("text ready:" + cmdname + colon.v + "0", han); 
                }
                
                doc.retrieve(start, "text ready:" + cmdname + colon.v + "0");
            },
        "block on" : function () {
                var doc = this; 
            
                if (doc.blockOff > 0) {
                    doc.blockOff -= 1;
                }
            
            },
        "block off" : function () {
                var doc = this;
            
                doc.blockOff += 1;
            }, 
        "ignore" : function (args) {
                var lang = args.link;
            
                var doc = this;
                var gcd = doc.gcd;
            
                gcd.on("code block found:" + lang, "ignore code block");
            
            },
        eval : function (args) {
                var doc = this;
            
                var block = doc.blocks[args.cur];
            
                try {
                    eval(block);
                } catch (e) {
                    doc.gcd.emit("error:dir eval:", [e, block]);
                    doc.log(e.name + ":" + e.message +"\n" + block);
                    return;
                }
                
            }
    };

var Doc = function (file, text, parent, actions) {
        this.parent = parent;
        var gcd = this.gcd = parent.gcd;
    
        this.file = file; // globally unique name for this doc
    
        parent.docs[file] = this;
    
        this.text = text;
    
        this.blockOff = 0;
        
        this.levels = {};
        this.blocks = {};
        this.scopes = {};
        this.vars = parent.createScope(file);
    
        this.commands = parent.commands;
        this.directives = parent.directives;
        this.maker = Object.create(parent.maker);
        this.colon = Object.create(parent.colon); 
        this.join = parent.join;
        this.log = this.parent.log;
        this.scopes = this.parent.scopes;
        this.subnameTransform = this.parent.subnameTransform;
        this.reports = {};
        this.indicator = this.parent.indicator;
    
        if (actions) {
            apply(gcd, actions);
        }
    
        return this;
    
    };

Doc.prototype.retrieve = function (name, cb) {
    var doc = this;
    var gcd = doc.gcd;

    var scope = doc.getScope(name);

    var varname = scope[1];
    var file = scope[2];
    scope = scope[0];
    var f;
    if (scope) {
        if (typeof scope[varname] !== "undefined") {
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

Doc.prototype.getScope = function (name) {
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

Doc.prototype.createLinkedScope = function (name, alias) {
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
 
Doc.prototype.indent = function (text, indent) {
        var line, ret;
        var i, n;
        
        n = indent;
        line = '';
        for (i = 0; i <n; i += 1) {
            line += ' ';
        }
    
        ret = text.replace(/\n/g, "\n"+line);
        return ret;
    };

Doc.prototype.getIndent = function ( block, place ) {
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

Doc.prototype.blockCompiling = function (block, file, bname, mainblock) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        
        var  quote, place, qfrag, lname, slashcount, numstr, chr;
        var name = file + ":" + bname;
        var ind = 0;
        var loc = 0; // location in fragment array 
        var frags = [];
        var indents = [];
        var last = 0; 
        gcd.when("block substitute parsing done:"+name, "ready to stitch:"+name);
        while (true) {
            ind = block.indexOf("\u005F", ind);
            if (ind === -1) {
                frags[loc] = block.slice(last);
                loc += 1;
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
                if (chr === '\\' ) {
                    frags[loc] = block.slice(last, place) + "\u005F";
                    loc += 1;
                    last = ind;  
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
                            frags[loc] = block.slice(last, place) + "\\" +
                                 slashcount + "\u005F";
                            loc += 1;
                            last = ind; 
                            continue;
                
                        } else {
                            frags[loc] = block.slice(last, place);
                            loc += 1;
                            last = ind-1;
                        }
                    }
                } 
    
                place = ind-1;
                if (last !== place ) {
                    frags[loc] = block.slice(last, place);
                    loc += 1;
                    last = place;
                }
                lname = name + colon.v + loc;
                gcd.once("text ready:" + lname, 
                    doc.maker['location filled'](doc, lname, loc, frags, indents));
                gcd.when("location filled:" + lname, 
                    "ready to stitch:" + name
                );
                if (place > 0) {
                    indents[loc] = doc.getIndent(block, place);
                } else {
                   indents[loc] = 0;
                }
                loc += 1;
            
    
                last = doc.substituteParsing(block, ind+1, quote, lname,
                mainblock);
               
                doc.parent.recording[lname] = block.slice(ind-1, last);
    
                ind = last;
    
            }
        }
        if (bname.indexOf(colon.v) !== -1) {
            gcd.once("ready to stitch:" + name, 
                doc.maker['stitch emit'](doc, name, frags));
        } else {
            gcd.once("ready to stitch:"+name,
                doc.maker['stitch store emit'](doc, bname, name, frags));
        }
    
        gcd.emit("block substitute parsing done:"+name);
    };

Doc.prototype.substituteParsing = function (text, ind, quote, lname, mainblock ) { 
    
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
    
        var match, subname, chr, subtext;
        var subreg = doc.regexs.subname[quote];
    
        subreg.lastIndex = ind;
        
        match = subreg.exec(text);
        if (match) {
            ind = subreg.lastIndex;
            chr = match[2];
            subname = match[1].trim().toLowerCase();
            subname = doc.subnameTransform(subname, lname, mainblock);
            subname = colon.escape(subname);
            if (chr === "|") {
                ind = doc.pipeParsing(text, ind, quote, lname, mainblock);
            } else if (chr === quote) { 
                //index already points at after quote so do not increment
                gcd.once("text ready:" + lname + colon.v + "0",
                    doc.maker['emit text ready'](doc, lname));
                doc.parent.recording[ lname + colon.v + "0"] = match[1];
            } else {
                gcd.emit("failure in parsing:" + lname, ind);
                return ind;
            }
        } else {
            gcd.emit("failure in parsing:" + lname, ind);
            return ind;
        }
      
    
        if (subname === '') {
            gcd.emit("text ready:"  + lname + colon.v + "0", '');
        } else {
            subtext = doc.retrieve(subname, "text ready:"  + lname + colon.v + "0" );
        }
    
        return ind;
    
    };

Doc.prototype.pipeParsing = function (text, ind, quote, name, mainblock) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
       
    
        var chr, argument, argnum, match, command, 
            comname, nextname, aname, result, start, orig=ind ;
        var n = text.length;
        var comnum = 0;
        var comreg = doc.regexs.command[quote];
        var argreg = doc.regexs.argument[quote];
        var wsreg = /\s*/g;
    
        while (ind < n) { // command processing loop
    
            comreg.lastIndex = ind;
            
            match = comreg.exec(text);
            if (match) {
                command = match[1].trim().toLowerCase();
                chr = match[2];
                ind = comreg.lastIndex;
                if (command === '') {
                    command = "passthru";    
                }
                command = colon.escape(command);
                comname = name + colon.v + comnum;
                comnum += 1;
                nextname = name + colon.v + comnum;
                gcd.when(["command parsed:" + comname, 
                    "text ready:" + comname],
                    "arguments ready:"  + comname );
                if (chr === quote) {
                    gcd.once("text ready:" + nextname, 
                        doc.maker['emit text ready'](doc, name));
                    doc.parent.recording[nextname] = name;
                    doc.parent.recording[nextname] = text.slice(orig, ind);
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    break;
                } else if (chr === "|") {
                    doc.parent.recording[nextname] = text.slice(orig, ind);
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    continue;
                }
            } else {
                gcd.emit("failure in parsing:" + name, text.slice(orig, ind));
                return ind+1;
                
            }
    
            argnum = 0;
            while (ind < n) { // each argument loop
                aname = comname + colon.v + argnum;
                gcd.when("text ready:" +aname,
                    "arguments ready:"+comname );
                wsreg.lastIndex = ind;
                wsreg.exec(text);
                ind = wsreg.lastIndex;
            
                if ( (text[ind] === "\u005F") && 
                    (['"', "'", "`"].indexOf(text[ind+1]) !== -1) )  {
                        start = ind;
                        ind = doc.substituteParsing(text, ind+2, text[ind+1], aname, mainblock);
                        doc.parent.recording[aname] =  text.slice(start, ind);
                        wsreg.lastIndex = ind;
                        wsreg.exec(text);
                        ind = wsreg.lastIndex;
                        chr = text[ind];
                        ind += 1;
            
                } else if ( (text.slice(ind, ind+3) === "\\0\u005F")   && 
                    (['"', "'", "`"].indexOf(text[ind+3]) !== -1) )  {
                        ind += 2;
                            start = ind;
                            ind = doc.substituteParsing(text, ind+2, text[ind+1], aname, mainblock);
                            doc.parent.recording[aname] =  text.slice(start, ind);
                            wsreg.lastIndex = ind;
                            wsreg.exec(text);
                            ind = wsreg.lastIndex;
                            chr = text[ind];
                            ind += 1;
                } else {
                    // no substitute, just an argument. 
                    argument = '';
                    while (ind < n) {
                        argreg.lastIndex = ind;
                        match = argreg.exec(text);
                        if (match) {
                            ind = argreg.lastIndex;
                            argument += match[1];
                            chr = match[2];
                            if (chr === "\\") {
                               result = doc.backslash(text, ind, doc.indicator );
                               ind = result[1];
                               argument += result[0];
                               continue;
                            } else {
                                argument = argument.trim();
                                argument = doc.whitespaceEscape(argument, doc.indicator);
                                gcd.emit("text ready:" + aname, argument);
                                break;
                            }
                        } else {
                            gcd.emit("failure in parsing:" + name, text.slice(orig, ind));
                            return ind+1;
                            
                        }
                    }
                    doc.parent.recording[aname] = command + colon.v + argnum + colon.v + argument;
                }
                if (chr === ",") {
                    argnum += 1;
                    continue;
                } else if (chr === "|") {
                    doc.parent.recording[nextname] = text.slice(orig, ind);
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    break;
                } else if (chr === quote) {
                    gcd.once("text ready:" + nextname, 
                        doc.maker['emit text ready'](doc, name));
                    doc.parent.recording[nextname] = name;
                    doc.parent.recording[nextname] = text.slice(orig, ind);
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    return ind;
                } else {
                   gcd.emit("failure in parsing:" + name, text.slice(orig, ind));
                   return ind+1;
                    
                }
            }
    
            gcd.emit("command parsed:" + comname);
    
        }
        
    
        return ind;
    
    };

Doc.prototype.regexs = {
    
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

Doc.prototype.backslash = function (text, ind, indicator) {
        var chr, match, num, left;
        var uni = /[0-9A-F]+/g; 
        
    
        chr = text[ind];
        switch (chr) {
        case "|" : return ["|", ind+1];
        case '\u005F' : return ['\u005F', ind+1];
        case "\\" : return ["\\", ind+1];
        case "'" : return ["'", ind+1];
        case "`" : return ["`", ind+1];
        case '"' : return ['"', ind+1];
        case "n" : return [indicator + "n" + indicator, ind+1];
        case " " : return [indicator + " " + indicator, ind+1];
        //case "\n" : return [" ", ind+1];
        case "`" : return ["|", ind+1];
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

Doc.prototype.whitespaceEscape = function (text, indicator) {
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

Doc.prototype.wrapSync = Folder.prototype.wrapSync;

Doc.prototype.wrapAsync = Folder.prototype.wrapAsync;

Doc.prototype.store = function (name, text) {
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
 
module.exports = Folder;