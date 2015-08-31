compose -- testing the composition and related commands
---
# Compose

Here we test the following:

* compose directive
* echo
* array
* miniDoc
* (minidoc).store
* (minidoc).apply
* augment
* augment arr: .splitsep, .pluck, ?.mapc

lists!

    _"just some text| echo ignore it all"

    _"just some text | array 1, 2, 3 | .join -- "

    _"splitting | .split -- | augment arr | .trim |
        .splitsep / |.pluck 1 | .trim | .join ! "

    _"splitting | .split \n--\n | augment arr | 
        .splitsep / | minidoc :title |  
        .apply :some, echo,  great |
        .store nav | echo _"temp" | compile nav "

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

---
ignore it all

Text and more

this is great--1--2--3

geese!text!

kicking

 geese 

great
