/*global require, module, console */
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
    this.subCommands = Object.create(Folder.subCommands);
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
            var text = doc.convertHeading(data);
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
            var text = doc.convertHeading(data);
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
            var text = doc.convertHeading(data);
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
            var text = doc.convertHeading(data[0]);
            
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
            gcd=gcd; //js hint quieting
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
    
    gcd.on("push ready", "finish push");
    
    gcd.action("finish push", function (data, evObj) {
            var gcd = evObj.emitter;
            
            var name = evObj.pieces[0];
            var file = evObj.pieces[1]; 
            var doc = gcd.parent.docs[file];
            
            if (! Array.isArray(data) ) {
                data = [data];
            }
            doc.augment(data, "arr");
            
            
            if (doc) {
                doc.store(name, data);
            } else {
                gcd.emit("error:impossible:action push", 
                    [data, evObj.pieces]);
            }
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

    var text = doc.text;
    var bits = text.split("\n<!--+");
    if (bits.length > 1) {
        text = bits[0] + "\n" + bits.slice(1).map(function (el) {
            var ind = el.indexOf("-->"); 
            if (ind !== -1) {
                return el.slice(0, ind).trim() + el.slice(ind+3);
            } else {
                return el;
            }
        }).join("\n");
    } 

    var reader = new commonmark.Parser();
    var parsed = reader.parse(text); 

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
                    if  ((ltext.indexOf("|") !== -1) || ( ltext.length === 0) ) {
                        gcd.emit("directive found:transform:" + file, 
                            {   link : ltext,
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
                    directive =  doc.convertHeading(title.slice(0,ind));
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
         return (typeof text === "string") ? 
            text.replace(/:/g,  "\u2AF6") : text;
    },
    restore : function (text) {
        return (typeof text === "string") ? 
            text.replace( /[\u2AF6]/g, ":") : text;
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

Folder.prototype.augment = function self (obj, type) {

    var selfaug = obj._augments;
    if (!selfaug) {
        selfaug = obj._augments = [];
        selfaug.self = self;
    }

    selfaug.keys = function () {
        var keys = Object.keys(obj);
        var augkeys = obj._augments.map( function (el) {
            return el[0];
        });
        augkeys.push("_augments");
        return keys.filter(function (el) {
            return  (augkeys.indexOf(el) === -1);
        });
    };
    
    var props; 

    if ( typeof type === "string" ) {

        var augs = this.plugins.augment;
        props = augs[type];

        Object.keys(props).forEach( function (el) {
            obj[el] = props[el];
            selfaug.push([el, props[el]]);
        });

    } else {
        props = this;  
        props.forEach(function (el) {
            var key = el[0], val = el[1];
            obj[key]  = val;
            selfaug.push([key, val]);
        });
    }

    return obj;
}; 
Folder.prototype.cmdworker = function (cmd, input, args, ename) {
    var doc = this;
    var gcd = doc.gcd;
    var f;

    if ( (cmd[0] === ".") && (cmd.length > 1) )  {
        cmd = cmd.slice(1);
        args.unshift(cmd);
        doc.commands["."].call(doc, input, args, ename, ".");
    } else if ( typeof (f = doc.commands[cmd] ) === "function" ) {
        doc.commands[cmd].call(doc, input, args, ename, cmd );
    } else {
        gcd.once("command defined:" + cmd, function () {
            doc.commands[cmd].call(doc, input, args, ename, cmd );
        });
    }
}; 
Folder.prototype.compose = function () {
    var arrs = arguments;

    return function (input, cmdargs, name, cmdname ) {
        var doc = this;
        var colon = doc.colon;
        var gcd = doc.gcd;
        var done = "text ready:" + name; 
        cmdargs = doc.argsPrep(cmdargs, name, doc.subCommands, cmdname);
        
        var exec = function (data, evObj) {
            var bit = evObj.pieces[0];
            var pos = parseInt(bit.slice(bit.lastIndexOf(colon.v) + 1), 10)+1;
            var cmd = arrs[pos][0];
            var args = arrs[pos].slice(1);
        
            var m, a;
            if (cmd === '') {
                gcd.emit("text ready:" + name + c + pos, data);
                return;
            
            // store into ith arg    
            } else if ( (m = cmd.match(/^\-\>\$(\d+)$/) ) ) {
                cmdargs[parseInt(m[1], 10)] = data; 
                gcd.emit("text ready:" + name + c + pos, data);
                return;
            
            // retrieve from ith arg
            } else if ( (m = cmd.match(/^\$(\d+)\-\>$/) ) ) {
                gcd.emit("text ready:" + name + c + pos, 
                    cmdargs[parseInt(m[1], 10)]);
                return;
            
            } else if ( (m = cmd.match(/^\-\>\@(\d+)$/) ) ) {
                a = cmdargs[parseInt(m[1], 10)];
                if (Array.isArray(a)) {
                    a.push(data);
                } else {
                    cmdargs[parseInt(m[1], 10)] = 
                        doc.augment([data], "arr");
                }
                gcd.emit("text ready:" + name + c + pos, data);
                return;
            }
        
            var arrtracker = {}; 
            var ds = /^([$]+)(\d+)$/;
            var at = /^([@]+)(\d+)$/;
            var nl = /\\n/g; // new line replacement
            var n = args.length;
            var subnum;
            var i, el; 
            
            var noloopfun = function (args) {
                return function (el) {
                    args.push(el);
                };
            };
            
            
            for (i = 0; i < n; i +=1 ) {
                el = args[i] =  args[i].replace(nl, '\n'); 
                var match = el.match(ds);
                var num;
                if (match) {
                    if (match[1].length > 1) { //escaped
                        args[i] = el.slice(1);
                        continue;
                    } else {
                        num = parseInt(match[2], 10);
                        args[i] = cmdargs[num];
                        continue;
                    }
                }
                match = el.match(at);
                if (match) {
                    if (match[1].length > 1) { //escaped
                        args[i] = el.slice(1); 
                        continue;
                    } else {
                        num = parseInt(match[2], 10);
                        if (arrtracker.hasOwnProperty(num)) {
                            subnum = arrtracker[num] += 1;
                        } else {
                            subnum = arrtracker[num] = 0;
                        }
                        if (i === (n-1)) {
                            args.pop(); // get rid of last one
                            cmdargs[num].slice(subnum).forEach(
                                noloopfun(args));
                        } else {
                            args[i] = cmdargs[num][subnum];
                        }
                    }
                }
            }
        
        
            doc.cmdworker(cmd, data, args, name + c + pos);
        
        };

        var c = colon.v + cmdname + colon.v ;

        var i, n = arrs.length;
        for (i = 0; i < n-1 ;i += 1) {
            gcd.once("text ready:" + name + c + i, exec); 
        }
        // when all done, the last one is sent as the final bit
        gcd.once("text ready:" + name + c + (n-1), function (text) {
           gcd.emit(done, text); 
        }); 

        //start it
        exec(input, {pieces: [name+c+"-1"]});
    };

};
Folder.prototype.convertHeading = function (str) {
    var reg = /\s+/g;
    str = str.trim().toLowerCase();
    str = str.replace(reg, " ");
    return str;
};

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
            args = doc.argsPrep(args, name, doc.subCommands, command);
            var out = fun.call(doc, input, args, name);
            gcd.scope(name, null); // wipes out scope for args
            gcd.emit("text ready:" + name, out); 
        } catch (e) {
            doc.log(e);
            gcd.emit("error:command execution:" + name, 
                [e, e.stack, input, args, command]); 
        }
    };

    if (label) {
        f._label = label;
    }

    return f;
};
Folder.sync = function (name, fun) {
    return (Folder.commands[name] = sync(name, fun));
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
                gcd.scope(name, null); // wipes out scope for args
                gcd.emit("text ready:" + name, data);
            }
        };
        callback.name = name; 
        args = doc.argsPrep(args, name, doc.subCommands, command);
        fun.call(doc, input, args, callback, name);
    };
    if (label)  {
        f._label = label;
    } 
    
    return f;
};
Folder.async = function (name, fun) {
    return (Folder.commands[name] = async(name, fun));
};

var defaults = Folder.prototype.wrapDefaults = function (label, fun) {
        var temp;
        if (typeof fun === "string") {
            temp = fun;
            fun = label;
            label = fun;
        }
    var i, n, bad;

    var arr = fun.slice();
    var tag = arr.shift() || '';
    fun = arr.pop();

    if (typeof tag === "string") {
        tag = (function (tag) {
            return function (args) {
                var doc = this;
                var col = doc.colon.v;
                return tag + args.join(col) + col + doc.file +  
                    col + doc.uniq();
            };
        })(tag);
    }

    n = arr.length;
    bad = true;
    for (i = 0; i < n; i += 1) {
        if (arr[i] && typeof arr[i] === "string") {
            bad = false;
        } else {
            arr[i] = '';
        }
    } 
    
    var f = function (input, args, name, command) {
        
        var doc = this;
        var gcd = doc.gcd;
        var v = doc.colon.v;
        
        args = doc.argsPrep(args, name, doc.subCommands, command);

        var cbname = tag.call(doc, args);    

        gcd.when(cbname + v + "setup", cbname); 

        arr.forEach(function (el, i) {
            if ( ( el ) && ( ( typeof args[i] === "undefined" ) || ( args[i] === '' ) ) ) {
                gcd.when(cbname + v + i, cbname);
                doc.retrieve(el, cbname + v + i); 
            } 
        });
        
        gcd.on(cbname, function(data) {
            data.shift(); // get rid of setup
            data.forEach(function (el) {
                var ev = el[0];
                var i = parseInt(ev.slice(ev.lastIndexOf(v)+1));
                args[i] = el[1];
            });
            try {
                var out = fun.call(doc, input, args, name);
                gcd.scope(name, null); // wipes out scope for args
                gcd.emit("text ready:" + name, out); 
            } catch (e) {
                doc.log(e);
                gcd.emit("error:command execution:" + name, 
                    [e, e.stack, input, args, command]); 
            }
        });
        
        gcd.emit(cbname + v + "setup");
        
    };

    if (label)  {
        f._label = label;
    } 
    
    return f;

};
Folder.defaults = function (name, fun) {
    return (Folder.commands[name] = defaults(name, fun) );
};

Folder.prototype.uniq = function () {
    var counter = 0;
    return function () {
        return counter += 1;
    };
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
            ( state.start ||  state.block || '') );
        
        var pipeEmitStart = "text ready:" + state.emitname + colon.v + "sp";
        if (! state.value) {
            doc.retrieve(state.start, pipeEmitStart);
        } else {
            gcd.once("parsing done:"+this.file, function () {
                gcd.emit(pipeEmitStart, state.value || "" );
            });
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
Folder.plugins.augment = {
    arr : {
        trim : function () {
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
        },
        splitsep : function (sep) {
            var old = this;
            sep = sep || '\n---\n';
            var ret = old.map(function (el) {
                return el.split(sep);
            });
            return old._augments.self(ret);
        },
        ".mapc" : function(arr, args, name) {
            var doc = this;
            var gcd = doc.gcd;
            var c = doc.colon.v;
        
            var cmd = args[0];
            var ename = name + c + ".mapc" + c + cmd; 
            args = args.slice(1);
        
            gcd.flatWhen("mapping setup:" + ename, "need augmenting:" + ename).silence();
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
        
        },
        pluck : function (key) {
            var arr = this;
            var ret = arr.map(function (el) {
                return el[key]; 
            });
            ret = arr._augments.self(ret);
            return ret;
        },
        put : function (key, full) {
            var vals = this;
            full.forEach(function (el, ind) {
                el[key] = vals[ind];
            });
            return full;
        },
        get : function (key) {
            key = parseInt(key, 10);
            if (key < 0) {
                key = this.length + key;
            }
            return this[key];
        },
        set : function (key, val) {
            key = parseInt(key, 10);
            if (key < 0) {
                key = this.length + key;
            }
            this[key] = val;
            return this;
        }
    },
    minidoc : { 
        ".store" : function (input, args, name ) {
            var doc = this;
            var gcd = doc.gcd;
            var prefix = args[0] || '';
            try {
                input._augments.keys().forEach(function (el) {
                    doc.store(doc.colon.escape(prefix + el), input[el]); 
                });
        
            } catch(e) {
                this.gcd.emit("error:minidoc:store" + name, [e, input, args]);
            }
            gcd.emit("text ready:" + name, input); 
        },
        ".apply" : function (input, args, name) {
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
        },
        ".mapc" : function(obj, args, name) {
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
            obj._augments.keys().forEach(function (key) {
                var mname = ename + c + key; 
                gcd.when("text ready:" + mname, "keying:" + ename );
                doc.cmdworker(cmd, obj[key], args, mname);
            });
        
            gcd.emit("mapc setup:"+ename);
        
        },
        clone : function () {
            var input = this;
            var clone = {};
            input._augments.keys().forEach(function (el) {
                clone[el] = input[el]; 
            });
            clone = input._augments.self(clone); 
            return clone;
        },
        ".compile" : function (input, args, name) {
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
            gcd.once(".compile ready:" + name, function (data) { 
                doc.cmdworker("compile", data[0], [name], name);
                gcd.once("text ready:" + name, function () {
                    doc.cmdworker(".clear", input, [name], name + 
                        colon.v + ".clear");
                });
            });
            
            doc.retrieve(section, "text ready:" + template);
            doc.cmdworker(".store", input, [name], store ); 
        },
        ".clear" :  function (input, args, name ) {
            var doc = this;
            var gcd = doc.gcd;
            var prefix = args[0] || '';
            try {
                input._augments.keys().forEach(function (el) {
                    doc.store(doc.colon.escape(prefix + el), null); 
                });
            } catch(e) {
                this.gcd.emit("error:minidoc:clear:" + name, [e, input, args]);
            }
            gcd.emit("text ready:" + name, input); 
        },
        set : function (key, val) {
            this[key] = val;
            return this;
        },
        get : function (key) {
            return this[key];
        }
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

Folder.prototype.simpleReport = function () {
    var folder = this;
    var recording = folder.recording;
    var gcd = this.gcd;
    var key, lname, ret = [], el, pieces;
    var v = this.colon.v;
    for (key in gcd.whens) {
        if (key.slice(0,15) === "stitch fragment") { 
            lname = key.slice(16);
            ret.push("PROBLEM WITH: " + recording[lname] + 
                " IN: " + lname.slice(lname.indexOf(":")+1, 
                   lname.indexOf(v) ) +  
                " FILE: " + lname.slice(0, lname.indexOf(":"))); 
        } 
    }
    for (key in gcd._onces) {
        el = gcd._onces[key];
        if ( el[0].slice(0, 15) === "command defined") {
            pieces = key.split(":");
            if (pieces.length < 3) {
                gcd.error("error:simple report:"+ el[1]);
                return ret;
            }
            ret.push("COMMAND REQUESTED: " + 
                pieces[1] +  
                " BUT NOT DEFINED. REQUIRED IN: " + 
                pieces[3].slice(0, pieces[3].indexOf(v)) +  
                " FILE: " + pieces[2] ); 
        }
    }
    return ret;
};

Folder.commands = {   eval : sync(function ( text, args ) {
    var doc = this;

    var code = args.shift();

    try {
        eval(code);
        return text.toString();
    } catch (e) {
        doc.gcd.emit("error:command:eval:", [e, e.stack, code, text]);
        return e.name + ":" + e.message +"\n" + code + "\n\nACTING ON:\n" +
            text;
    }
}, "eval"),
    passthru : sync(function (text) {return text;}, "passthru"),
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
    
        var code =  args.shift();
    
        try {
            eval(code);
        } catch (e) {
            doc.gcd.emit("error:command:async:", [e, e.stack, code, text]);
            callback( null, e.name + ":" + e.message +"\n"  + code + 
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
    join : sync(function (input, args) {
        var sep = args.shift() || '';
        if (input) {
            args.unshift(input);
        }
        return args.join(sep);
    }, "join"),
    cat : sync(function (input, args) {
        var sep = '';
        if (input) {
            args.unshift(input);
        }
        return args.join(sep);
    }, "cat"),
    echo : sync(function (input, args) {
        return args[0];
    }, "echo"),
    get : function (input, args, name) {
        var doc = this;
        var colon = doc.colon;
    
        var section = colon.escape(args.shift());
        doc.retrieve(section, "text ready:" + name);
    },
    array : sync(function (input, args) {
        var doc = this;
        var ret = args.slice();
        ret.unshift(input);
        ret = doc.augment(ret, "arr");
        return ret;
    }, "array"),
    minidoc : sync(function (input, args, name) {
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
        doc.augment(ret, "minidoc");
        return ret;
    
    }, "miniDoc"),
    augment : function (input, args, name, cmdname) {
        var doc = this;
        var gcd = doc.gcd;
        var c = doc.colon.v;
        var augs = doc.plugins.augment;
        args = doc.argsPrep(args, name, doc.subCommands, cmdname);
    
        gcd.flatWhen("augment setup:" + name, "text ready:" + name);
            
        args.forEach(function (el, ind) {
            if (augs.hasOwnProperty(el) ) {
               input = doc.augment(input, el);
            } else {
                gcd.when("augment defined:" + el, "define extension:" + name);
                gcd.when("augment:" + name + c + ind , "text ready:" +
                    name).silence();
                gcd.once("define extension:" + name, function () {
                    input = doc.augment(input, el); 
                    gcd.emit("augment:" + name + c + ind);
                });
            }
        });
        
        gcd.emit("augment setup:" + name, input);
    
    
    }, 
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
    "." : function (input, args, name, cmdname) {
        var doc = this;
        var gcd = doc.gcd;
        var propname = args.shift();
        args = doc.argsPrep(args, name, doc.subCommands, cmdname);
        var async = false;
        var prop;
        if ( (prop = input["." + propname] ) ) {
            async = true;
        } else {
            prop = input[propname];
        }
        var ret;
        if (typeof prop === "function") {
            if (async) {
                prop.call(doc, input, args, name, cmdname);
                return;
            } else {
                ret = prop.apply(input, args);
                if (typeof ret === "undefined") {
                    doc.log("method returned undefined " + propname, input, propname, args);
                    ret = input;
                } 
            }
        } else if (typeof prop === "undefined") {
            doc.log("property undefined " + propname, input, propname, args); 
            ret = input; 
        } else {
            ret = prop;
        }
        gcd.emit("text ready:" + name, ret);
    },
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
        var linkname = state.linkname;
    
        var f = function (data) {
             doc.store(state.varname, data);
        };
        f._label = "storeDir;;" + linkname;
    
        state.handler = f;
    
    }, function (state) {
    
        var ln = state.linkname;
        var ind = ln.indexOf("|");
        if (ind !== -1) {
            state.varname = ln.slice(0, ind).trim();
            state.block = state.start;
            state.start = '';
            state.value = ln.slice(ind+1).trim();
        } else {
            state.varname = state.linkname;
        }
    
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
        var doc = this;
        var gcd = doc.gcd;
    
    
        var f = function (data) {
            gcd.emit(state.emitname, data);
            var name = doc.getPostPipeName(state.linkname);
            if (name) {
                doc.store(name, data);
            }
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
    "define" : dirFactory(function (state) {
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
                case "defaults" : doc.commands[cmdname] = 
                    doc.wrapDefaults(f, cmdname);
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
    "subcommand" : function (args) {
        var doc = this;
    
        var block = doc.blocks[args.cur];
        
        var subCommandName = args.link;
    
        var cmdName = args.href.trim().slice(1);
       
        var f; 
        
        try {
            block = "f="+block;
            eval( block);
        } catch (e) {
            doc.gcd.emit("error:subcommand define:"+subCommandName, [e, block]);
            doc.log(e.name + ":" + e.message +"\n" + block);
            return;
        } 
    
        doc.defSubCommand( subCommandName, f, cmdName); 
         
    },
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
        
        var storageName = doc.getPostPipeName(args.link);
        var ret = '';
        
        try {
            eval(block);
            if (storageName) {
                doc.store(storageName, ret);
            }
        } catch (e) {
            doc.gcd.emit("error:dir eval:", [e, block]);
            doc.log(e.name + ":" + e.message +"\n" + block);
            return;
        }
        
    },
    "if" : function (args) {
        
        var doc = this;
        var folder = doc.parent;
        
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
    "push" : dirFactory(function (state) {
        var doc = this;
        
        var ln = state.linkname;
        var ind = ln.indexOf("|");
        if (ind !== -1) {
            state.varname = ln.slice(0, ind).trim();
            state.block = state.start;
            state.start = '';
            state.value = ln.slice(ind+1).trim();
        } else {
            state.varname = state.linkname;
        }
        
        state.name = doc.colon.escape(state.linkname + ":"  + 
            state.start + ":" + state.input);
        state.emitname =  "for push:" + doc.file + ":" + state.name;
        state.donename =  "push bit:" + doc.file + ":" + state.name;
        state.goname =  "push ready:" + doc.file + ":" + state.varname;
    }, function (state) {
        var doc = this;
        var gcd = doc.gcd;
    
    
        var f = function (data) {
            gcd.emit(state.donename, data);
        };
        f._label =  "push;;" + state.name;
        
        state.handler = f;
    }, function (state) {
        var doc = this;
        var gcd = this.gcd;
        var name = state.name;
        var start = state.start;
        var emitname = state.emitname;
    
        gcd.emit("waiting for:push bit:" + name, 
            [emitname, name, doc.file, start]  );
        gcd.flatWhen(state.donename, state.goname ); 
    }),
    "h5" : function (args) {
        var doc = this;
        var gcd = doc.gcd;
        var colon = doc.colon;
    
        var heading = args.href.slice(1); 
        heading = doc.convertHeading(heading.replace(/-/g, ' '));
    
        if (! heading ) {
            heading = args.link;
        }
       
        var temp = doc.midPipes(args.input);
        var options = temp[0]; 
    
        if (options === "off") { 
            gcd.emit("h5 off:" + colon.escape(heading));
            return;
        }
        
        var pipes = temp[1];
        
        var name = colon.escape(args.link);
        var whendone = "text ready:" + doc.file + ":" + name + colon.v  + "sp" ;
    
        doc.pipeDirSetup(pipes, doc.file + ":" + name, function (data) {
            
            if (! Array.isArray(data) ) {
                data = [data];
            }
            
            doc.augment(data, "arr");
        
            doc.store(name, data);
        }    , doc.curname ); 
        
        var handler = gcd.on("heading found:5:" + doc.file , function (data ) {
           
            var found = doc.convertHeading(data);
            var full; 
        
            if (found === heading) {
                full = colon.escape(doc.levels[0]+'/'+found);
                gcd.when("text ready:" + doc.file + ":" + full, whendone); 
            }
        });
    
        gcd.once("h5 off:" + colon.escape(heading), function () {
            gcd.off("heading found:5:" + doc.file, handler);
        });
    
        if (options === "full") {
            gcd.when("parsing done:" + doc.file, whendone).silence();  
        } else {
            gcd.flatWhen("parsing done:" + doc.file, whendone).silence();  
        }
    
        
    
    },
    "compose" : function (args) {
        var doc = this;
        var gcd = doc.gcd;
        
        var cmdname = args.link;
        var cmds = args.input.split("|").map(function (el) {
            var arr = el.split(",").map(function(arg) {
                arg = arg.trim();
                return arg;
            });
            var ind = arr[0].indexOf(" ");
            if (ind !== -1) {
                arr.unshift(arr[0].slice(0, ind).trim());
                arr[1] = arr[1].slice(ind).trim();
            }
            return arr;
        });
    
        var fcmd = doc.file + ":" + cmdname;
        var compready = "composition ready:" + fcmd;
        var compcheck = "composition command checking:" + fcmd;
        var cmddefine = "command defined:" + cmdname;
        
        var define = function () {
            doc.commands[cmdname] =  doc.parent.compose.apply(null, cmds);
            gcd.emit(cmddefine);
        };
        
        gcd.once(compready, define);
        
        gcd.when(compcheck, compready);
        
        // get unique cmds
        var obj = {};        
        cmds.forEach(function (el) {
           obj[el[0]] = 1;
        });
        
        Object.keys(obj).forEach(function (el) {
            if (el[0] === "." ) {
                return ;
            }
            if (!(doc.commands[el])) {
                gcd.when("command defined:" +  el, cmddefine);
            }
        });
        
        gcd.emit(compcheck);
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
            var prekind = el.slice(0, ind).trim();
            var kind = types[prekind];
            if (!kind) { 
                doc.log("unrecognized type in npminfo:" + prekind );
                return;
            }
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

Folder.subCommands = (function () {
    var ret = {};
    
    ret.echo = ret.e = function () {
        var arr = Array.prototype.slice.call(arguments);
        
        var ret = arr.map(function (str) { 
            if (("\"'`".indexOf(str[0]) !== -1) && 
                (str[0] === str[str.length-1]) ) {
                
                return str.slice(1, -1);
            } else {
                return str;
            }
        });
    
        ret.args = true;
    
        return ret;
    };
   
    ret.join = ret.j = function (sep) {
        var args = Array.prototype.slice.call(arguments, 1);
        var ret = [];
        
        args.forEach( function (el) {
            if ( Array.isArray(el)) {
                ret.push(el.join(sep));
            } else {
                ret.push(el);
            }
        });
    
        return ret.join(sep);
    
    };
    
    ret.array = ret.arr = ret.a = function () {
        return Array.prototype.slice.call(arguments, 0);
    };

    ret.object = ret.obj = ret.o = function (str) {
        var ret, doc = this;
        try {
            ret = JSON.parse(str);
            if (Array.isArray(ret) ) {
                return ["val", ret];
            } else {
                return ret;
            }
        } catch (e) {
            doc.gcd.emit("error:arg prepping:bad json parse:" + this.cmdname, 
                [e, e.stack, str]);
            return ["error", e];
        }
    };

    ret.merge = function (a) {
        var ret, args; 
        if (Array.isArray(a) ) {
            args = Array.prototype.slice.call(arguments, 1);
            return Array.prototype.concat.apply(a, args);
        } else {
            args = Array.prototype.slice.call(arguments, 1);
            ret = a;
            args.forEach( function (el) {
                var key;
                for (key in el) {
                    ret[key] = el[key];
                }
            });
            return ret; 
        }
    };

    ret["key-value"] = ret.kv = function () {
        var ret = {};
        var i, n = arguments.length;
        for (i = 0; i < n; i += 2) {
            ret[arguments[i]] = arguments[i+1];
        }
    
        return ret;
    };

    ret.act = function (obj, method) {
        try {
            return  obj[method].apply(obj, 
                Array.prototype.slice.call(arguments, 2)) ;
        } catch (e) {
            this.gcd.emit("error:arg prepping:bad method:" + this.cmdname, 
                [e, e.stack, obj, method,
                Array.prototype.slice.call(arguments)]);
            return ;
        }
    };

    ret.property = ret.prop = function () {
        var props = Array.prototype.slice.call(arguments, 0);
        var obj;
        try {
            obj = props.reduce(function (prev, cur) {
                return prev[cur];
            });
            return obj;
        } catch (e) {
            this.gcd.emit("error:bad property access:" +
                this.cmdname, [e, e.stack, props]);
            return;
        }
    };

    ret.json = function (obj) {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            this.gcd.emit("error:arg prepping:bad json:" + this.cmdname, 
                [e, e.stack, obj]);
            return ;
        }
    };

    ret.set = function (obj, retType) {
        var doc = this;
        var gcd = doc.gcd;
        var name = doc.cmdName;
        var scope, key; 
        
        scope = gcd.scope(name);
        if (!scope) {
            scope = {};
            gcd.scope(name, scope);
        }
        for (key in obj) {
            scope[key] = obj[key];
        }
        if (retType === "pass" ) {
            return obj;
        } else {
            return ;
        }
    };

    ret.gset = function (obj, retType) {
        var doc = this;
        var gcd = doc.gcd;
        var name = doc.cmdName.slice(0, doc.cmdName.lastIndexOf(doc.colon.v)) ;
        var scope, key; 
        
        scope = gcd.scope(name);
        if (!scope) {
            scope = {};
            gcd.scope(name, scope);
        }
        for (key in obj) {
            scope[key] = obj[key];
        }
        if (retType === "pass" ) {
            return obj;
        } else {
            return ;
        }
    } ;

    ret.get = function () {
        var doc = this;
        var gcd = doc.gcd;
        var name = doc.cmdName;
        var scope; 
        
        scope = gcd.scope(name);
        if (!scope) {
            gcd.emit("error:arg prepping:no scope:" + name);
            return ;
        }
    
        var i, n = arguments.length;
        var ret = [];
        for (i = 0; i < n; i +=1 ) {
            ret.push(scope[arguments[i]]);
        }
        ret.args = true; // each is separate 
        return ret;
    };

    ret.gget = function () {
        var doc = this;
        var gcd = doc.gcd;
        var name = doc.cmdName.slice(0, doc.cmdName.lastIndexOf(doc.colon.v)) ;
        var scope; 
        
        scope = gcd.scope(name);
        if (!scope) {
            gcd.emit("error:arg prepping:no scope:" + name);
            return ;
        }
    
        var i, n = arguments.length;
        var ret = [];
        for (i = 0; i < n; i +=1 ) {
            ret.push(scope[arguments[i]]);
        }
        ret.args = true; // each is separate 
        return ret;
    } ;

    ret.arguments = ret.args = function (arr) {
        var ret =  arr.slice(0); //make a shallow copy
        ret.args = true;
        return ret;
    };

    ret.number = ret.n = ret["#"] = function () {
        var ret = [], i, n = arguments.length;
        for (i = 0; i < n; i += 1) {
            ret.push(Number(arguments[i]));
        }
        ret.args = true;
        return ret;
    };

    ret.eval = function (code) {
        var ret, doc = this;
        var args = Array.prototype.slice.call(arguments, 1);
    
        if ( (code[0] === "`" ) && (code[code.length-1] === code[0]) ) {
            code = code.slice(1, code.length-1);
        }
       
        try {
            eval(code);
            return ret;
        } catch (e) {
            doc.gcd.emit("error:arg prepping:bad eval:" + doc.cmdname, 
                [e, e.stack, code, args]);
            return;
        }
    
    };

    ret.log = function () {
        var doc = this, name = doc.cmdName;
        var args = Array.prototype.slice.call(arguments);
        doc.log("arguments in " + name + ":\n---\n" + 
            args.join("\n~~~\n") + "\n---\n");
        return args;  
    };

    ret.true = ret.t = function () {return true;}; 
    ret.false = ret.f = function () {return false;}; 
    ret.null = function () {return null;}; 
    ret.doc =  function () {return this;}; 
    ret.skip = function () {return ;}; 

    return ret;

})();

Folder.defSubCommand =function (sub, f, cmd) {
    var subs, cmdplug,  cmdsub;

    if (cmd) {
        cmdplug = this.plugins[cmd];
        if (!cmdplug) {
            cmdplug = this.plugins[cmd] = {};
        } 
        cmdsub = cmdplug.subCommands;
        if (!cmdsub) {
            cmdsub = cmdplug.subCommands = {};
        }
        cmdsub[sub] = f;
    } else {
        subs = this.subCommands;
        subs[sub] = f; 
    }
};


var Doc = Folder.prototype.Doc = function (file, text, parent, actions) {
    this.parent = parent;
    var gcd = this.gcd = parent.gcd;
    this.Folder = Folder;

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
    this.subCommands = parent.subCommands;
    this.colon = Object.create(parent.colon); 
    this.join = parent.join;
    this.log = this.parent.log;
    this.augment = this.parent.augment;
    this.cmdworker = this.parent.cmdworker;
    this.compose = this.parent.compose;
    this.scopes = this.parent.scopes;
    this.subnameTransform = this.parent.subnameTransform;
    this.indicator = this.parent.indicator;
    this.wrapAsync = parent.wrapAsync;
    this.wrapSync = parent.wrapSync;
    this.wrapDefaults = parent.wrapDefaults;
    this.uniq = parent.uniq();
    this.sync = Folder.sync;
    this.async = Folder.async;
    this.defSubCommand = Folder.defSubCommand;
    this.dirFactory = parent.dirFactory;
    this.plugins = Object.create(parent.plugins);
    this.convertHeading = parent.convertHeading;

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
        if ( (ind === -1) || ( ind >= (n-1) ) ) {
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
        subname = doc.convertHeading(match[1]);
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

    var chr, match, command, 
        comname, start;
    var n = text.length;
    var comreg = doc.regexs.command[quote];


    while (ind < n) { // command processing loop

        comreg.lastIndex = ind;
        start = ind; 
        
        match = comreg.exec(text);
        if (match) {
            command = match[1].trim();
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
                name, [start, ind, text[ind]]);
        }

    }
    

    return ind+1;

};

dp.regexs = {

    command : {
        "'" : /\s*([^|'\s]*)([\S\s])/g,
        '"' : /\s*([^|"\s]*)([\S\s])/g,
        "`" : /\s*([^|`\s]*)([\S\s])/g
    },
    argument : {
        "'" : /\s*([^,|\\']*)([\S\s])/g,
        '"' : /\s*([^,|\\"]*)([\S\s])/g,
        "`" : /\s*([^,|\\`]*)([\S\s])/g
    },
    endarg : {
        "'" : /\s*([,|\\'])/g,
        '"' : /\s*([,|\\"])/g,
        "`" : /\s*([,|\\`])/g

    },
    subname : {
        "'" : /\s*([^|']*)([\S\s])/g,
        '"' : /\s*([^|"]*)([\S\s])/g,
        "`" : /\s*([^|`]*)([\S\s])/g
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
        if (text === null ) {
            delete scope[varname];
            gcd.emit("deleting existing var:" + file + ":" + varname, 
                {oldtext: old});
        } else {
            scope[varname] = text;
            gcd.emit("overwriting existing var:" + file + ":" + varname, 
            {oldtext:old, newtext: text} );
        }
    } else {
        scope[varname] = text;
        gcd.emit("text stored:" + file + ":" + varname, text);
    }
};

dp.getBlock = function (start, cur) {
    var doc = this;
    var colon = doc.colon;

    if (typeof cur === "string") {
        cur = colon.restore(cur);
    } else {
        cur = '';
    }

    if (typeof start === "string") {
        if ( start[0] === "#") {
            start = start.slice(1).replace(/-/g, " ");
        }

        start = doc.convertHeading(start);

        if (start[0] === ":") {
            start = doc.stripSwitch(cur) + start;
        }

    } else {
        doc.gcd.emit("error:start not a string in doc block", [start, cur]);
        start = '';
    }
    if (!start) {
        start = cur;
    }

    return colon.escape(start);
};

dp.stripSwitch = function (name) {
    var ind, blockhead;

    blockhead = name = name || '';

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

dp.argHandlerMaker =     function (name, gcd) {
        var f = function (data) {
            var ret = [data[1][1]]; //cmd name
            var args = data.slice(2);
            args.forEach(function (el) {
                ret.push(el[1]);
            });
            ret.sub = true;
            gcd.emit("text ready:" + name, ret);
        };
        f._label = "arg command processing;;"+name;
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

    var whenIt = function () {
        name.push(start); 
        curname =  name.join(colon.v);
        gcd.when("text ready:" + curname, "arguments ready:" + emitname);
    };


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

    
    while ( ind < n ) {

        switch (text[ind]) {

            case "\u005F" :  // underscore
                if ( (start === ind) &&
                     ( "\"'`".indexOf(text[ind+1]) !== -1 ) ) {
                    whenIt();
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
                            err = [argstring, text[start], text[ind], start, ind];
                            gcd.emit("error:" + topname, [err, "stuff found after argument finished"]);
                            argstring = "";
                        }
                        argdone = false;
                        name.pop();
                        start = ind+1;
                    
                    } else { // simple string
                        whenIt();
                        gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                        name.pop();
                        argstring = "";
                        start = ind + 1;
                    }
                    ind += 1;
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
                                err = [argstring, text[start], text[ind], start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finished"]);
                                argstring = "";
                            }
                            argdone = false;
                            name.pop();
                            start = ind+1;
                        
                        } else { // simple string
                            whenIt();
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            name.pop();
                            argstring = "";
                            start = ind + 1;
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
                    if (stack[0] === "[") {
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
                       whenIt(); 
                       emitname = curname;
                       gcd.once("arguments ready:" + emitname, handlerMaker(emitname, gcd));
                       gcd.when(["arg command parsed:" + emitname, "arg command is:" + emitname], "arguments ready:" + emitname);
                       gcd.emit("arg command is:" + emitname, argstring.trim().toLowerCase());
                       argstring = '';
                       ind += 1;
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
                       stack.unshift("(");
                       argstring += "(";
                   } 
                break;
                
                case ")" :
                    if (stack[0] === cp) {
                        stack.shift();
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, text[start], text[ind], start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finished"]);
                                argstring = "";
                            }
                            argdone = false;
                            name.pop();
                            start = ind+1;
                        
                        } else { // simple string
                            whenIt();
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            name.pop();
                            argstring = "";
                            start = ind + 1;
                        } //  the last argument is popped
                        gcd.emit("arg command parsed:" + emitname);
                        emitname = name.slice(0, -1).join(colon.v);
                        argdone = true;
                        argstring = '';
                        ind += 1;
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
                        if (stack[0] === "(") {
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
                    if (stack[0] === "{") {
                        stack.shift();
                    }
                    argstring += "}" ;
                break;

            case "'" :
                if ( (stack.length === 0) && (quote === "'") ) {
                    if (argstring.trim()) {
                        if (argdone) {
                            if (argstring !== "") {
                                err = [argstring, text[start], text[ind], start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finished"]);
                                argstring = "";
                            }
                            argdone = false;
                            name.pop();
                            start = ind+1;
                        
                        } else { // simple string
                            whenIt();
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            name.pop();
                            argstring = "";
                            start = ind + 1;
                        }
                    }
                    return ind;
                } else {
                    // start after current place, get quote position
                    temp = text.indexOf("'", ind+1)+1;
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
                                err = [argstring, text[start], text[ind], start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finished"]);
                                argstring = "";
                            }
                            argdone = false;
                            name.pop();
                            start = ind+1;
                        
                        } else { // simple string
                            whenIt();
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            name.pop();
                            argstring = "";
                            start = ind + 1;
                        }
                    }
                    return ind;
                } else {
                    // start after current place, get quote position
                    temp = text.indexOf("\u0022", ind+1)+1;
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
                                err = [argstring, text[start], text[ind], start, ind];
                                gcd.emit("error:" + topname, [err, "stuff found after argument finished"]);
                                argstring = "";
                            }
                            argdone = false;
                            name.pop();
                            start = ind+1;
                        
                        } else { // simple string
                            whenIt();
                            gcd.emit("text ready:" + curname, doc.whitespaceEscape(argstring.trim()));
                            name.pop();
                            argstring = "";
                            start = ind + 1;
                        }
                    }
                    return ind;
                } else {
                    // start after current place, get quote position
                    temp = text.indexOf("`", ind+1)+1;
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
        var input, args, command, han;
    
        input = data[0][1];
        command = data[1][1][1];
        args = data.slice(2).map(function (el) {
            return el[1];
        });
        
        var fun;
        if ( (command[0] === ".") && (command.length > 1) ) {
            fun = doc.commands["."];
            args.unshift(command.slice(1) );
        } else {
            fun = doc.commands[command];
        }
    
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

dp.argsPrep = function self (args, name, subs, command ) {
    var retArgs = [], i, n = args.length;
    var ret, subArgs;
    var cur, doc = this, gcd = this.gcd;
    doc.cmdName = name;
    var csubs, subc;
    csubs =  doc.plugins[command] &&
         doc.plugins[command].subCommands ;
    for (i = 0; i < n; i += 1) {
        cur = args[i];
        if (Array.isArray(cur) && cur.sub ) {
            subArgs = cur.slice(1);
            if (subArgs.length) {
                subArgs = self.call(doc, subArgs, name, subs);
            }
            subc = cur[0];
            try {
                if (csubs && csubs[subc] ) {
                    ret = csubs[subc].apply(doc, subArgs);
                } else if (subs && subs[subc] ) {
                    ret = subs[subc].apply(doc, subArgs);
                } else {
                    gcd.emit("error:no such subcommand:" + command + ":" +
                        subc, [i, subArgs,name]);
                    continue;
                }
            } catch (e) {
                gcd.emit("error:subcommand failed:" + command + ":" +
                subc, [i, subArgs, name]);
                continue;
            }
            
            if (Array.isArray(ret) && (ret.args === true) ) {
                Array.prototype.push.apply(retArgs, ret);
            } else if (typeof ret === "undefined") {
                // no action, nothing added to retArgs
            } else {
                retArgs.push(ret);
            }
        } else { // should never happen
            retArgs.push(cur);
        }

    }

    return retArgs;

};  

dp.getPostPipeName = function (name) {
    var ind = name.indexOf("|") + 1;
    if (ind) {
        return name.slice(ind);
    } else {
        return '';
    }
} ;

module.exports = Folder;
