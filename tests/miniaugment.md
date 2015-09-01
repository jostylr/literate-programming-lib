miniaugment -- testing a bunch of crazy minidoc and augment features 
---
# Miniaug

Here we test the following:

* echo
* array
* miniDoc
* (minidoc).store
* (minidoc).apply
* minidoc set, get, clone, mapc
* augment
* augment arr: .splitsep, .pluck, .mapc

lists!

    _"just some text| echo ignore it all"

    _"just some text | array 1, 2, 3 | .join -- "

    _"splitting | .split -- | augment arr | .trim |
        .splitsep / |.pluck 1 | .trim | .mapc rev | .join ! "

    _"splitting | .split \n--\n | augment arr | 
        .splitsep / | minidoc :title | .mapc .trim |
        | push | .clone | 
        .apply :some, echo,  great | store obj |
        .store nav | echo _"temp" | compile nav
        | store final | 
        | pop | .set :new, rad | .store cool | echo _"final" "

    _"cool:some"

    _"cool:new"

    _"obj | .get :title "

[out](# "save:")

## Temp

    \_":title"

    \_":this is"

    \_":some"

[sub]()

    hey

## just some text

Huh?

    Text and more

    this is great

## splitting

    :this is / geese 
    --
    :some /
    text
    --
    kicking

## Command

Let's define a command to use for mapc

    function (input) {
        return input.split('').reverse().join('');
    }

[rev](# "define:")

---
ignore it all

Text and more

this is great--1--2--3

eseeg!txet!

kicking

geese

great

text

rad

kicking
