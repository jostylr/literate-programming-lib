reports -- testing the report mechanism
---
# Reports

Want to try to get some reports going.

[out](#output "save:")

[never](#hopeless "save:")

## Hopeless

Here we ask for some things that will never happen.

    _"dude"

    _"|bogus art, dee"

    _"|sub *, _"not here""

    _"hey now"

    _"just::kidding"

    _"actual"

    _"actual:not here"

    _"not a var"


[just::kidding](# "store:hi there")

### Actual

    This works.

### hey now

And one more hopelessness

    _":ev|async"

[ev]()

This does not call the callback.

    1 + 1;

## Output

This actually puts the output that we want to see
    
    _"timeout|async"

## Timeout 

This is where we do a bit of black magic to pop it out of the flow. This
delays it to allow the rest of the stuff to compile and be waiting. 

    setTimeout(function () {
       callback(null, doc.parent.reportwaits().join("\n")); 
    }, 1); 
---
NOT SAVED: out AS REQUESTED BY: in NEED: output
NOT SAVED: never AS REQUESTED BY: in NEED: hopeless
NEED SCOPE: just FOR SAVING: kidding IN FILE: in
PROBLEM WITH: _"dude" IN: hopeless FIlE: in
PROBLEM WITH: _"|bogus art, dee" IN: hopeless FIlE: in
PROBLEM WITH: _"not here" IN: hopeless FIlE: in
PROBLEM WITH: _"|sub *, _"not here"" IN: hopeless FIlE: in
PROBLEM WITH: _"hey now" IN: hopeless FIlE: in
PROBLEM WITH: _"just::kidding" IN: hopeless FIlE: in
NEED SCOPE: just FOR RETRIEVING: kidding IN FILE: in
PROBLEM WITH: _"actual:not here" IN: hopeless FIlE: in
PROBLEM WITH: _"not a var" IN: hopeless FIlE: in
PROBLEM WITH: _":ev|async" IN: hey now FIlE: in
PROBLEM WITH: _"timeout|async" IN: output FIlE: in
NEED COMMAND: bogus FOR: _"|bogus art, dee"
