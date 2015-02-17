log - testing log features
---start:hi
# Logging

This will test the logging features, both the log directive, the out directive
(Save, but loging), and the log command.

[nothing](#start "save:")

[start](#start "out:")

[out piping](#other "out:|sub !, c")


## Start

Just some stuff

    great sound
    _":cool|log dude, to"

[hi:start\:1\:0](# "log:")

[cool]()

    COOL

[](# "log:")

## Other

    !ool !rickets
---out:nothing
great sound
COOL
---log:
!EVENT: block needs compiling:hi:start⫶cool DATA: undefined
!EVENT: command parsed:hi:start⫶1⫶0 DATA: hi,log,hi:start⫶1⫶1
!EVENT: block substitute parsing done:hi:start⫶cool DATA: undefined
!EVENT: ready to stitch:hi:start⫶cool DATA: 
!EVENT: text ready:hi:start⫶1⫶0⫶0 DATA: dude
!EVENT: text ready:hi:start⫶1⫶0⫶1 DATA: to
!EVENT: waiting for:minor:hi:start⫶cool DATA: minor ready:hi:start⫶cool
!EVENT: minor ready:hi:start⫶cool DATA: COOL
!EVENT: text stored:hi:start⫶cool DATA: COOL
!EVENT: text ready:hi:start⫶cool DATA: COOL
!EVENT: text ready:hi:start⫶1⫶0 DATA: COOL
!EVENT: arguments ready:hi:start⫶1⫶0 DATA: text ready:hi:start⫶1⫶0⫶0,dude,text ready:hi:start⫶1⫶0⫶1,to,command parsed:hi:start⫶1⫶0,hi,log,hi:start⫶1⫶1,text ready:hi:start⫶1⫶0,COOL
!COOL
~~~
dude
~~~
to
!out piping:
cool crickets
~~~

!start:
great sound
COOL
~~~

!
