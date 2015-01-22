local vm = require"lpvm"
local m = require"lpeglj"
local re = require"re"

local function checkeq(x, y, p)
    if p then print(x, y) end
    if type(x) ~= "table" then assert(x == y)
    else
        for k, v in pairs(x) do checkeq(v, y[k], p) end
        for k, v in pairs(y) do checkeq(v, x[k], p) end
    end
end

print"Tests for LPegLJ pattern saving and loading"
print("version " .. m.version())

local c = re.compile([[
  s <-  ({(!longstring .)+} / longstring)*
  longstring <- '[' {:init: '='* :} '[' close
  close <- ']' =init ']' / . close
]])

local teststring = 'data1[=[insidedata1]=]data2[==[====]==]data3[[]]'

local patfile = 'test.pat'

local patdata = c:dump()
c:save(patfile)

local pat = m.load(patdata)
checkeq({ pat:match(teststring) }, { "data1", "data2", "data3" })

local pat = m.loadfile(patfile)
checkeq({ pat:match(teststring) }, { "data1", "data2", "data3" })

-- use only vm module (lpvm + lpcap)
local pat, valuetable = vm.load(patdata)
checkeq({ vm.match(pat, teststring, 1, valuetable) }, { "data1", "data2", "data3" })

local pat, valuetable = vm.loadfile(patfile)
checkeq({ vm.match(pat, teststring, 1, valuetable) }, { "data1", "data2", "data3" })

print('OK')
