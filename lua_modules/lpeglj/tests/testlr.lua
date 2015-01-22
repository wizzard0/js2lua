local lpeg = require"lpeglj"
local re = require"re"

local m = lpeg

local function checkeq(x, y, p)
    if p then print(x, y) end
    if type(x) ~= "table" then assert(x == y)
    else
        for k, v in pairs(x) do checkeq(v, y[k], p) end
        for k, v in pairs(y) do checkeq(v, x[k], p) end
    end
end

print"Tests for LPegLJ left recursion"

assert(type(m.version()) == "string")
print("version " .. m.version())

m.enableleftrecursion(true)

--[[
direct left recursion
E ← E + n / n
--]]

local pat = m.P{
    "E";
    E = m.V"E" * '+' * "n" + "n",
}

assert(pat:match("n+n+n") == 6)

--[[
indirect left recursion
L ← P.x / x
P ← P(n) / L
--]]

local pat = m.P{
    "L";
    L = m.V"P" * ".x" + "x",
    P = m.V"P" * "(n)" + m.V"L"
}

assert(pat:match("x(n)(n).x(n).x") == 15)

--[[
left and right recursion with precedence rules
E ← E1 + E2 / E1 − E2 / E2 ∗ E3 / E2 ÷ E3 / E3 ∗∗ E3 / − E4 / (E1) / n
--]]


local pat = m.P{
    "E",
    E = m.V("E", 1) * m.S'+-' * m.V("E", 2) +
            m.V("E", 2) * m.S'*/' * m.V("E", 3) +
            m.V("E", 3) * '**' * m.V("E", 3) +
            '-' * m.V("E", 4) +
            '(' * m.V("E") * ')' +
            m.R'09' ^ 1,
}

assert(pat:match("-1*(6+2/4+3-1)**2") == 18)

--[[
left and right recursion with precedence rules
E ← E1 + E2 / E1 − E2 / E2 ∗ E3 / E2 ÷ E3 / E3 ∗∗ E3 / − E4 / (E1) / n
create AST tree
--]]


local pat = m.P{
    "E",
    E = m.Ct(m.V("E", 1) * m.C(m.S'+-') * m.V("E", 2) +
            m.V("E", 2) * m.C(m.S'*/') * m.V("E", 3) +
            m.V("E", 3) * m.C('**') * m.V("E", 3) +
            m.C('-') * m.V("E", 4) +
            '(' * m.V("E") * ')' +
            m.C(m.R'09' ^ 1)),
}

local ASTtree = pat:match("1+1+1")
checkeq(ASTtree, { { { "1" }, "+", { "1" } }, "+", { "1" } })

local ASTtree = pat:match("-1*(6+2/4+3-1)**2")
checkeq(ASTtree, { { "-", { "1" } }, "*", { { { { { { "6" }, "+", { { "2" }, "/", { "4" } } }, "+", { "3" } }, "-", { "1" } } }, "**", { "2" } } })

-- using re module with precedence (the same example as above)
-- call_nonterminal : precedence_level or <call_nonterminal : precedence_level >

local pat = [[
     E <- (E:1 {[+-]} E:2 /
          E:2 {[*/]} E:3 /
          E:3 {'**'} E:3 /
          {'-'} E:4 /
          '(' E ')' /
          {[0-9]+}) -> {}
]]

local ASTtree = re.match("-1*(6+2/4+3-1)**2", pat)
checkeq(ASTtree, { { "-", { "1" } }, "*", { { { { { { "6" }, "+", { { "2" }, "/", { "4" } } }, "+", { "3" } }, "-", { "1" } } }, "**", { "2" } } })

--[[
simple evaluator
E ← E1 + E2 / E1 − E2 / E2 ∗ E3 / E2 ÷ E3 / E3 ∗∗ E3 / − E4 / (E1) / n
--]]

local eval = function(s, i, p1, p2, p3)
    local res
    if p2 == '+' then
        res = p1 + p3
    elseif p2 == '-' then
        res = p1 - p3
    elseif p2 == '*' then
        res = p1 * p3
    elseif p2 == '/' then
        res = p1 / p3
    elseif p1 == '-' then
        res = -p2
    elseif p2 == '**' then
        res = p1 ^ p3
    else
        res = p1
    end
    return true, res
end


local pat = m.P{
    "E",
    E = m.Cmt(m.V("E", 1) * m.C(m.S'+-') * m.V("E", 2) +
            m.V("E", 2) * m.C(m.S'*/') * m.V("E", 3) +
            m.V("E", 3) * m.C('**') * m.V("E", 3) +
            m.C('-') * m.V("E", 4) +
            '(' * m.V("E") * ')' +
            m.C(m.R'09' ^ 1), eval),
}

assert(pat:match("-1*(6+2/4+3-1)**2") == -72.25)


local pat = m.P{
    "E",
    E = m.V("E", 1) * '+' * m.V("E", 2) / function(c1, c2) return c1 + c2 end +
            m.V("E", 1) * '-' * m.V("E", 2) / function(c1, c2) return c1 - c2 end +
            m.V("E", 2) * '*' * m.V("E", 3) / function(c1, c2) return c1 * c2 end +
            m.V("E", 2) * '/' * m.V("E", 3) / function(c1, c2) return c1 / c2 end +
            m.V("E", 3) * '**' * m.V("E", 3) / function(c1, c2) return c1 ^ c2 end +
            '-' * m.V("E", 4) / function(c1) return -c1 end +
            '(' * m.V("E") * ')' +
            m.C(m.R'09' ^ 1),
}

assert(pat:match("-1*(6+2/4+3-1)**2") == -72.25)

local def = {
    plus = function(p1, p2) return p1 + p2 end,
    minus = function(p1, p2) return p1 - p2 end,
    mult = function(p1, p2) return p1 * p2 end,
    div = function(p1, p2) return p1 / p2 end,
    pow = function(p1, p2) return p1 ^ p2 end,
    uminus = function(p1) return -p1 end,
    errfce = function(o, i)
        local errstr = o .. '\n' .. (' '):rep(i) .. '^' .. '\n'
        io.write(errstr)
        return false
    end,
}

local pat = [[
     P <-  E s (!. / error)
     s <- %s*
     error <- '' => errfce
     E <- (E:1 s'+' E:2) -> plus /
          (E:1 s'-' E:2) -> minus /
          (E:2 s'*' E:3) -> mult /
          (E:2 s'/' E:3) -> div /
          (E:3 s'**' E:3)-> pow /
          (s'-' E:4) -> uminus /
          s'(' E s')' /
          s{[0-9]+} /
          error
]]

local pat = re.compile(pat, def)
assert(re.match("-1 * (6 + 2 / 4 + 3 - 1)**2", pat) == -72.25)

local pat = [[
     A <-  B "a"
     B <-  C "b"
     C <-  B / A / "c"
]]

local pat = re.compile(pat)
assert(re.match("cbbabbba", pat) == 9)

local pat = [[
     S <- A / B
     A <- A "a" / B / "a"
     B <- B "b" / A / "b"
]]

local pat = re.compile(pat)
assert(re.match("baabbaaa", pat) == 9)

print"OK"
