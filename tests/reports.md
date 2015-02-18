reports -- testing the report mechanism
---
# Reports

Want to try to get some reports going.

[out](#output "save:")

[never](#hopeless "save:")

## Hopeless

Here we ask for some things that will never happen.

    _"dude"

    _"|bogus"

    _"|sub *, _"not here""

    _"hey now"

    _"just::kidding"

    _"actual"


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
NEED:file ready:out TODO: saving file:out:from:in
NEED:file ready:never TODO: saving file:never:from:in
NEED:scope exists:just TODO: storing:in:just⫶⫶kidding
NEED:location filled:in:hopeless⫶0 TODO: location:in:hopeless⫶0
NEED:text ready:in:hopeless⫶0 TODO: text:in:hopeless⫶0
NEED:location filled:in:hopeless⫶2 TODO: location:in:hopeless⫶2
NEED:text ready:in:hopeless⫶2 TODO: text:in:hopeless⫶2
NEED:location filled:in:hopeless⫶4 TODO: location:in:hopeless⫶4
NEED:text ready:in:hopeless⫶4⫶0⫶1 TODO: text:in:hopeless⫶4⫶0⫶1
NEED:text ready:in:hopeless⫶4 TODO: text:in:hopeless⫶4
NEED:location filled:in:hopeless⫶6 TODO: location:in:hopeless⫶6
NEED:text ready:in:hopeless⫶6 TODO: text:in:hopeless⫶6
NEED:location filled:in:hopeless⫶8 TODO: location:in:hopeless⫶8
NEED:text ready:in:hopeless⫶8 TODO: text:in:hopeless⫶8
NEED:scope exists:just TODO: retrieval:text ready:in:hopeless⫶8⫶0:need:just⫶⫶kidding
NEED:text ready:in:hopeless TODO: text:in:hopeless
NEED:location filled:in:hey now⫶0 TODO: location:in:hey now⫶0
NEED:text ready:in:hey now⫶0 TODO: text:in:hey now⫶0
NEED:text ready:in:hey now TODO: text:in:hey now
NEED:location filled:in:output⫶0 TODO: location:in:output⫶0
NEED:text ready:in:output⫶0 TODO: text:in:output⫶0
NEED:text ready:in:output TODO: text:in:output
NEED:command defined:bogus TODO: command:bogus
