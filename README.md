# Javascript to Lua translator

### Hey, I heard Javascript was made in 10 days!

So... this is an experiment with making a full-blown Javascript to Lua translator, preserving semantics and so on.

It's a single-pass transpiler that directly generates Lua code from the Esprima AST, without any kind of IR.
Quick-and-dirty, cutting corners, etc etc - don't expect much of this code :)
For example, each ternary expression (?:) generates 4 function calls and a closure - too lazy to implement anything more clever :)

Runs on vanilla LuaJIT, without any C modules or hacking the VM (e.g. Tessel runs on Lua, too, but on heavily modified runtime, which I didnt like)

Oh, and it probably can't bootstrap itself right now :( You can try to push it to that point? That would be cool!

Results on ES5 test suite in 10 days:
`Passed: 3659 Failed: 7753 Cannot Translate: 138 Skipped: 175 Total: 11725 Time:  1479.842`

## Requirements and usage

Uses LuaJIT, esprima, lua-date, lpeglj, ta-regex, ast-hoist, esutils, escodegen

Tested under LuaJIT 2.1+ and node 0.10+.

Assumes LuaJIT binary at `\bin\luajit\luajit`

To run something: `node run.js something.js`. After translation, you can also use `luajit something.lua` to run translated code directly.

To run tests: `node test\test.js test\sometestname.js`. It compares STDOUT of JS and Lua versions to decide if the test passed.

To run entire ES5 test suite: `node test\test.js test\es5\**\*.js` (WARNING: Full suite takes over 20 minutes on fast, SSD-equipped machine!)
Some tests are blacklisted (grep for LUA_SKIP) because they cause infinite loop or do something similarly bad, they're marked as "skipped".


License: MIT

(c) 2015 Oleksandr Nikitin <oleksandr@tvori.info>
