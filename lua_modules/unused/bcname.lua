-- Converts a LuaJIT bytecode number to name
--
-- usage:   luajit  bcname.lua bytecode_number [bytecode_number2 [...]]
--
-- example:
--    $ luajit-2.1 bcname.lua 71 72
--      VARG
--      ISNEXT
--
-- From:  http://www.freelists.org/post/luajit/frames-and-tail-calls,1

local function bcnumber_to_name( bcnum )
    if not bcnum then return '' end
    return string.sub(require("jit.vmdef").bcnames, bcnum*6+1, bcnum*6+6)
end

for _, v in ipairs(arg) do
    print(bcnumber_to_name(tonumber(v)))
end