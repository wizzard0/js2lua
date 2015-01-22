LPegLJ 0.12.2LJ
===========
## New functions:
###Loading and saving patterns:
####pat:save(fname, [tree])
Save pattern to file.

fname - file name for pattern

tree - full pattern tree is saved - later modification is possible
####pat:dump([tree])
Dump pattern to string.
 
tree - full pattern tree is saved - later modification is possible
####lpeg.loadfile(fname, [fsymbols])
Load pattern from file.

fname - file name with pattern

fsymbols - table with functions (key - symbolic name, value - function). This should be used only for functions with upvalues. 

####lpeg.load(str, [fsymbols])
Load pattern from memory.

str - pattern in memory (string or ffi type)

fsymbols - table with functions (key - symbolic name, value - function). This should be used only for functions with upvalues.

###Example:
```Lua
local lpeglj = require"lpeglj"
local pat = lpeglj.P('abc')
pat:save("saved.pat")  -- save only pattern code
local savedpat = lpeglj.loadfile("saved.pat")
```
###Left recursion:
####lpeglj.enableleftrecursion(set)
*set* - enable left recursion
####lpeglj.V(v, p)
*p* - precedence level (number 1 to n)
###Example:
```Lua
local lpeglj = require"lpeglj"
lpeglj.enableleftrecursion(true)
local pat = m.P{
    "E",
    E = lpeglj.V("E", 1) * '+' * lpeglj.V("E", 2) +   -- left associative rule with low precedence
     lpeglj.V("E", 2) * '**' * lpeglj.V("E", 2) +     -- right associative rule with higher precedence
    'n'
    }
pat:match("n+n+n")
```
####using re module with precedence
```Lua
local lpeglj = require"lpeglj"
local re = require"re"
lpeglj.enableleftrecursion(true)
local pat = [[
     E <- E:1 [+-] E:2 / -- left associativity
          E:2 [*/] E:3 /
          E:3 '**' E:3 / -- right associativity
          '-' E:4 /      -- highest precedence
          '(' E ')' /
          [0-9]+
]]
re.match("-1*(6+2/4+3-1)**2", pat)
```
###Using memoization:
####lpeglj.enablememoization(set)
*set* - enable memoization (true or false)

###Using stream:

In stream mode all input data are copied into internal buffers. During parsing algorithm discards unused buffer (without link from stack or from captures stack).
Captures are generated and removed from capture stack in this condition: capture are not in unsolved alternative and capture is not open (should be complete). 
Algorithm generates only complete capture on highest level. Nested captures are generated after higher level captures are completed. 

####lpeglj.streammatch(pat, init, ...)
*pat* - pattern   
*init* - start position in stream (should be positive number)  
*...* - another parameters (same as in lpeg.match function)  

Returns function **func**. This function is called with string data from stream.    
  
####func(str, eos)
*str* - string input (string)  
*eos* - end of stream (boolean)  
Returns **status** and capture(s)(if available) or position.     

**Status**:  
 1 - need another data   
-1 - parsing fail  
 0 - parsing finished    

Restrictions and differences for stream mode:  

- start position in stream should be positive number.
- whole string argument in match-time captures (Cmt and function) is not string but function.
  This function takes two arguments (start and end index of string in stream) and return string. 
 
###Example:
```Lua
local lpeglj = require"lpeglj"
local pat = m.C("abc") * m.C("def")
local fce = pat:streammatch()
local st = fce("ab") -- return 1 - need another data
local st, cap = fce("c") -- return 1 , "abc"  - capture and need another data
local st, cap = fce("def") -- return 0 , "def"  - capture and finish parsing
```

####lpeglj.setmaxbehind(val)
*val* - max position before current position (number or nil for reset)

Function sets maximum position before current position. Buffer with this position can not be deleted.
This function has meaning only for match-time captures which use first string argument. In this case 
algorithm can not determinate range of requested string.       

#### re module

####re.streammatch (pat, init)
*pat* - pattern   
*init* - start position in stream (should be positive number)  

Returns function **func**. This function is called with string data from stream.    
  
####func(str, eos)
*str* - string input (string)  
*eos* - end of stream (boolean)  
Returns **status** and captures or position.     

**Status**:  
 1 - need another data   
-1 - parsing fail  
 0 - parsing finished    

###Runtime tracing:  
####lpeg.enabletracing(set)  
*set* - enable tracing (true or false)   

**Output format:**  
####Rule entry:  
indent '+'[typ] rulename  

*indent* - nesting level  
*typ* - type of call  
- 'M' - memoized rule  
- 'TC' - tail call  
*rulename* - name of rule  

####Rule match:  
indent '='[typ] funcname [extra] subject [captures]  

*indent* - nesting level  
*typ* - type of call  
- 'M' - memoized rule  
- 'IB' - increment bound (for left recursion)  
*extra* - additional info for left recursion - level of IB  
*subject* - corresponding part of input string (or stream)  
*captures* - corresponding part of runtime captures   

####Rule leave (fail):  
indent '-' rulename  

*indent* - nesting level  
*rulename* - name of rule  
