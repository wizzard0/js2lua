-- DEBUGGING
function table_print (tt, indent, done)
    done = done or {}
    indent = indent or 0
    if type(tt) == "table" then
        local sb = {}
        for key, value in pairs (tt) do
            if string.sub(key, 1,2)~='__' then -- ignore impl
                table.insert(sb, string.rep (" ", indent)) -- indent it
                if type (value) == "table" and not done [value] then
                    done [value] = true
                    table.insert(sb, string.format("%s = {\n", tostring(key)));
                    table.insert(sb, table_print (value, indent + 2, done))
                    table.insert(sb, string.rep (" ", indent)) -- indent it
                    table.insert(sb, "}\n");
                elseif "number" == type(key) then
                    table.insert(sb, string.format("\"%s\"\n", tostring(value)))
                else
                    table.insert(sb, string.format(
                            "%s = \"%s\"\n", tostring (key), tostring(value)))
                end
            end
        end
        return table.concat(sb)
    else
        return tt .. "\n"
    end
end

function to_string( tbl )
    if  "nil"       == type( tbl ) then
        return tostring(nil)
    elseif  "table" == type( tbl ) then
        return table_print(tbl)
    elseif  "string" == type( tbl ) then
        return tbl
    else
        return tostring(tbl)
    end
end
-- JS RUNTIME
local bit32 = require("bit")

local __Singletons = {}
local __JsGlobalObjects = {}
local __Helpers = {}

local function __id() end

local function __XpCall(err)
-- this is 'first chance exception handler'
    -- print('FCE:'..to_string(err))
    -- print(debug.traceback())
    if err and err.__Args then
        table.insert(err.__Args, debug.traceback())
    end
    return err
end

local function __LastXpCall(err)
-- this is 'panic handler'
    if err then
        print('Unhandled Exception:'..type(err)..':'..to_string(err)..':'..to_string(err.__Args))
    else
        print('Unhandled Exception: <undefined>')
    end
    print(debug.traceback())
    os.exit(1)
end

local function __Typeof(value)
    if type(value) == 'boolean' or type(value) == 'number' or type(value) == 'string' then
        return type(value)
    end
    if type(value) == 'function' then
        return 'function' -- maybe better to wrap?
    end
    if type(value) == 'table' and value.__Prototype then return 'object' end
    if type(value) == 'table' and value.__TypeofValue then return value.__TypeofValue end
    if value == nil then return 'undefined' end

    print("__Typeof: unsupported! got " .. type(value) ..'='.. to_string(value))
    return '_unknown';
end

local function __ToString(value)
    if value == nil then return 'undefined' end
    if value == __JsGlobalObjects.null then return 'null' end
    if type(value) == 'string' then return value end
    if type(value) == 'table' then
        if value.__Prototype then return __Helpers.__CallMember(value, 'toString') end
        return '[native '..to_string(value)..']'
    end
    return tostring(value)
end
-- print("Tb")
local function __ToBoolean(value)
    -- print(value, type(value))
    if nil == value then return false end
    if __JsGlobalObjects.null == value then return false end
    if type(value) == 'boolean' then return value end
    if type(value) == 'number' then
        if ((value == 0) or (value ~= value)) then
            return false
        else
            return true
        end
    end
    if type(value) == 'string' then return value ~= "" end
    if type(value)=='table' then return true end
    if type(value)=='function' then return true end
    error("__ToBoolean: unsupported! got " .. __ToString(value))
end

local function __Delete(location, key)
    location[key] = nil
    return true
end

local function __ToObject(val)
    -- print("ToObject"..tostring(val))
    if type(val) == 'function' then return __Helpers.__DefineFunction(val) end -- todo cache this?
    if type(val) == 'string' then return __Helpers.__New(__JsGlobalObjects.String, val) end
    if type(val) == 'boolean' then return __Helpers.__New(__JsGlobalObjects.Boolean, val) end
    if type(val) == 'number' then return __Helpers.__New(__JsGlobalObjects.Number, val) end
    local jsType = __Typeof(val)
    error("__ToObject not implemented for " .. jsType .. "/" .. type(val) .. "/" .. tostring(val))
end
__Helpers.__ToObject = __ToObject

local function __ToNumber(val)
    if val == nil or val == false or val == __JsGlobalObjects.null then return 0 end
    if val == true then return 1 end
    if type(val) == 'number' then return val end
    if type(val) == 'function' then error("TypeError: valueof function") end
    if type(val) == 'string' then return tonumber(val) end
    if type(val) == 'table' and val.__Value then return val.__Value end
    if type(val) == 'table' and val.__Prototype then return __Helpers.__CallMember(val, 'valueOf') end
    local jsType = __Typeof(val)
    return 0/0
    -- error("__ToNumber not implemented for " .. jsType .. "/" .. type(val) .. "/" .. tostring(val))
end
__Helpers.__ToObject = __ToObject

local function __PlusOp(left, right)
    if type(left) == 'string' or type(right) == 'string' then
        return __ToString(left) .. __ToString(right)
    else
        return __ToNumber(left) + __ToNumber(right)
    end
end

local function __CmpLess(x, y) -- not really compliant?
    if type(x)=='string' and type(y)=='string' then
        return x<y
    else
        local nx=__ToNumber(x)
        local ny=__ToNumber(y)
        if nx~=nx or ny~=ny then return nil end
        return nx<ny
    end
end

local function __CmpGreater(x, y) -- not really compliant?
    if type(x)=='string' and type(y)=='string' then
        return x>y
    else
        local nx=__ToNumber(x)
        local ny=__ToNumber(y)
        if nx~=nx or ny~=ny then return nil end
        return nx>ny
    end
end

local function __CmpLessEqual(x, y) -- not really compliant?
    if type(x)=='string' and type(y)=='string' then
        return x<=y
    else
        local nx=__ToNumber(x)
        local ny=__ToNumber(y)
        if nx~=nx or ny~=ny then return nil end
        return nx<=ny
    end
end

local function __CmpGreaterEqual(x, y) -- not really compliant?
    if type(x)=='string' and type(y)=='string' then
        return x>=y
    else
        local nx=__ToNumber(x)
        local ny=__ToNumber(y)
        if nx~=nx or ny~=ny then return nil end
        return nx>=ny
    end
end

local function __Get(table, key, inGetter)
    if type(table) ~= 'table' then
        error("Tried to access member " .. __ToString(key) .. " of non-table: " .. to_string(table))
    end
    if not inGetter then
        local getter = __Get(table, '__Get_'..key,true)
        if getter then
            return getter(table,key)
        end
    end
    local result
    local iter = table
    repeat
        result = rawget(iter, key)
        iter = rawget(iter, "__Prototype")
    until (result ~= nil) or (nil == iter)
    return result
end

local function __InstanceOf(table, ctor)
    if table == nil then return false end
    if type(table) ~= 'table' then
        table = __ToObject(table)
    end
    local iter = table
    repeat
        local result = rawget(iter, 'constructor')
        if result ~= nil and result == ctor then
            return true
        end
        iter = rawget(iter, "__Prototype")
    until nil == iter
    return false
end

local function __DiscardThis(f)
    return function(self, ...)
        return f(...)
    end
end

local function __CallMember(table, key, ...)
    -- print("calling " .. __ToString(key))
    if table == nil then
        error("Tried to call member " .. __ToString(key) .. " of undefined")
    end
    if type(table) ~= 'table' then
        table = __ToObject(table)
    end
    local unboundMethod = rawget(table, key)
    if unboundMethod ~= nil then
--      print('cm3')
        return unboundMethod(table, ...) 
    end
    if table.__Prototype then
        local boundMethod = __Get(table.__Prototype, key)
        -- print('got boundmethod '..tostring(table)..'.'..tostring(key)..'='..tostring(boundMethod)..'='..tostring(boundMethod ~= nil))
        if boundMethod ~= nil then
            if type(boundMethod) ~= 'function' and boundMethod.__CallImpl then
                --    print('cm4')
                return boundMethod.__CallImpl(table, ...) -- wrapped
            else 
                --    print('cm5')
                return boundMethod(table, ...) -- builtin
            end
        end
    end
    error("Tried to call method " .. __ToString(key) .. " of " .. __ToString(table) .. " which is missing")
end
__Helpers.__CallMember = __CallMember

local function __Call(table, ...)
    local ci = table.__CallImpl
    if not ci then error("TypeError: Tried to call "..__ToString(table).." which is not callable") end
    return ci(...) -- CurrentThis
end

local function __Put(table, k, v)
    local putter = __Get(table, '__Put_'..k, true)
    if putter then
        putter(table,v)
    end
    rawset(table, k, v)
    if type(k)=='number' then
        rawset(table, tostring(k), v)
    end
    if(string.sub(k,1,2)~='__')then
        rawset(table, '__propEnumerable_'..k, true)
    end
end

local function __ArrayPut(table, k, v)
    local oi = bit32.tobit(tonumber(k) or 1/0)
    local bs = rawget(table, '__BackingStore')
    if k=='length' then
        -- print('SetLen')
        local ol = bit32.tobit(tonumber(bs.length))
        local nl = bit32.tobit(tonumber(v))
        if nl < ol then
            for i=nl,ol do bs[i]=nil end
        end
        bs.length = nl
    elseif oi~=nil then
        local ol = bit32.tobit(tonumber(bs.length))
        bs[oi]=v
        if oi>=ol then
            bs.length = oi+1
        end
    else -- non-numeric property
        rawset(table, k, v)
    end
end

local function __ArrayGet(table, k)
    local oi = bit32.tobit(tonumber(k) or 1/0)
    local bs = rawget(table, '__BackingStore')
    if k=='length' then
        local ol = bit32.tobit(tonumber(bs.length))
        return bs.length
    elseif oi~=nil then
        local ol = bit32.tobit(tonumber(bs.length))
        return bs[oi]
    else -- non-numeric property
        return rawget(table, k)
    end
end

local __ObjectMetatable = {
    __index = __Get,
    __call = __Call,
    __newindex = __Put,
}

local __ArrayMetatable = {
    __index = __ArrayGet,
    __call = __Call,
    __newindex = __ArrayPut,
}

-- wrap Lua function as js function
local function __DefineFunction(definition)
    local obj = {}
    -- TODO function proto
    setmetatable(obj, __ObjectMetatable)
    obj.__CallImpl = definition
    obj.__TypeofValue = "function"
    obj.prototype = __Helpers.__New(__JsGlobalObjects.Object)
    obj.__Prototype = __JsGlobalObjects.Function.prototype
    __JsGlobalObjects.Object.defineProperty(__JsGlobalObjects.Object, obj.prototype,'constructor',{["value"]=obj,["writable"]=true,["configurable"]=true})
    return obj
end
__Helpers.__DefineFunction = __DefineFunction

local function __RefCheck(val, place)
    if nil == val then error(__Helpers.__New(__JsGlobalObjects.ReferenceError, place)) end
    return val
end

local function __MakeEvalRefCheck(code)
    return function(val, place)
        if nil == val then error(__Helpers.__New(__JsGlobalObjects.ReferenceError, place, code)) end
        return val
    end
end

local function __New(ctor, ...)
    if ctor == nil then
        error("new NULL!")
    end
    local obj = {}
    setmetatable(obj, __ObjectMetatable)
    obj.__Prototype = ctor.prototype    
    obj.__TypeofValue = "object"
    -- print('new:[' .. to_string{...} .. ']')
    local rv2 = ctor.__CallImpl(obj, ...)
    if rv2 then return rv2 else return obj end
end
__Helpers.__New = __New

local function __Iterate(obj)
    local results = {}
    for k, v in pairs(obj) do        
        if type(k)=='string' and string.sub(k,1,2)~='__' then
            if obj['__propEnumerable_'..k] then
                results[k]=v
            end
        end
    end
    return pairs(results)
end

local function __ContainsKey(key, obj)
    if obj[key] ~= nil then return true end
    for k,v in pairs(obj) do -- TODO PERF need some optimization here
        if k == key then return true end
    end
    return false
end

local function __Sink()
end

local __TernaryStack={} -- HOLY FUCK
local __TernaryUndefined={}
-- Ternary via stack!
local __TernarySave,__TernaryReplace, __TernaryRestore
do
    -- local o_saved -- nope, wont work with nested
    __TernarySave = function(o)
        if(o==nil)then 
            table.insert(__TernaryStack,__TernaryUndefined) 
        else 
            table.insert(__TernaryStack, o) 
        end
        return __ToBoolean(o)
    end
    __TernaryReplace = function(o) __TernaryStack[#__TernaryStack]=o; return true end
    __TernaryRestore = function() 
        local a =table.remove(__TernaryStack)
        if a==__TernaryUndefined then a=nil end
        return a
    end
end

-- Null
local null = {["__TypeofValue"] = "object", ["__ToStringValue"] = "null"} -- Singleton
__Singletons[null] = true
-- we use nil as undefined
__JsGlobalObjects.null = null


-- Math
local __MathProto = {}
__MathProto.PI = 3.141592653589793
__MathProto.E = 2.718281828459045
__MathProto.LN10 = 2.302585092994046
__MathProto.LN2 = 0.6931471805599453
__MathProto.LOG10E = 0.4342944819032518
__MathProto.LOG2E = 1.4426950408889634
__MathProto.SQRT1_2 = 0.7071067811865476
__MathProto.SQRT2 = 1.4142135623730951
__MathProto.abs  = __DiscardThis(math.abs)
__MathProto.acos  = __DiscardThis(math.acos)
__MathProto.asin  = __DiscardThis(math.asin)
__MathProto.atan  = __DiscardThis(math.atan)
__MathProto.atan2  = __DiscardThis(math.atan2)
__MathProto.ceil  = __DiscardThis(math.ceil)
__MathProto.cos  = __DiscardThis(math.cos)
__MathProto.cosh  = __DiscardThis(math.cosh)
__MathProto.exp  = __DiscardThis(math.exp)
__MathProto.floor  = __DiscardThis(math.floor)
__MathProto.log  = __DiscardThis(math.log)
__MathProto.max  = __DiscardThis(math.max)
__MathProto.min  = __DiscardThis(math.min)
__MathProto.pow  = __DiscardThis(math.pow)
__MathProto.random  = __DiscardThis(math.random)
__MathProto.round = function(self, num) return math.floor(num+0.5) end -- hack
__MathProto.sin  = __DiscardThis(math.sin)
__MathProto.sqrt  = __DiscardThis(math.sqrt)
__JsGlobalObjects.Math = __MathProto
local Math = __MathProto

-- Object
local Object = { ["prototype"] = {} }
Object.getOwnPropertyDescriptor = function(self_o,object, key)
    local isAccessorDescriptor = __Get(object, '__Put_'..key, true) -- put is Sink or func
    local isEnumerable = __Get(object, '__propEnumerable_'..key, true) -- put is Sink or func
    if isAccessorDescriptor then
        if rawequal(isAccessorDescriptor, __Sink) then isAccessorDescriptor = nil end
        return {
            ["get"]=__Get(object, '__Get_'..key,true),
            ["put"]=isAccessorDescriptor,
            ["enumerable"] = isEnumerable,
            ["configurable"] = true
        }
    else
        return {
            ["value"] = object[key],
            ["writable"] = true,
            ["enumerable"] = isEnumerable,
            ["configurable"] = true
        }
    end
end
Object.getPrototypeOf = function(x,obj) return obj.__Prototype end
Object.getOwnPropertyNames = function(x,obj)
    return pairs(obj)
end
Object.prototype.hasOwnProperty = function(self, key)
    if(string.sub(key, 1, 2)=='__') then return false end -- __Prototype, whoops
    return nil ~= rawget(self, key)
end
Object.prototype.propertyIsEnumerable = function(self, key)
    return true == rawget(self, '__propEnumerable_'..key)
end
Object.prototype.toString = function(self)
    local t = __Typeof(self)
    -- why doesnt this wopk?
    -- if self.constructor==__JsGlobalObjects.Array then t='array' end
    if self.__BackingStore then t='array' end
    return "[object " .. string.upper(string.sub(t, 1, 1)) .. string.sub(t, 2) .. "]"
    -- return __ToString(self)
end
Object.defineProperty = function(o, self, key, descriptor)
--print(to_string(key))
    if not descriptor.configurable then
        print('DC:', tostring(__Get(descriptor,'configurable')))
        print(to_string(key))
        error("Error: unconf props NYI") 
    end
    if descriptor.enumerable then rawset(self, '__propEnumerable_'..key, true) end
    if descriptor.get or descriptor.set then
        rawset(self,'__Get_'..key, descriptor.get)
        rawset(self,'__Put_'..key, descriptor.set or __Sink) -- so put is always set, we'll use this
    else
        if not descriptor.writable then error("Error: readonly props NYI") end
        rawset(self, key, descriptor.value)
    end
end
Object.create = (function(self_o, proto, ...) 
        if __Typeof(proto) == 'function' then
            return __New(proto, ...)
        else
            return __New(Object)
        end
    end)
Object.__CallImpl = function(self) return self end -- function Empty() {}, aka Object.__Prototype
setmetatable(Object, __ObjectMetatable)
setmetatable(Object.prototype, __ObjectMetatable)
Object.__ToStringValue = 'function Object() { [builtin] }'
__JsGlobalObjects.Object = Object

-- Function
local Function = __New(Object)
Function.__TypeofValue = "function"
Function.__CallImpl = function(self, code) 
    -- print(to_string(self))
    self.prototype = __New(Object)
    self.length = 0
end
Function.prototype = __New(Object) -- obj and func are special
Function.prototype.toString = function(self)
    return "function() { [unknown code] }"
end
Function.prototype.call = function(self, ...)
    return self.__CallImpl(...)
end
Function.prototype.apply = function(self, self2, argArray)
    local narg={}
    if argArray then
        local i
        for i=0,argArray.length-1 do table.insert(narg, argArray[i]) end
    end
    return self.__CallImpl(self2, unpack(narg))
end
Object.__Prototype = Function.prototype -- maybe wrong
Function.__Prototype = Function.prototype
Object.defineProperty(Object, Function.prototype, 'constructor',{["value"]=Function,["writable"]=true,["configurable"]=true})
__JsGlobalObjects.Function = Function

-- Number
local Infinity = 1/0
local NaN = 0/0
local Number = __New(Function)
Number.NaN = NaN
Number.POSITIVE_INFINITY = Infinity
Number.NEGATIVE_INFINITY = -Infinity
Number.MIN_VALUE = 5e-324
Number.MAX_VALUE = 1.79E+308
Number.__CallImpl = function(self, val)
    -- print('new number' .. val)
    self.__Value = val
end
Number.prototype.toString = __DefineFunction(function(self)
        -- print('returning '..tostring(self.__Value))
        return tostring(self.__Value)
    end)


local isNaN = function(self,v) return v ~= v end
__JsGlobalObjects.Number = Number
__JsGlobalObjects.isNaN = isNaN

-- Array
local Array = __New(Function)
__JsGlobalObjects.Array = Array
Array.__CallImpl = function(self, ...) -- number or varargs...
    self = self or __New(Array)
    self.__BackingStore = {["length"]=0}
    setmetatable(self, __ArrayMetatable)
    local orig = {...}
    -- print('array with ' .. #orig .. ' args')
    local idx = 0
    for k,v in ipairs(orig) do
        self[idx] = v
        idx = idx + 1
    end
    self.length = idx
    if self.length == 1 then
        self.length = self[0]
    end
    return self
end
Array.isArray = function(self,arr)
    return arr.__Prototype == Array.prototype
end
Array.prototype.forEach = function(self, cb, otherSelf)
    local sl = bit32.arshift(self.length,0)
    local os = otherSelf or self -- NOPE, should inherit this
    for i=0,sl-1 do
        cb(os, self[i], i)
    end
end
Array.prototype.indexOf = function(self, item, fromIndex)
    local sl = bit32.arshift(self.length,0)
    local fi = bit32.arshift(fromIndex or 0, 0)
    local os = otherSelf or self -- NOPE, should inherit this
    for i=fi,sl-1 do
        if(rawequal(self[i], item)) then return i end
    end
    return -1
end
Array.prototype.lastIndexOf = function(self, item, fromIndex)
    local sl = bit32.arshift(self.length,0)
    local os = otherSelf or self -- NOPE, should inherit this
    for i=fromIndex or (sl-1),0,-1 do
        if(rawequal(self[i], item)) then return i end
    end
    return -1
end
Array.prototype.push = function(self, element)
    if not self.length then error("Malformed array without length") end
    self[self.length] = element
end
Array.prototype.pop = function(self)
    if not self.length then error("Malformed array without length") end
    local rv = self[self.length - 1]
    self.length = self.length - 1
    return rv
end
Array.prototype.toString = __DefineFunction(function(self)
        -- print('atos')
        -- return 'Array['..self.length..']'
        if self.length == 0 then return '' end
        local str = (self[0]~=nil) and __ToString(self[0]) or ''
        local sl = bit32.arshift(self.length,0)
        for i=1,sl-1 do
            str = str .. ',' .. ((self[i]~=nil) and __ToString(self[i]) or '')
        end
        return str
    end)
Object.defineProperty(Object, Array.prototype, 'constructor',{["value"]=Array,["writable"]=true,["configurable"]=true})
local __MakeArray = function(rawArray)
    local front = {["__BackingStore"]=rawArray}
    front.__Prototype = Array.prototype
    setmetatable(front, __ArrayMetatable)
    return front
end
local __MakeArguments = function(n, rawArray)
    local front = {["__BackingStore"]=rawArray}
    local len = 0
    for i=1,n do
        rawArray[i-1]=rawArray[i]
    end
    rawArray.length = n
    front.__Prototype = Array.prototype
    setmetatable(front, __ArrayMetatable)
    return front
end
local __MakeObject = function(raw)
    setmetatable(raw, __ObjectMetatable)
    raw.__Prototype = Object.prototype
    for k,v in pairs(raw) do
        rawset(raw, '__propEnumerable_'..k, true)
    end
    return raw
end
-- Boolean
local Boolean = __New(Function)
Boolean.__CallImpl = function(self, val) 
    -- print ('Boolean ctor: ' .. val)
    self.__Value = __ToBoolean(val)
    self.__Prototype = Boolean.prototype
end

Boolean.prototype.toString = __DefineFunction(function(self)
        return tostring(self.__Value)
    end)
Object.defineProperty(Object, Boolean.prototype, 'constructor',{["value"]=Boolean,["writable"]=true,["configurable"]=true})
__JsGlobalObjects.Boolean = Boolean


-- String
local String = __New(Function)
local function Utf8to32(utf8str) -- utterly useless, need to utf16
    assert(type(utf8str) == "string")
    local res, seq, val = {}, 0, nil
    for i = 1, #utf8str do
        local c = string.byte(utf8str, i)
        if seq == 0 then			
            table.insert(res, val)
            seq = c < 0x80 and 1 or c < 0xE0 and 2 or c < 0xF0 and 3 or
            c < 0xF8 and 4 or --c < 0xFC and 5 or c < 0xFE and 6 or
            error("invalid UTF-8 character sequence")
            val = bit32.band(c, 2^(8-seq) - 1)
        else
            val = bit32.bor(bit32.lshift(val, 6), bit32.band(c, 0x3F))
        end
        seq = seq - 1
    end
    table.insert(res, val)
    -- table.insert(res, 0)
    return res
end

local function __split(str, pat)
    local t = {}  -- NOTE: use {n = 0} in Lua-5.0
    local fpat = "(.-)" .. pat
    local last_end = 1
    local s, e, cap = str:find(fpat, 1)
    local idx = 0
    while s do
        if s ~= 1 or cap ~= "" then
            t[idx]=cap
            idx=idx+1
        end
        last_end = e+1
        s, e, cap = str:find(fpat, last_end)
        if s == last_end then
            s = s+1
            e = e+1
            cap = string.sub(str, s, e)
        end
    end
    if last_end <= #str then
        cap = str:sub(last_end)
        t[idx]=cap
        idx=idx+1
    end
    t.length = idx
    return t
end
String.__CallImpl = function(self, val) 
    -- print ('string ctor: ' .. val)
    ns = __New(Object)
    val = __ToString(val)
    local uni = Utf8to32(val)
    ns.__ToStringValue = val
    ns.__Unicode = uni
    ns.__Prototype = String.prototype
    ns.length = #uni
    return ns
end
String.fromCharCode = function(self, ...)
    return string.char(...)
end
String.prototype.charCodeAt = function(self, idx)
    return self.__Unicode[idx+1] -- TODO unicode!
end
String.prototype.toString = __DefineFunction(function(self)
        return self.__ToStringValue
    end)
String.prototype.valueOf = String.prototype.toString
String.prototype.split = __DefineFunction(function(self, pat)
        return __MakeArray(__split(self.__ToStringValue, pat))
    end)
Object.defineProperty(Object, String.prototype, 'constructor',{["value"]=String,["writable"]=true,["configurable"]=true})
__JsGlobalObjects.String = String

-- Date
local Date = __New(Function)
Date.__CallImpl = function(self, val) 
    -- print ('date ctor: ' .. val)
    -- self.__Value = val or (os.time() * 1000)
    self.__Value = val or (os.clock() * 1000) -- prefer benchmark version
end
Date.prototype.getTime = function(self)
    return self.__Value
end
Date.prototype.toLocaleTimeString = __DefineFunction(__id)
Object.defineProperty(Object, Date.prototype, 'constructor',{["value"]=Date,["writable"]=true,["configurable"]=true})
__JsGlobalObjects.Date = Date


-- RegExp
local RegExp = __New(Function)
Object.defineProperty(Object, RegExp.prototype, 'constructor',{["value"]=RegExp,["writable"]=true,["configurable"]=true})
__JsGlobalObjects.RegExp = RegExp
RegExp.__CallImpl = function(self, val) 
    -- print ('RegExp ctor: ' .. val)
    self.__RegexValue = val
end
RegExp.prototype.exec = __DefineFunction(function(self)return null end)

-- Error
local Error = __New(Function)
Error.__CallImpl = function(self, ...) 
    -- print ('Error ctor: ')
    self.__Args = {...}
end
Object.defineProperty(Object, Error.prototype, 'constructor',{["value"]=Error,["writable"]=true,["configurable"]=true})
__JsGlobalObjects.Error = Error
local EvalError = __New(Function)
local RangeError = __New(Function)
local ReferenceError = __New(Function)
ReferenceError.__CallImpl = Error.__CallImpl -- TODO ctors should be inheritable?
ReferenceError.prototype.toString = __DefineFunction(function(self) return '[object ReferenceError]' end)
Object.defineProperty(Object, ReferenceError.prototype, 'constructor',{["value"]=ReferenceError,["writable"]=true,["configurable"]=true})
local SyntaxError = __New(Function)
SyntaxError.__CallImpl = Error.__CallImpl -- TODO ctors should be inheritable?
SyntaxError.prototype.toString = __DefineFunction(function(self) return '[object SyntaxError]' end)
Object.defineProperty(Object, SyntaxError.prototype, 'constructor',{["value"]=SyntaxError,["writable"]=true,["configurable"]=true})
local TypeError = __New(Function)
TypeError.__CallImpl = Error.__CallImpl -- TODO ctors should be inheritable?
TypeError.prototype.toString = __DefineFunction(function(self) return '[object TypeError]' end)
Object.defineProperty(Object, TypeError.prototype, 'constructor',{["value"]=TypeError,["writable"]=true,["configurable"]=true})
local URIError = __New(Function)
__JsGlobalObjects.EvalError = EvalError
__JsGlobalObjects.RangeError = RangeError
__JsGlobalObjects.ReferenceError = ReferenceError
__JsGlobalObjects.SyntaxError = SyntaxError
__JsGlobalObjects.TypeError = TypeError
__JsGlobalObjects.URIError = URIError

-- Global functions
local escape = __DefineFunction(function(self, str) return str end) -- TODO actually escape :)
__JsGlobalObjects.escape = escape
local unescape = __DefineFunction(function(self, str) return str end) -- TODO actually escape :)
__JsGlobalObjects.unescape = unescape
local parseInt = __DefineFunction(function(self, str) return tonumber(str) end) -- TODO int
__JsGlobalObjects.parseInt = parseInt
local parseFloat = __DefineFunction(function(self, str) return tonumber(str) end) -- TODO int
__JsGlobalObjects.parseFloat = parseFloat

local __IntrinsicTable={
    __PlusOp=__PlusOp,
    __CmpLess=__CmpLess,
    __CmpLessEqual=__CmpLessEqual,
    __CmpGreater=__CmpGreater,
    __CmpGreaterEqual=__CmpGreaterEqual,
    __ContainsKey=__ContainsKey,
    __InstanceOf=__InstanceOf,

    __ToString=__ToString,
    __ToBoolean=__ToBoolean,
    __ToPrimitive=__ToPrimitive,
    __ToObject=__ToObject,
    __ToNumber=__ToNumber,
    --'__Get',
    --'__Put',
    --'__PlusOp',
    __Delete=__Delete,
    --'__InstanceOf',
    __CallMember=__CallMember,
    __Call=__Call,
    __Typeof=__Typeof,
    __DefineFunction=__DefineFunction,
    __New=__New,
    --'__ContainsKey',
    __Sink=__Sink,
    __TernarySave=__TernarySave,
    __TernaryReplace=__TernaryReplace,
    __TernaryRestore=__TernaryRestore,
    __Iterate=__Iterate,
    __RefCheck=__RefCheck,
    __MakeArguments=__MakeArguments,
    __MakeArray=__MakeArray,
    __MakeObject=__MakeObject,
    __LastXpCall=__LastXpCall,
    --
    bit32=bit32,
    -- in globalobj
    -- Infinity=Infinity,
    -- NaN=NaN,
    __JsGlobalObjects=__JsGlobalObjects,
}

local function eval(dummy, code) -- uses js translator currently
    -- print('BEFORE EV')
    local tmpf = io.open('__eval.tmp','w') -- todo get rid of tmp files, and of running node altogether
    tmpf:write(__ToString(code))
    tmpf:close()
    local file = io.popen('node translator/just_translate.js < __eval.tmp','rb')
    -- This will read all of the output, as always
    local output = file:read('*all')
    -- This will get a table with some return stuff
    -- rc[1] will be true, false or nil
    -- rc[3] will be the signal
    local rc = {file:close()}
    -- print('IN EV')
    if output:sub(1,11)=='SyntaxError' then 
        -- print('SE')
        error(__New(SyntaxError)) 
    else
        -- print( '<<'..output..'>>')
        __IntrinsicTable.__RefCheck = __MakeEvalRefCheck(code)
        local func = load(output, '__evalcode__', nil, __IntrinsicTable)
        return func()
    end
end
-- NOTE __JsGlobalObjects is not a proper object yet :(
-- NOTE locals are not passed back and forth to eval code properly
-- LIBRARY END

local self = __JsGlobalObjects

local function fnGlobalObject()
    return __JsGlobalObjects
end

-- HARNESS END