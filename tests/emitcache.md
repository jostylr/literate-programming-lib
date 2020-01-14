Emit Cache -- testing the emit cache feature
---
We want to test being able to attach once events to a full "text ready" event
emitting. We will do this by having a command that will call a hard
coded gcd.once on a section that gets called after that section is completed.

    This should return _"wait | reademit"

## wait

    soMEthing

## reademit

    function (text, args, cb) {
        let gcd = this.gcd;
        text = text.toLowerCase();
        gcd.once("text ready:in:wait", (data) => {
            cb(null, text + data.toUpperCase());
        });
    }

[reademit](# "define: async")
---
This should return somethingSOMETHING
