/*global require*/
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
            out : {}
        };
        
         if (pieces.length === 2) {
            // \n---\n  will be assumed and the rest is to be used
            // the first is input, the second is output
           td.start.push("in");
           td.in.in = pieces[0].slice(1);
           td.out.out = pieces[1].slice(1).trim();
        } else {
            j = pieces.length;
            for (j = 0; j < m; j += 1) {
                piece = pieces[j];
                newline = piece.indexOf("\n");
                if (piece.slice(0,3) === "in:") {
                    td.in[piece.slice(3, newline)] = piece.slice(newline + 1);
                } else if (piece.slice(0,4) === "out:") {
                    td.out[piece.slice(4, newline)] = 
                        piece.slice(newline + 1).trim();
                } else if (piece.slice(0,5) === "start:") {
                    td.start.push(piece.slice(5, newline));
                    td.in[piece.slice(5, newline)] = piece.slice(newline + 1);
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
    
        gcd.makeLog();
    
        test(name, function (t) {
            var outs, m, j, out;
            outs = Object.keys(td.out);
            m  = outs.length;
            t.plan(m);
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
    
            //console.log(gcd.log.logs().join('\n'));
        });
    };

var equalizer = function (t, out) {
        return function (text) {
            t.equals(text, out);
        };
    };

var testfiles = [ 
    "first.md", 
    "eval.md",
    "sub.md"
];

var i, n = testfiles.length;

for (i =0; i < n; i += 1) {
    testrunner(testfiles[i]);
}