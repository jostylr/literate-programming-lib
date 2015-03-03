Implement if command and if directive. The if command would be if flag, cmd to
execute, arg1, arg2, ... to put into the command to execute. If flag not
present, we pass thru. 

For the if directive, we would have `[...](... "if: flag ; dir: ....") so
basically we check the flag and if it works then we run the directive as if
the if:flag was not there. 

Also implement flag directive. A flag command would get into issues of
ordering.