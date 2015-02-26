cycle -- cycle tester of blocks pointing to each other
---
# Cycle

What happens if we have blocks that point to each other? Hopefully nothing.  


    _"block"

## Block

    _"cycle"  _"block:switch"  _"block"

[switch]()

    _"cycle"

## Output

This actually puts the output that we want to see
    
    _"timeout|async"

[out](#output "save:")


## Timeout 

This is where we do a bit of black magic to pop it out of the flow. This
delays it to allow the rest of the stuff to compile and be waiting. 

    setTimeout(function () {
       callback(null, doc.parent.reportwaits().join("\n")); 
    }, 1); 

---
NOT SAVED: out AS REQUESTED BY: in NEED: output
PROBLEM WITH:_"block" IN:cycle FIlE:in
PROBLEM WITH:_"cycle" IN:block FIlE:in
PROBLEM WITH:_"block:switch" IN:block FIlE:in
PROBLEM WITH:_"block" IN:block FIlE:in
PROBLEM WITH:_"cycle" IN:block FIlE:in
PROBLEM WITH:_"timeout|async" IN:output FIlE:in