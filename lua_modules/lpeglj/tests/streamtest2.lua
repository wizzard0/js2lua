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

local ret

print"Tests for LPegLJ stream mode"

assert(type(m.version()) == "string")
print("version " .. m.version())

local pat = m.C('abcd') * m.C('x')
local fce = pat:streammatch()

ret = { fce("a") }
checkeq(ret, { 1 })
ret = { fce("b") }
checkeq(ret, { 1 })
ret = { fce("c") }
checkeq(ret, { 1 })
ret = { fce("d") }
checkeq(ret, { 1, "abcd" })
ret = { fce("x") }
checkeq(ret, { 0, 'x' })

local pat = m.C('abcd') * m.C('x') + m.C('abcd') * m.C('y')
local fce = pat:streammatch()
ret = { fce("abcd") }
checkeq(ret, { 1 })
ret = { fce("y") }
checkeq(ret, { 0, "abcd", "y" })

local pat = m.C('abcd') ^ 0 * m.C('x')
local fce = pat:streammatch()
for i = 1, 1e3 do
    ret = { fce("ab") }
    checkeq(ret, { 1 })
    ret = { fce("cd") }
    checkeq(ret, { 1, "abcd" })
end
ret = { fce("x") }
checkeq(ret, { 0, "x" })

local pat = (m.C('abcd') / "out") ^ 0 * m.C('x')
local fce = pat:streammatch()
for i = 1, 1e3 do
    ret = { fce("ab") }
    checkeq(ret, { 1 })
    ret = { fce("cd") }
    checkeq(ret, { 1, "out" })
end
ret = { fce("x") }
checkeq(ret, { 0, "x" })

local pat = (m.C('abcd') / "pattern1" + m.C('efgh') / "pattern2" + (m.P(1) - 'xyz')) ^ 0 * (m.C("xyz") / "pattern3")
local fce = pat:streammatch()

for i = 1, 1e3 do
    ret = { fce("ef") }
    checkeq(ret, { 1 })
    ret = { fce("gh") }
    checkeq(ret, { 1, "pattern2" })
    ret = { fce("a") }
    checkeq(ret, { 1 })
    ret = { fce("bcd") }
    checkeq(ret, { 1, "pattern1" })
end
ret = { fce("xyz") }
checkeq(ret, { 0, "pattern3" })

local pat = m.P('abcd') * -1
local fce = pat:streammatch()
ret = { fce("abc") }
checkeq(ret, { 1 })
ret = { fce("d") }
checkeq(ret, { 1 })
ret = { fce("", true) }
checkeq(ret, { 0, 5 })

local field = '"' * m.Cs(((m.P(1) - '"') + m.P'""' / '"') ^ 0) * '"' +
        m.C((1 - m.S',\n"') ^ 0)

local record = field * (',' * field) ^ 0 * (m.P'\n' + -1)

local fce = record:streammatch()
ret = { fce('ab') }
checkeq(ret, { 1 })
ret = { fce('c') }
checkeq(ret, { 1 })
ret = { fce(',"def",') }
checkeq(ret, { 1, 'abc', 'def' })
ret = { fce('x', true) }
checkeq(ret, { 0, 'x' })

record = re.compile[[
  record <- field (',' field)*  (%nl / !.)
  field <- escaped / nonescaped
  nonescaped <- { [^,"%nl]* }
  escaped <- '"' {~ ([^"] / '""' -> '"')* ~} '"'
]]

local fce = record:streammatch()
ret = { fce("a") }
checkeq(ret, { 1 })
ret = { fce("bc,") }
checkeq(ret, { 1, 'abc' })
ret = { fce("def", true) }
checkeq(ret, { 0, 'def' })

local c = re.compile([[
  s <-  ({(!longstring .)+} / longstring)*
  longstring <- '[' {:init: '='* :} '[' close
  close <- ']' =init ']' / . close
]])

local teststring = 'data1[=[insidedata1]=]data2[==[====]==]data3[[]]'

local output = { 'data1', 'data2', 'data3' }

local fce = c:streammatch()

local index = 1

for i = 1, #output do
    local status, data
    repeat
        status, data = fce(teststring:sub(index, index), index == #teststring)
        index = index + 1
    until data or status ~= 1
    checkeq(output[i], data)
end

local pat = m.C('a') * m.Cg('b', 'backref1') * m.C('c') * m.Cg('d', 'backref2') * m.C('e') * m.Cg('f', 'backref3') *
        m.Cb('backref1') * m.C('g') * m.Cb('backref2') * m.C('h') * m.Cb('backref3') * m.C('i')
local fce = pat:streammatch()

ret = { fce("a") }
checkeq(ret, { 1, 'a' })
ret = { fce("b") }
checkeq(ret, { 1 })
ret = { fce("c") }
checkeq(ret, { 1, "c" })
ret = { fce("d") }
checkeq(ret, { 1, })
ret = { fce("e") }
checkeq(ret, { 1, "e" })
ret = { fce("f") }
checkeq(ret, { 1, "b" })
ret = { fce("g") }
checkeq(ret, { 1, "g", "d" })
ret = { fce("h") }
checkeq(ret, { 1, "h", "f" })
ret = { fce("i") }
checkeq(ret, { 0, "i" })

local pat = m.C('a') * (m.Cg(1, 'backref') * m.C('x1') * m.Cb('backref') + m.Cg(1, 'backref') * m.C('x2') * m.Cb('backref'))
local fce = pat:streammatch()
ret = { fce("a") }
checkeq(ret, { 1, 'a' })
ret = { fce("x") }
checkeq(ret, { 1 })
ret = { fce("x") }
checkeq(ret, { 1 })
ret = { fce("2") }
checkeq(ret, { 0, 'x2', 'x' })


local pat = m.C('a') * m.Ct(m.Cg('b', 'index')) * m.C('c')
local fce = pat:streammatch()

ret = { fce("a") }
checkeq(ret, { 1, 'a' })
ret = { fce("b") }
checkeq(ret, { 1, { index = 'b' } })
ret = { fce("c") }
checkeq(ret, { 0, 'c' })

print('OK')

