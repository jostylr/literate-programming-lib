Cd - changing the paths
---start:in
This will be a lot of saving and loading.

[one/](# "cd: load")
[dude](dude.md "load:")
[dude2](dude2.md "load:")
[](# "cd: load")

[first/](# "cd: save")
[one](#dude::here "save:")
[two](#dude2::here "save:")
[](# "cd: save")

---in:one/dude.md
# Here

    Something

---in:one/dude2.md
# Here

    Bye
---out:first/one
Something
---out:first/two
Bye



