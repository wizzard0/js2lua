#About

reLua is a pure lua regular expression library that uses a breadth-first NFA algorithm to match in linear time with respect to the input string, avoiding pathological exponential running times of most common regex algorithms. Submatches are supported using parentheses, as well as alternations, kleen star, lazy repetitions, and character groups, to name a few features. The algorithm can easily be extended to include back references and recursion, however it is not currently supported.

reLua exists for people who want regex's with more power than Lua's built-in pattern matching, but don't need all the myriad of features of something like PCRE. reLua is written entirely in Lua, so it can be used in all your projects!

This is written by myself, for myself, and the code is here for other people's convenience. If you like it, let me know! I'd love to hear about it!

basic usage:
```
  re = require("re")
  local regex = re.compile("r(e*)gex?")
  local match = regex:execute("input string")
  pring( match[1] )
```
The code is licensed under the ZLib license.
