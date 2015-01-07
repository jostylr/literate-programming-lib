/*global require, process, console*/
/*jslint evil:true*/

var fs = require('fs');
var test = require('tape');
var Litpro = require('./index.js');

var text = fs.readFileSync('./tests/first.md', 'utf-8');

var pieces = text.split("\n---\n");
pieces[2] = pieces[2].trim();
var firstLine = pieces[0].split('-');
var name = firstLine[0].trim();;

test(name, function (t) {
    t.plan(2);

    var folder = new Litpro();
    var gcd = folder.gcd;
    gcd.makeLog();
   
    var doc;

    process.on('exit', function () {
        console.log(gcd.log.logs());
    });

    gcd.on("text saved:first:note", function (data, evObj) {
        var doc = folder.docs[evObj.pieces[1]];
        t.equal(data, pieces[2]);
        t.equal(doc.vars.note, pieces[2]);
    });
    
    doc = folder.newdoc(name, pieces[1]);
   
    //console.log(gcd.log.logs());


});