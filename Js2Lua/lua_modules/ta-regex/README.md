ta-regex
========

Regular expression search support for Textadept

This module replaces the default text search with one which uses regular
expressions.

Currently the full regular expressions are supported (not including eg Perl
extensions, though some are planned); this is more than the subset supported
natively in Textadept (which eg don't include "|").

| Syntax | Matches |
|--------|---------|
| .      | Any character except newline |
| [abA-Z]| The characters a,b, or any capital letter |
| \\<     | Zero-length, matches just before the start of a word |
| \\>     | Zero-length, matches just after the end of a word |
| foo&#124;bar      | Match foo or bar |
| (pat)  | Match the same as pat (subgroup) |
| (?:pat)  | Match the same as pat (subgroup), non-capturing |
| x*     | Match zero or more x |
| x+     | match one or more x |
| x?     | match zero or one x |
| \\x     | Where x is one of: ()\\?*+&#124;. : match the character x |
| \\w     | Any "word" character [a-zA-Z_] |
| \\W     | Any non-"word" character [^a-zA-Z_] |
| \\d     | Any digit character [0-9] |
| \\D     | Any non-digit character [^0-9] |
| \\s     | Any whitespace character [ \\t\\n\\v\\r] |
| \\S     | Any non-whitespace character [^ \\t\\n\\v\\r] |
| \\1 ... \\9 | Back reference to Nth (subgroup) |

Installation
------------
Add the ta-regex directory to ~/.textadept/modules/

Add the following line to ~/.textadept/init.lua

```lua
local ta_regex = require 'ta-regex'
ta_regex.install()
```

Internal details
----------------
The module adds a handler for events.FIND to intercept searches.  Regular
expressions are converted to equivalent LPEG patterns, which are then used
for searching the text.

The regex-to-LPEG conversion can be used independently.