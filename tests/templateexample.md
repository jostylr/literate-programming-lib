template example -- from the readme
---start:in
## Top

After the first compile, the numbers will be decremented, but the blocks
will not be evaluated.

    \1_":first"

    \2_":second"
    
    \1_":final"


This is now a template. We could use it as

[happy.txt](# "save:| compile basic, great")
[sad.txt](# "save:| compile basic, grumpy")


# Basic

[first]()
    
    Greetings and Salutations

[final]()

    Sincerely,
    Jack

# Great

[second]()

    You are great.

# Grumpy

[second]()

    You are grumpy.
---out:happy.txt
Greetings and Salutations

You are great.

Sincerely,
Jack
---out:sad.txt
Greetings and Salutations

You are grumpy.

Sincerely,
Jack
