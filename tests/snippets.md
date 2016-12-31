Snippets - testing out a snippet
---
# default

We need to add a snippet. This should be done in lprc.js

    doc.plugins.snippets["js-t"] = 
      'ARG0 = (typeof ARG0 !== "undefined") : ARG0 ? ARG1'

[snips](# "eval:")

## Actual text

    function (a) {
        _'|s js-t, a, "flowers"';
    }

[out](# "save:")
---
function (a) {
    a = (typeof a !== "undefined") : a ? "flowers";
}
