Augmented array single - exploring mapc
---
# Mapc

So apparently mapc is returning a value instead of an array when there is only
one entry. This is to run a test that demonstrates this so we can squash this
bug. 

    This

[stuff](# "store: | .split \n |  augment arr | .mapc rev | .join \n")

[out](#stuff "save:")

## Command

Let's define a command to use for mapc

    function (input) {
        return input.split('').reverse().join('');
    }

[rev](# "define:")

---
sihT
