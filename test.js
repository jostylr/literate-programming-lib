/*global require, setTimeout, console*/
/*jslint evil:true*/

var fs = require('fs');
var test = require('tape');
var Litpro = require('./index.js');

var testdata = {};

var testrunner = function (file) {

    var pieces, name, i, n, td, newline, piece,
        start, text, j, m, filename;

    text = fs.readFileSync('./tests/'+file, 'utf-8');
    pieces = text.split("\n---");
    
    name = file + ": " + pieces.shift().split('-')[0].trim();

    td = testdata[name] = {
        start : [],
        in : {},
        out : {},
        log : []
    };

    
     if (pieces.length === 2) {
        // \n---\n  will be assumed and the rest is to be used
        // the first is input, the second is output
       td.start.push("in");
       td.in.in = pieces[0].slice(1);
       td.out.out = pieces[1].slice(1).trim();
    } else {
        m = pieces.length;
        for (j = 0; j < m; j += 1) {
            piece = pieces[j];
            newline = piece.indexOf("\n");
            if (piece.slice(0,3) === "in:") {
                td.in[piece.slice(3, newline)] = piece.slice(newline + 1);
            } else if (piece.slice(0,4) === "out:") {
                td.out[piece.slice(4, newline)] = 
                    piece.slice(newline + 1).trim();
            } else if (piece.slice(0,6) === "start:") {
                td.start.push(piece.slice(6, newline));
                td.in[piece.slice(6, newline)] = piece.slice(newline + 1);
            } else if (piece.slice(0,4) === "log:" ) {
                td.log = piece.slice(newline + 1).split("\n!");
                td.log.pop();
                td.log[0] = td.log[0].slice(1);
            }
        }
    }


    var folder = new Litpro({
        "on" : [
            ["need document", "fetch document"],
            ["document fetched", "compile document"]
            ],
         "action" : [
            ["fetch document", function (rawname, evObj) {
                var gcd = evObj.emitter;
                var filename = evObj.pieces[0];
                
                if (td.in.hasOwnProperty(filename) ) {
                    gcd.emit("document fetched:" + filename, td.in[rawname]);        
                } else {
                    console.log("ERROR~File not found: " + filename);
                    gcd.parent.createScope(filename);
                    gcd.emit("error:file not found:"+ filename);
            
                }
            
            }],
            ["compile document", function (text, evObj) {
                var gcd = evObj.emitter;
                var filename = evObj.pieces[0];
                var folder = gcd.parent;
            
                folder.newdoc(filename, text);
            
            }]
          ]
    });
    var gcd = folder.gcd;
    
    var log = td.log; 

   //gcd.makeLog();

   //gcd.monitor('', function (evt, data) { console.log(evt, data); });

    test(name, function (t) {
        var outs, m, j, out;

        folder.log = function (text) {
            if (log.indexOf(text) !== -1) {
                t.pass();
            } else {
                console.log(text);
                t.fail(text);
            }
        };
        

        outs = Object.keys(td.out);
        m  = outs.length;
        
        t.plan(m+log.length);
        
        for (j = 0; j < m; j += 1) {
            out = outs[j];
            gcd.on("file ready:" + out, equalizer(t, td.out[out]) );
        }

        start = td.start;
        n = start.length; 
        for (i = 0; i < n; i += 1) {
            filename = start[i];
            if (!folder.docs.hasOwnProperty(filename) ) { 
                folder.newdoc(filename, td.in[filename]);
            }
        }

        var notEmit = function () { 
            setTimeout( function () {
                var key, el;
                for (key in gcd.whens) {
                    console.log("NOT EMITTING: " + key + " BECAUSE OF " +
                        Object.keys(gcd.whens[key].events).join(" ; "));
                }

                for (key in gcd._onces) {
                    el = gcd._onces[key];
                    console.log("NOT EXECUTED "+ el[1] + " TIMES: " + 
                        key + " BECAUSE EVENT " + el[0] + 
                        " DID NOT FIRE. " + el[2]  + " TIMES LEFT"
                    );
                }

            });
        };

       // notEmit();

     // setTimeout( function () { console.log(folder.reportwaits().join("\n")); }); 

    //  setTimeout( function () {console.log(gcd.log.logs().join('\n')); console.log(folder.scopes)}, 100);
    });
      // setTimeout( function () {console.log("Scopes: ", folder.scopes,  "\nReports: " ,  folder.reports ,  "\nRecording: " , folder.recording)}, 100);

};

var equalizer = function (t, out) {
    return function (text, evObj) {
        var gcd = evObj.emitter;
        if (text !== out) {
            if ( (text[text.length-1] === "\n") && 
                (out[out.length-1] !== "\n" ) ) {
                out += "\n";
            } else {
                console.log(text + "---\n" + out);
            }
        }
        t.equals(text, out);
    };
};

var testfiles = [  
   /**/
   "first.md",
    "eval.md",
    "sub.md",
    "async.md",
    "scope.md", 
    "switch.md",
    "codeblocks.md",
    "indents.md",
    "savepipe.md",  
    "load.md",
    "asynceval.md",
    "compile.md",
    "define.md",
    "blockoff.md",
    "raw.md",
    "h5.md",
    "ignore.md",
    "direval.md",
    "erroreval.md",
    "scopeexists.md",
    "subindent.md",
    "templating.md",
    "empty.md",
    "switchcmd.md",
    "templateexample.md",
    "pushpop.md",
    "if.md",
    "version.md",
    "store.md",
    "directivesubbing.md",
    "done.md", 
    "constructor.md",
    "transform.md",
    "linkquotes.md",
    "backslash.md",
    "log.md",
    "reports.md",
    "cycle.md"
].slice(0, 36);


Litpro.commands.readfile = Litpro.prototype.wrapAsync(function (input, args, cb) {
    var f = function () {
        if (args[0] === "stuff") {
            cb(null, "Hello world. I am cool.");
        } else if ( args[0] === "hello") {
            cb(null, "'Hello world.' + ' I am js.'");
        } else {
            cb(new Error("no such file")) ;
        }
    };
    setTimeout(f, 5);
}, "readfile");


var i, n = testfiles.length;

for (i =0; i < n; i += 1) {
    testrunner(testfiles[i]);
}
