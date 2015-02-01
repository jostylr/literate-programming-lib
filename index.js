/*global require, module */
/*jslint evil:true*/

var EvW = require('event-when');
var marked = require('marked');
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

var commands, directives;

var Folder = function (actions) {
    
        var gcd = this.gcd = new EvW();
        this.docs = {};
        this.scopes = {};
    
        
        this.maker = {   'emit text ready' : function (name, gcd) {
                        var f = function (text) {
                            gcd.emit( "text ready:" + name, text);
                        };
                        f._label = "emit text ready;;" + name;
                        return f;
                    },
                'store' : function (name, doc) {
                        var f = function (text) {
                            doc.store(name, text);
                        };
                        f._label = "store;;" + name;
                        return f;
                    },
                'store emit' : function (name, doc, fname) {
                        var f = function (text) {
                            doc.store(name, text);
                            doc.gcd.emit("text ready:" + (fname || name), text);
                        };
                        f._label = "store emit;;" +  name;
                        return f;
                    },
                'location filled' : function (lname, loc, doc, frags, indents ) {
                        var f = function (subtext) {
                            var gcd = doc.gcd;
                            doc.indent(subtext, indents[loc]);
                            frags[loc] = subtext;
                            gcd.emit("location filled:" +  lname );
                        };
                        f._label = "location filled;;" + lname;
                        return f;
                    },
                'stitch emit' : function (name, frags, gcd) {
                        var f = function () {
                            gcd.emit("minor ready:" + name, frags.join(""));
                        };
                        f._label = "stitch emit;;" + name;
                        return f;
                    },
               'stitch store emit' : function (bname, name, frags, doc) {
                        var f = function () {
                            var text = frags.join("");
                            doc.store(bname, text);
                            doc.gcd.emit("text ready:"+name, text);
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
                    gcd.once("command added:" + doc.file + ":" +  command, han);
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
                if (title) { // need piping
                    title = title.trim()+'"';
                    doc.pipeParsing(title, 0, '"' , fname);
                    
                    gcd.once("minor ready:" + fname, 
                        doc.maker['emit text ready']( fname + colon.v + "0", 
                            gcd));
                    gcd.once("text ready:" + fname, 
                        doc.maker.store(fname, doc));
                } else { //just go
                    gcd.once("minor ready:" + fname, 
                        doc.maker['store emit'](curname, doc, fname));
                }
            }
        );
        
        gcd.on("code block found", "add code block");
        
        gcd.action("add code block", function (data, evObj) {
                var gcd = evObj.emitter;
                var file = evObj.pieces[0];
                var doc = gcd.parent.docs[file];
                doc.blocks[doc.curname] +=  data;
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
    
        if (actions) {
            apply(gcd, actions);
        }
    
        return this;
    };

Folder.prototype.parse = function (doc) {
    
        var gcd = doc.gcd;
        var file = doc.file;
    
        gcd.when("marked done:"+file, "parsing done:"+file);
    
        gcd.on("parsing done:"+file, function () {
            doc.parsed = true;
        });
        
        var renderer = new marked.Renderer(); 
    
        renderer.heading = function (text, level) {
                gcd.emit("heading found:"+level+":"+file,text);
                return text;
            };
        renderer.code = function (code, lang) {
                if (lang) {
                    gcd.emit("code block found:"+lang+":"+file,code);
                } else {
                    gcd.emit("code block found:"+ file, code);
                }
                return code;
            };
        renderer.link = function (href, title, text) {
                var ind;
                var pipes, middle;
                if ((!href) && (!title)) {
                    gcd.emit("switch found:"+file, [text, ""]);
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
                        text += "." + middle.toLowerCase();    
                    }
                    gcd.emit("switch found:" + file, [text,pipes]);
                } else if ( (ind = title.indexOf(":")) !== -1) {
                    gcd.emit("directive found:" + 
                       title.slice(0,ind).trim().toLowerCase() + ":" + file, 
                        { link : text,
                         remainder : title.slice(ind+1),
                         href:href});
                }
                return text;
            };   
        
        marked(doc.text, {renderer:renderer});
    
        gcd.emit("marked done:" + file);
    
    };

Folder.prototype.newdoc = function (name, text, actions) {
        var parent = this;
    
        var doc = new Doc(name, text, parent, actions);
        
        try {
            parent.parse(doc);
        } catch (e) {
            console.log(doc);       
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
        }
        return scopes[name];
    };

var sync = Folder.prototype.wrapSync = function (fun, label) {
        var f = function (input, args, name, command) {
            var doc = this;
            var gcd = doc.gcd;
            
            try {
                var out = fun.call(doc, input, args);
                gcd.emit("text ready:" + name, out); 
            } catch (e) {
                console.log(e);
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
                    console.log(err);
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

Folder.prototype.commands = {   eval : sync(function ( input, args, name ) {
        var doc = this;
        return eval(input).toString();
    }, "eval"),
        sub : function (str, args, name) {
                var gcd = this.gcd;
            
                var index = 0, m = str.length, al = args.length,
                    i, j, old, newstr;
            
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
                                str = str.slice(0,i) + newstr + str.slice(i+old.length);
                                index = i+newstr.length;
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
                                    str = str.slice(0,i) + newstr + str.slice(i+old.length);
                                    index = i+newstr.length;
                                }
                        }
                    }
                }
                
            
                gcd.emit("text ready:" + name, str);
            },
        store: sync(function (input, args) {
                var doc = this;
                var gcd = doc.gcd;
            
                var vname = doc.colon.escape(args[0])
            
                if (vname) {
                    doc.store(vname, input);
                    gcd.emit("text ready:" + doc.file + ":" + vname);
                }
                return input; 
            
            }, "store"),
    };
Folder.prototype.directives = {   save : function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var file = doc.file;
        var savename = args.link;
        var title = args.remainder;
        var start = doc.colon.escape(
            args.href.slice(1).replace(/-/g, " ").trim().toLowerCase() );
        var f = function (data) {
            doc.store(savename, data);
            gcd.emit("file ready:" + savename, data);
        };
        f._label = "save;;";
        gcd.once("text ready:" + file + ":" + start, f);
    
    },
        newscope : function (args) {
                var doc = this;
                var gcd = doc.gcd;
                var file = doc.file;
                var local = args.remainder;
                var global = args.link;
            
                doc.createLinkedScope(global, local);
            
            },
        store : function (args) {
                var doc = this;
                var gcd = doc.gcd;
                var file = doc.file;
                var value = args.remainder;
                var name = doc.colon.escape(args.link);
            
                doc.store(name, value);
            
            }
    };

var Doc = function (file, text, parent, actions) {
        this.parent = parent;
        var gcd = this.gcd = parent.gcd;
    
        this.file = file; // globally unique name for this doc
    
        parent.docs[file] = this;
    
        this.text = text;
        
        this.levels = {};
        this.blocks = {};
        this.scopes = {};
        this.vars = parent.createScope(file);
    
        this.commands = Object.create(parent.commands);
        this.directives = Object.create(parent.directives);
        this.maker = Object.create(parent.maker);
        this.colon = Object.create(parent.colon); 
    
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
            f = function () {
                doc.retrieve(name, cb);
            };
            f._label = "Retrieving:" + file + ":" + varname;
            gcd.once("text stored:" + file + ":" + varname, f); 
            return ;
        }
    } else {
        f = function () {
            doc.retrieve(name, cb);
        };
        f._label = "Retrieving:" + doc.file + ":" + name;
        gcd.once("scope linked:" + doc.file + ":" + file, f); 
        return ;
    }
};

Doc.prototype.getScope = function (name) {
        var ind, scope, localname, filename, varname;
        var doc = this;
        var colon = doc.colon;
        var folder = doc.parent;
    
        if (  (ind = name.indexOf( colon.v + colon.v) ) !== -1 ) {
            localname = name.slice(0,ind);
            varname = name.slice(ind+2);
            filename = doc.scopes[ localname ];
            if (filename) {
                scope = folder.scopes[filename];
                if (scope) {
                    return [scope, varname, filename]; 
                } else {
                    doc.gcd.emit("error:non-existent scope linked:" + doc.file +
                        ":" + localname, filename);
                }
            } else {
                return [null, varname, localname];
            }
        } else {
            return [doc.vars, name, doc.file];
        }
    };

Doc.prototype.createLinkedScope = function (globalname, localname) {
        var doc = this;
        var gcd = doc.gcd;
        var folder = doc.parent;
    
        var scope = folder.createScope(globalname);
        doc.scopes[localname] = globalname;
        gcd.emit("scope linked:" + doc.file + ":" + localname, globalname);
    
        return scope;
    
    };
 
Doc.prototype.indent = function (text, indents) {
        var beg, line;
        var i, n;
        
        n = indents[0];
        beg = '';
        for (i = 0; i < n; i += 1) {
            beg += ' ';
        }
        
        n = indents[1];
        line = '';
        for (i = 0; i <n; i += 1) {
            line += ' ';
        }
    
        return beg + text.replace("\n", "\n"+line);
    };

Doc.prototype.blockCompiling = function (block, file, bname) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        
        var found, quote, place, qfrag, lname, 
            backcount, indent, first, chr, slashcount;
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
                found = ind;
                ind += 1;
    
                if (block[ind].match(/['"`]/)) {
                    quote = block[ind];
                } else {
                    continue;
                }
                
                place = ind-2;
                 slashcount = 0;
                 while (block[place] === '\\') {
                    slashcount += 1;
                    place -= 1;
                 }
                 if (slashcount) {
                    qfrag = ''; 
                    while (slashcount > 1) {
                        qfrag += "\\";
                        slashcount -= 2;
                    }
                    
                    frags[loc] = block.slice(last,place+1)+qfrag + 
                       ( ( slashcount === 1) ? "\u005F" : "" ) ;
                    loc += 1;
                    if (slashcount === 1) {
                        last = ind; // will start next frag after escaped underscore.
                        continue;
                    } else {
                        last = ind-1; // probably overwritten before used
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
                    doc.maker['location filled'](lname, loc, doc, frags, indents));
                gcd.when("location filled:" + lname, 
                    "ready to stitch:" + name
                );
                if (place > 0) {
                    first = place;
                    backcount = place-1;
                    indent = [0,0];
                    while (true) {
                        if ( (backcount < 0) || ( (chr = block[backcount]) === "\n" ) ) {
                            indent = first - ( backcount + 1 ); 
                            if (first === place) { // indent both
                                indent = [indent, indent];
                            } else {
                                indent = [0, indent];
                            }
                            break;
                        }
                        if (chr.search(/[S]/) === 0) {
                            first = backcount;
                        }
                        backcount -= 1;
                    }
                    indents[loc] = indent;
                } else {
                   indents[loc] = [0,0];
                }
                loc += 1;
            
    
                last = ind = doc.substituteParsing(block, ind+1, quote, lname);
                
            }
        }
        if (bname.indexOf(colon.v) !== -1) {
            gcd.once("ready to stitch:" + name, 
                doc.maker['stitch emit'](name, frags, gcd));
        } else {
            gcd.once("ready to stitch:"+name,
                doc.maker['stitch store emit'](bname, name, frags, doc));
        }
    
        gcd.emit("block substitute parsing done:"+name);
    };

Doc.prototype.substituteParsing = function (text, ind, quote, lname ) { 
    
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
        var file = doc.file;
    
        var match, colind, mainblock, subname, chr, subtext;
        var subreg = doc.regexs.subname[quote];
    
        subreg.lastIndex = ind;
        
        match = subreg.exec(text);
        if (match) {
            ind = subreg.lastIndex;
            chr = match[2];
            subname = match[1].trim().toLowerCase();
            if (subname[0] === ":") {
                colind = lname.indexOf(":");
                mainblock = lname.slice(colind, lname.indexOf(colon.v, colind));
                subname = mainblock+subname;
            }
            subname = colon.escape(subname);
            if (chr === "|") {
                ind = doc.pipeParsing(text, ind, quote, lname);
            } else if (chr === quote) { 
                //index already points at after quote so do not increment
                gcd.once("text ready:" + lname + colon.v + "0",
                    doc.maker['emit text ready'](lname, gcd));
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

Doc.prototype.pipeParsing = function (text, ind, quote, name) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
       
    
        var chr, argument, argnum, match, command, 
            comname, nextname, aname, result ;
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
                        doc.maker['emit text ready'](name, gcd));
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    break;
                } else if (chr === "|") {
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    continue;
                }
            } else {
                gcd.emit("failure in parsing:" + name, ind);
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
                if (text[ind] === "\u005F") {
                    if (['"', "'", "`"].indexOf(text[ind+1]) !== -1) {
                    
                        ind = doc.substituteParsing(text, ind+2, text[ind+1], aname);
                        continue;
                    }
                }
                // no substitute, just an argument. 
                argument = '';
                argreg.lastIndex = ind;
                while (ind < n) {
                    match = argreg.exec(text);
                    if (match) {
                        ind = argreg.lastIndex;
                        argument += match[1];
                        chr = match[2];
                        if (chr === "\\") {
                           result = doc.backslash(text, ind+1);
                           ind = result[1];
                           argument += result[0];
                           continue;
                        } else {
                            gcd.emit("text ready:" + aname, argument);
                            break;
                        }
                    } else {
                        gcd.emit("failure in parsing:" + name, ind);
                        return ind+1;
                        
                    }
                }
                if (chr === ",") {
                    argnum += 1;
                    continue;
                } else if (chr === "|") {
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    break;
                } else if (chr === quote) {
                    gcd.once("text ready:" + nextname, 
                        doc.maker['emit text ready'](name, gcd));
                    gcd.emit("command parsed:" + comname, [doc.file, command, nextname]);
                    return ind;
                } else {
                   gcd.emit("failure in parsing:" + name, ind);
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

Doc.prototype.backslash = function (text, ind) {
        var chr, match, num;
        var uni = /[0-9A-F]+/g; 
    
        chr = text[ind];
        switch (chr) {
        case "|" : return ["|", ind+1];
        case '\u005F' : return ['\u005F', ind+1];
        case "\\" : return ["\\", ind+1];
        case "'" : return ["'", ind+1];
        case "`" : return ["`", ind+1];
        case '"' : return ['"', ind+1];
        case "n" : return ["\n", ind+1];
        case "\n" : return [" ", ind+1];
        case "`" : return ["|", ind+1];
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

Doc.prototype.wrapSync = Folder.prototype.wrapSync;

Doc.prototype.wrapAsync = Folder.prototype.wrapAsync;

Doc.prototype.store = function (name, text) {
        var doc = this;
        var gcd = doc.gcd;
        var scope = doc.getScope(name);
       
        var f;
        if (! scope[0]) {
            f = function () {
                doc.store(name, text);
            };
            f._label = "Storing:" + doc.file + ":" + name;
            gcd.once("scope linked:" + doc.file + ":" + scope[2], f);
            return;
        }
    
        name = scope[1];
        var file = scope[2];
        scope = scope[0];
    
        var old; 
        if (scope.hasOwnProperty(name) ) {
            old = scope[name];
            scope[name] = text;
            gcd.emit("overwriting existing var:" + file + ":" + name, 
            {oldtext:old, newtext: text} );
        } else {
            scope[name] = text;
        }
        
        gcd.emit("text stored:" + file + ":" + name, text);
    };
 
module.exports = Folder;