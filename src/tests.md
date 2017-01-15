Let's create a testing environment. The idea is that we'll have a series of
documents in the tests folder that will have the convention `name -
description` at the top, then three dashed separator line to create a new
document to parse followed by its result. In more advanced tests, we will
introduce a syntax of input/output and related names. 

The log array should be cleared between tests. 

    /*global require, setTimeout, console*/
    /*jslint evil:true*/

    var fs = require('fs');
    var test = require('tape');
    var Litpro = require('./index.js');

    var testdata = {};

    var testrunner = _"testrunner";

    var equalizer = _"equalizer";

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
        "define.md",
        "blockoff.md",
        "raw.md",
        "h5.md",
        "ignore.md",
        "direval.md",
        "scopeexists.md",
        "subindent.md",
        "templating.md",
        "empty.md",
        "switchcmd.md",
        "pushpop.md",
        "version.md",
        "done.md", 
        "constructor.md",
        "transform.md",
        "defaults.md", // 30
        "dirpush.md", 
        "mainblock.md", 
        "linkquotes.md",
        "subcommands.md",
        "backslash.md",
        "if.md",
        "nameafterpipe.md",
        "fsubcommand.md",
        "directivesubbing.md",
        "config.md",
        "log.md",
        "reports.md",
        "cycle.md",
        "store-pipe.md",
        "comments.md",
        "lineterm.md",
        "trailingunderscore.md",
        "echo.md",
        "compile.md",
        "templateexample.md",
        "store.md",
        "partial.md",
        "cd.md",
        "empty-main.md",
        "empty-minor.md",
        "h5pushodd.md",
        "h5push.md",
        "compileminor.md",
        "arrayify.md",
        "merge.md",
        "funify.md",
        "ife.md",
        "caps.md",
        "augarrsingle.md",
        "objectify.md",
        "miniaugment.md",
        "compose.md",
        "assert.md",
        "wrap.md",
        "js-string.md",
        "html-helpers.md",
        "matrixify.md",
        "snippets.md",
        "repeatheaders.md",
        "capitalizations.md",
        "headless.md",
        "erroreval.md",
        "moresubcommands.md",
        "dash.md",
        "ifelse.md"
    ].
    slice();
    //slice(31, 32);


    Litpro.commands.readfile = Litpro.prototype.wrapAsync(_"test async", "readfile");


    var i, n = testfiles.length;

    for (i =0; i < n; i += 1) {
        testrunner(testfiles[i]);
    }

### testrunner

This is a function that sets up and then runs the test. We need a function to
avoid the implicit closures if it was looped over code. Yay async!

The plan is: read in the file, split it on `---`, figure out what is to be
input vs output and link the tests to the outputs being saved, and then
process the inputs. 

    function (file) {
 
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

        
        _":set up test data"


        var folder = new Litpro({
            "on" : [
                ["need document", "fetch document"],
                ["document fetched", "compile document"]
                ],
             "action" : [
                ["fetch document", _"test fetch document"],
                ["compile document", _"test compile document"]
              ]
        });
        var gcd = folder.gcd;
        
        var log = td.log; 

        //gcd.makeLog();

        //gcd.monitor('cool', function (evt, data) { console.log(evt, data); });

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

         //  notEmit();

         //setTimeout( function () { console.log(folder.reportwaits().join("\n")); }); 

        });
       // setTimeout( function () {console.log("Scopes: ", folder.scopes,  "\nReports: " ,  folder.reports ,  "\nRecording: " , folder.recording)}, 100);

    }




[set up test data]() 

Here we put the tests into testdata either as an input or output. If there are
just two, we assume the first is input and the second is output. The default
names are in and out, respectively. So we should save the output to out. 

The start listing are the ones that get specifically processed. The in, which
includes the starts, are those that can be loaded from within the documents. 

We split the log portion (if present) on `\n!`. We will expect a test for
each log entry and we will verify by the called log function text being in the
array. That should cover most cases. 


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
                td.log.pop(); // test log should end in an \n!
                if( td.log[0]) {
                    td.log[0] = td.log[0].slice(1);
                }
            }
        }
    }

   
### Equalizer

This is just a little function constructor to close around the handler for the
output file name. 

    function (t, out) {
        return function (text) {
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
    }

### Test fetch document

This will fetch the document from the ins of the testdata. 

The emit will be of the form "need document:file location",
with data being the actual file location.

    function (rawname, evObj) {
        var gcd = evObj.emitter;
        var filename = evObj.pieces[0];
        
        if (td.in.hasOwnProperty(filename) ) {
            gcd.emit("document fetched:" + filename, td.in[rawname]);        
        } else {
            console.log("ERROR~File not found: " + filename);
            gcd.parent.createScope(filename);
            gcd.emit("error:file not found:"+ filename);

        }

    }

### Test compile document

This takes in the text of a file and compiles it. 

    function (text, evObj) {
        var gcd = evObj.emitter;
        var filename = evObj.pieces[0];
        var folder = gcd.parent;

        setTimeout(function () {
            folder.newdoc(filename, text);
            }, 1);

    }

### Test async

This is the example async function. It takes in filename and gives out the
text after a timeout. This is to simulate a readfile, but without actually
using the file structures. 

    function (input, args, cb) {
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
    }



### Test list


Test list
+ first was basic concatenation
+ command piping 
+ arguments using compiled blocks
+ async 
+ variables, storing and retrieving, scopes. 
+ switch piping
+ indented code block, code fence, pre, code fence with ignore, saving with
  default
+ getting subbed multiline indented blocks correct
+ command piping (save)
+ multiple input, output documents
+ async eval
+ test backslashing and implement compiling
+ command definitions
+ block on/off to exclude blocks 
+ raw
+ heading levels 5 and 6
+ directives to change ignorable languages
+ eval as directive
+ feedback for things that have not been compiled
+ error catching for evals? 

- something to run over headings, such as test h5 headings. at least an
  example.  Decided not to do this. Maybe a litpro-tape module for
  implementing a test directive. I am not sure what a doc helper might do. I
  think the basic idea is simply that it is a convenience to have common
  headings without interfering and that we have a little bit of help against
  name changes in the path syntax without that path syntax going nuts beyond
  reason. I like the independent sections not depending on it, but doc and
  test are a different matter. 

